const helpers = require("../helpers")
const moment = require("moment")
const { utils, Witnet, WitOracle } = require("../../../dist/src/lib")

const DEFAULT_BATCH_SIZE = 64

module.exports = async function (options = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)

  const witOracle = await WitOracle.fromJsonRpcUrl(
    `http://127.0.0.1:${options?.port || 8545}`,
    options?.signer,
  )

  const { address, network } = witOracle
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)

  const artifact = await witOracle.getEvmImplClass()
  const version = await witOracle.getEvmImplVersion()
  console.info(`> ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} ${helpers.colors.blue(`[ v${version} ]`)}`)

  let toBlock = BigInt(options?.toBlock || await witOracle.provider.getBlockNumber()) 
  let fromBlock = BigInt(options?.fromBlock || 0n)//toBlock - 1024n)

  let logs = (await witOracle.filterWitOracleQueryEvents({
    fromBlock,
    toBlock,
    where: {
      evmRequester: options["filter-requester"],
      queryRadHash: options["filter-radHash"],
    },
  }))
  
  const queryIds = logs.map(log => log.queryId)
  const queryStatuses = await helpers.prompter(
    Promise.all([...helpers.chunks(queryIds, DEFAULT_BATCH_SIZE)]
      .map(ids => witOracle.getQueryStatuses(ids))
    )
    .then(ids => ids.flat())
  )
  logs = logs.map((log, index) => ({ ...log, queryStatus: queryStatuses[index] }))
  if (!options.voids) {
    logs = logs.filter(log => log.queryStatus !== "Void");
  }
  const totalLogs = logs.length
  logs = logs.reverse().slice(0, options?.last || 64)
  if (fromBlock || options?.toBlock) {
    logs = logs.reverse()
  }
  const checkResults = options["check-result-status"]
  let traceBack = options["trace-back"]
  if (checkResults) {
    traceBack = false
    logs = await helpers.prompter(
      Promise.all(
        logs.map(async log => {
          const resultStatus = log.queryStatus !== "Void" ? await witOracle.getQueryResultStatusDescription(log.queryId) : ""
          let resultTTR = ""
          if (["Finalized", "Reported", "Disputed"].includes(log.queryStatus)) {
            const query = await witOracle.getQuery(log.queryId)
            const evmCheckpointBlock = await witOracle.provider.getBlock(query.checkpoint)
            const evmQueryBlock = await witOracle.provider.getBlock(log.evmBlockNumber)
            resultTTR = moment.duration(moment.unix(evmCheckpointBlock.timestamp).diff(moment.unix(evmQueryBlock.timestamp))).humanize();
          }
          return {
            ...log,
            resultStatus,
            resultTTR,
          }
        })
      ).catch(err => console.error(err))
    )
  } else if (traceBack) {
    logs = await Promise.all(
      logs.map(async log => {
        const response = await witOracle.getQueryResponse(log.queryId)
        return {
          ...log,
          resultDrTxHash: response.resultDrTxHash,
        }
      })
    ).catch(err => console.error(err))
  }
  
  if (logs.length > 0) {
    if (!traceBack) {
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          log.evmTransactionHash,
          log.queryId,
          ...(checkResults ? [] : [
            log.queryStatus,
            `${log.evmRequester?.slice(0, 8)}..${log.evmRequester?.slice(-4)}`,
            `${log.queryRadHash?.slice(2).slice(0, 6)}..${log.queryRadHash.slice(-5)}`,
            `${log.queryParams.witnesses}`, 
            `${Witnet.Coins.fromPedros(BigInt(log.queryParams.unitaryReward) * (3n + log.queryParams.witnesses)).toString(2)}`,
          ]),
          ...(checkResults ? [
            log.queryStatus,
            log.resultTTR,
            log.resultStatus,
          ] : []),
        ]),
        {
          colors: [ 
            helpers.colors.white,
            helpers.colors.gray,
            helpers.colors.lwhite,
            helpers.colors.mcyan,
            ...(checkResults ? [] : [
              helpers.colors.mblue,
              helpers.colors.mgreen,
              helpers.colors.green,
              helpers.colors.green,
            ]),
            ...(checkResults ? [
              helpers.colors.cyan,
              helpers.colors.cyan,
            ] : []),
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM DATA QUERYING TRANSACTION HASH",
            "QUERY ID:",
            ":QUERY STATUS",
            ...(checkResults ? [] : [
              "EVM REQUESTER",
              "RADON REQUEST",
              "witnesses",
              "witnet fees",
            ]),
            ...(checkResults ? [
              "T.T.R.:",
              ":RESULT STATUS",
            ] : []),
          ],
          humanizers: [helpers.commas,, helpers.commas],
        }
      )
    } else { // traceBack is ON
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          log.evmTransactionHash,
          log.queryId,
          log.resultDrTxHash.slice(2),
        ]),
        {
          colors: [ 
            helpers.colors.white,
            helpers.colors.gray,
            helpers.colors.lwhite,
            helpers.colors.mmagenta,
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM DATA QUERYING TRANSACTION HASH",
            "QUERY ID:",
            `QUERY'S RESOLUTION ACT ON ${helpers.colors.lwhite(`WITNET ${utils.isEvmNetworkMainnet(network) ? "MAINNET" : "TESTNET"}`)}`,
          ],
          humanizers: [helpers.commas,, helpers.commas],
        }
      )
    }
    process.stdout.write(`^ Showing last ${logs.length} oracle queries`)
    if (fromBlock || options?.toBlock) {
      process.stdout.write(` pulled within the specified period (out of ${totalLogs}).\n`) 
    } else {
      process.stdout.write(".\n")
    } 
  } else {
    console.info("> No oracle queries were pulled during this period.")
  }
}

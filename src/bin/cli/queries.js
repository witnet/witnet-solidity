const helpers = require("../helpers")
const moment = require("moment")

const { utils, Witnet, WitOracle } = require("../../../dist/src/lib")

const { DEFAULT_BATCH_SIZE, DEFAULT_LIMIT, DEFAULT_SINCE } = helpers

module.exports = async function (options = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)

  const { limit, offset, since } = options

  const witOracle = await WitOracle.fromJsonRpcUrl(
    `http://127.0.0.1:${options?.port || 8545}`,
    options?.signer,
  )

  const { address, network, provider } = witOracle
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)

  const artifact = await witOracle.getEvmImplClass()
  const version = await witOracle.getEvmImplVersion()
  console.info(`> ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} ${helpers.colors.blue(`[ v${version} ]`)}`)

  // determine current block number
  const blockNumber = await provider.getBlockNumber()

  // determine fromBlock
  let fromBlock
  if (since === undefined || since < 0) {
    fromBlock = BigInt(blockNumber) + BigInt(since ?? DEFAULT_SINCE)
  } else {
    fromBlock = BigInt(since ?? 0n)
  }

  // fetch events since specified block
  let logs = (await witOracle.filterWitOracleQueryEvents({
    fromBlock,
    where: {
      evmRequester: options["filter-requester"],
      queryRadHash: options["filter-radHash"],
    },
  }))

  // filter out unspecified query ids
  if (args && args.length > 0) {
    logs = logs.filter(log => args.includes(log.queryId.toString()))
  }

  // fetch query statuses
  const queryIds = logs.map(log => log.queryId)
  const queryStatuses = await helpers.prompter(
    Promise.all([...helpers.chunks(queryIds, DEFAULT_BATCH_SIZE)]
      .map(ids => witOracle.getQueryStatuses(ids))
    )
    .then(ids => ids.flat())
  )
  logs = logs.map((log, index) => ({ ...log, queryStatus: queryStatuses[index] }))

  // filter out deleted queries, if no otherwise specified
  if (!options.voids) {
    logs = logs.filter(log => log.queryStatus !== "Void");
  }

  // count logs before last filter
  const totalLogs = logs.length

  // apply limit/offset filter
  logs = (!since || BigInt(since) < 0n
    ? logs.slice(offset || 0).slice(0, limit || DEFAULT_LIMIT) // oldest first
    : logs.reverse().slice(offset || 0).slice(0, limit || DEFAULT_LIMIT) // latest first
  )
  
  let traceBack = options["trace-back"]
  const checkResults = options["check-result-status"]
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
            ...(checkResults ? [
              helpers.colors.cyan,
            ] : [
              helpers.colors.mcyan,
              helpers.colors.mblue,
              helpers.colors.mgreen,
              helpers.colors.green,
              helpers.colors.green,
            ]),
            ...(checkResults ? [
              helpers.colors.magenta,
              helpers.colors.mmagenta,
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
    console.info(`^ Listed ${logs.length} out of ${totalLogs} queries${
      fromBlock ? ` since block #${helpers.commas(fromBlock)}.` : ` up until current block #${helpers.colors.lwhite(helpers.commas(blockNumber))}.`
    }`)
  } else {
    console.info(`^ No oracle queries${fromBlock ? ` since block #${helpers.colors.lwhite(helpers.commas(fromBlock))}.` : "."}`)
  }
}

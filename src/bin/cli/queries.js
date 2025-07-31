const helpers = require("../helpers")
const { WitOracle } = require("../../../dist/src/lib")

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
  console.info(`> ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} (${version})`)

  const toBlock = BigInt(options?.toBlock || await witOracle.provider.getBlockNumber())
  const fromBlock = BigInt(options?.fromBlock || toBlock - 1024n)

  const logs = (await witOracle.filterWitOracleQueryEvents({
    fromBlock,
    toBlock,
    where: {
      evmRequester: options["filter-requester"],
      queryRadHash: options["filter-radHash"],
    },
  })).reverse().slice(0, options?.limit || 64)

  const queryIds = logs.map(log => log.queryId)
  const queryStatuses = await witOracle.getQueryStatuses(queryIds)
  const queryResultDescriptions = []
  const checkResultStatus = options["check-result-status"]
  if (checkResultStatus) {
    for (const queryId of queryIds) {
      queryResultDescriptions.push(
        await witOracle.getQueryResultStatusDescription(queryId)
      )
    }
  }
  if (logs.length > 0) {
    helpers.traceTable(
      logs.map((log, index) => [
        log.evmBlockNumber,
        log.evmTransactionHash,
        `${log.evmRequester?.slice(0, 7)}..${log.evmRequester?.slice(-5)}`,
        helpers.colors.mgreen(`${log.queryRadHash?.slice(2).slice(0, 6)}..${log.queryRadHash.slice(-6)}`),
        helpers.colors.green(`[ ${Object.values(log.queryParams).join(", ")} ]`),
        log.queryId,
        queryStatuses[index],
        ...(checkResultStatus ? [queryResultDescriptions[index]] : []),
      ]),
      {
        colors: [
          helpers.colors.lwhite,
          helpers.colors.white,
          helpers.colors.gray,,,
          helpers.colors.yellow,
          helpers.colors.myellow,
          ...(checkResultStatus ? [helpers.colors.cyan] : []),
        ],
        headlines: [
          "EVM BLOCK:",
          "EVM TRANSACTION HASH",
          "EVM REQUESTER",
          "QUERY RAD HASH",
          "QUERY SLA PARAMS",
          "QUERY ID:",
          ":QUERY STATUS",
          ...(checkResultStatus ? [":RESULT STATUS"] : []),
        ],
        humanizers: [helpers.commas,,,,, helpers.commas],
      }
    )
    process.stdout.write(`^ Showing ${logs.length} oracle queries pulled`)
  } else {
    process.stdout.write("> No oracle queries were pulled")
  }
  process.stdout.write(` between blocks ${helpers.commas(fromBlock)} and ${helpers.commas(toBlock)}.\n`)
}

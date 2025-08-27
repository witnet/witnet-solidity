const ethers = require("ethers")
const helpers = require("../helpers")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()

const { KermitClient, WitOracle, utils } = require("../../../dist/src/lib")

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

  if (options["dr-tx-hash"]) {
    const drTxHash = options["dr-tx-hash"]
    if (!utils.isHexStringOfLength(drTxHash, 32)) {
      throw new Error(`invalid <WIT_DR_TX_HASH>: ${drTxHash}`)
    } else if (!options?.into) {
      throw new Error("--into <EVM_ADDRESS> must be specified")
    }

    console.info(helpers.colors.lwhite("\n  Fetching result to Wit/Oracle query:"))

    const consumer = await witOracle.getWitOracleConsumerAt(options.into)
    const kermit = await KermitClient.fromEnv(options?.kermit)
    console.info(`  > Wit/Kermit provider: ${kermit.url}`)
    const report = await kermit.getDataPushReport(drTxHash, network)

    if (report?.query) {
      console.info(`  > Witnet DRT hash:     ${report.hash}`)
      console.info(`  > Witnet RAD hash:     ${report.query.rad_hash}`)
      console.info(`  > Witnet DRO hash:     ${report.query.dro_hash}`)

      if (report?.result) {
        console.info(`  > Witnet DRT result:   ${JSON.stringify(utils.cbor.decode(utils.fromHexString(report.result.cbor_bytes)))}`)
        console.info(`  > Witnet DRT clock:    ${moment.unix(report.result.timestamp).fromNow()}`)

        if (!report.result.finalized) {
          const user = await prompt([{
            message: "> The Wit/Oracle query is not yet finalized. Proceed anyway ?",
            name: "continue",
            type: "confirm",
            default: false,
          }])
          if (!user.continue) {
            process.exit(0)
          }
        }

        console.info(`\n  ${helpers.colors.lwhite("WitOracleConsumer")}:   ${helpers.colors.lblue(options.into)}`)
        const message = utils.abiEncodeDataPushReportMessage(report)
        const digest = utils.abiEncodeDataPushReportDigest(report)
        helpers.traceData("  > Push data report:  ", message.slice(2), 64, "\x1b[90m")
        console.info(`  > Push data digest:  ${digest.slice(2)}`)
        console.info(`  > Push data proof:   ${report.evm_proof.slice(2)}`)

        await consumer.pushDataReport(report, {
          confirmations: options?.confirmations || 1,
          gasLimit: options?.gasLimit,
          gasPrice: options?.gasPrice,
          onDataPushReportTransaction: (txHash) => {
            process.stdout.write(`  > Pushing report  => ${helpers.colors.gray(txHash)} ... `)
          },
        }).catch(err => {
          process.stdout.write(`${helpers.colors.mred("FAIL")}\n`)
          console.error(err)
        })
        process.stdout.write(`${helpers.colors.lwhite("OK")}\n`)
      } else {
        console.info("  Skipped: the Wit/Oracle query exists but has not yet been solved.")
      }
    } else {
      console.info("  Skipped: the Wit/Oracle query does not exist.")
    }
  }

  const toBlock = BigInt(options?.toBlock || await witOracle.provider.getBlockNumber())
  const fromBlock = BigInt(options?.fromBlock || 0n)//toBlock - 1024n)

  let logs = (await witOracle.filterWitOracleReportEvents({
    fromBlock,
    toBlock,
    where: {
      evmOrigin: options?.signer,
      evmConsumer: options["filter-consumer"],
      queryRadHash: options["filter-radHash"],
    },
  }))
  let totalLogs = logs.length
  logs = logs.reverse().slice(0, options?.last || 64)
  if (fromBlock || options?.toBlock) {
    logs = logs.reverse()
  }

  if (logs.length > 0) {
    if (!options["trace-back"]) {
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          log.evmTransactionHash,
          `${log.evmOrigin.slice(0, 8)}..${log.evmOrigin.slice(-4)}`,
          `${log?.evmConsumer.slice(0, 8)}..${log?.evmConsumer.slice(-4)}`,
          helpers.colors.mgreen(`${log?.queryRadHash?.slice(2).slice(0, 6)}..${log?.queryRadHash.slice(-5)}`),
          utils.cbor.decode(utils.fromHexString(log?.resultCborBytes)),
        ]),
        {
          colors: [
            helpers.colors.white,
            helpers.colors.gray,
            helpers.colors.blue,
            helpers.colors.mblue,
            ,
            helpers.colors.mcyan,
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM DATA PUSHING TRANSACTION HASH",
            "EVM PUSHER",
            "EVM CONSUMER",
            ":RADON REQUEST",
            `REPORTED DATA`,
          ],
          humanizers: [helpers.commas,,,,,,],
        }
      )
    } else {
      logs = await helpers.prompter(
        Promise.all(logs.map(async log => {
          const ethBlock = await witOracle.provider.getBlock(log.evmBlockNumber)
          return {
            ...log,
            ethBlockTimestamp: ethBlock.timestamp
          }
        })).catch(err => console.error(err))
      )
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          log.evmTransactionHash,
          log.witDrTxHash.slice(2),
          moment.duration(moment.unix(log.ethBlockTimestamp).diff(moment.unix(log.resultTimestamp))).humanize(),
        ]),
        {
          colors: [
            helpers.colors.white,
            helpers.colors.gray,
            helpers.colors.mmagenta,
            helpers.colors.magenta,
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM DATA PUSHING TRANSACTION HASH",
            `DATA WITNESSING ACT ON ${helpers.colors.lwhite(`WITNET ${utils.isEvmNetworkMainnet(network) ? "MAINNET" : "TESTNET"}`)}`,
            "FRESHNESS"
          ],
          humanizers: [helpers.commas,,,,,,],
        }
      )
    }
    process.stdout.write(`^ Showing last ${logs.length} push data reports`)
    if (fromBlock || options?.toBlock) {
      process.stdout.write(` within the specified period (out of ${totalLogs}).\n`) 
    } else {
      process.stdout.write(".\n")
    } 
  } else {
    console.info("^ No data reports pushed during this period.")
  }
}

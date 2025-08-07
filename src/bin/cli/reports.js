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
  console.info(`  ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} (${version})`)

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
  const fromBlock = BigInt(options?.fromBlock || toBlock - 1024n)

  const logs = (await witOracle.filterWitOracleReportEvents({
    fromBlock,
    toBlock,
    where: {
      evmOrigin: options?.signer,
      evmConsumer: options["filter-consumer"],
      queryRadHash: options["filter-radHash"],
    },
  })).reverse().slice(0, options?.limit || 64)

  if (logs.length > 0) {
    if (options?.verbose) {
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          `${log.evmOrigin.slice(0, 7)}..${log.evmOrigin.slice(-5)}`,
          `${log?.evmConsumer.slice(0, 7)}..${log?.evmConsumer.slice(-5)}`,
          helpers.colors.mgreen(`${log?.queryRadHash?.slice(2).slice(0, 6)}..${log?.queryRadHash.slice(-6)}`),
          helpers.colors.green(`[ ${Object.values(log?.queryParams).join(", ")} ]`),
          utils.cbor.decode(utils.fromHexString(log?.resultCborBytes)),
          moment.unix(log.resultTimestamp).fromNow(),
        ]),
        {
          colors: [
            helpers.colors.lwhite,
            helpers.colors.gray,
            helpers.colors.gray,
            ,,
            helpers.colors.mcyan,
            helpers.colors.cyan,
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM PUSHER",
            "EVM CONSUMER",
            ":WITNET RADON HASH",
            "WITNET QUERY PARAMS",
            "WITNET QUERY RESULT",
            "WITNET TIMESTAMP",
          ],
          humanizers: [helpers.commas,,,,,,],
        }
      )
    } else {
      helpers.traceTable(
        logs.map(log => [
          log.evmBlockNumber,
          log.evmTransactionHash,
          log.witDrTxHash.slice(2),
          // log.witDrTxRadHash
        ]),
        {
          colors: [
            helpers.colors.lwhite,
            helpers.colors.gray,
            helpers.colors.green,
            // helpers.colors.mgreen,
          ],
          headlines: [
            "EVM BLOCK:",
            "EVM PUSH DATA REPORT TRANSACTION HASH",
            `DATA WITNESSING ACT ON WITNET ${utils.isEvmNetworkMainnet(network) ? "MAINNET" : "TESTNET"}`,
            // "WITNET RAD HASH",
          ],
          humanizers: [helpers.commas,,,,,,],
        }
      )
    }
    process.stdout.write(`^ Showing ${logs.length} push data reports`)
  } else {
    process.stdout.write("\n^ No data reports pushed")
  }
  process.stdout.write(` between blocks ${helpers.commas(fromBlock)} and ${helpers.commas(toBlock)}.\n`)
}

const ethers = require("ethers")
const helpers = require("../helpers")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()

const { utils, WitOracle } = require("../../../dist/src/lib")
const { DEFAULT_LIMIT, DEFAULT_SINCE } = helpers

module.exports = async function (options = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)

  const { limit, offset, since } = options

  const witOracle = await WitOracle.fromJsonRpcUrl(
    `http://127.0.0.1:${options?.port || 8545}`,
    options?.signer,
  )

  const { network, provider } = witOracle
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
  const framework = helpers.getNetworkAddresses(network)

  let target = args[0]
  if (!target) {
    const contracts = Object.fromEntries(Object.entries(framework?.apps).filter(([key]) => key.startsWith("WitRandomness")))
    if (Object.keys(contracts).length === 1) {
      target = Object.values(contracts)[0]
    } else {
      const selection = await prompt([{
        choices: Object.values(contracts),
        message: "Select WitRandomness address ... ",
        name: "addr",
        type: "rawlist",
      }])
      target = selection.addr
    }
  }
  const randomizer = await witOracle.getWitRandomnessAt(target)

  const symbol = utils.getEvmNetworkSymbol(network)
  const artifact = await randomizer.getEvmImplClass()
  const version = await randomizer.getEvmImplVersion()
  const maxWidth = Math.max(18, artifact.length + 2)
  console.info(
    `> ${
      helpers.colors.lwhite(artifact)
    }:${
      " ".repeat(maxWidth - artifact.length)
    }${
      helpers.colors.lblue(target)
    } ${
      helpers.colors.blue(`[ ${version} ]`)
    }`
  )

  if (options?.randomize) {
    const receipt = await randomizer.randomize({
      evmConfirmations: options?.confirmations || 1,
      evmGasPrice: options?.gasPrice,
      evmTimeout: options?.timeout,
      onRandomizeTransaction: (txHash) => {
        console.info(`> EVM signer:${" ".repeat(maxWidth - 10)}${helpers.colors.gray(randomizer.signer.address)}`)
        process.stdout.write(`> EVM transaction:${" ".repeat(maxWidth - 15)}${helpers.colors.gray(txHash)} ... `)
      },
      onRandomizeTransactionReceipt: () => {
        process.stdout.write(`${helpers.colors.lwhite("OK")}\n`)
      },
    }).catch(err => {
      process.stdout.write(`${helpers.colors.mred("FAIL")}`)
      console.error(err)
      throw err
    })
    if (receipt) {
      console.info(`> EVM block number:${" ".repeat(maxWidth - 16)}${helpers.colors.lwhite(helpers.commas(receipt?.blockNumber))}`)
      console.info(`> EVM tx gas price:${" ".repeat(maxWidth - 16)}${helpers.colors.lwhite(helpers.commas(receipt?.gasPrice))} weis`)
      console.info(`> EVM tx fee:${" ".repeat(maxWidth - 10)}${helpers.colors.lwhite(ethers.formatEther(receipt.fee))} ETH`)
      console.info(`> EVM randomize fee:${" ".repeat(maxWidth - 17)}${helpers.colors.lwhite(ethers.formatEther((
        await receipt.getTransaction()
      ).value))} ETH`)
    }
  }

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
  let logs = await randomizer.filterEvents({ fromBlock })

  // count logs before last filter
  const totalLogs = logs.length

  // apply limit/offset filter
  logs = (!since || BigInt(since) < 0n
    ? logs.slice(offset || 0).slice(0, limit || DEFAULT_LIMIT) // oldest first
    : logs.reverse().slice(offset || 0).slice(0, limit || DEFAULT_LIMIT) // latest first
  )

  // fetch randomize status and evm cost for each log entry
  logs = await helpers.prompter(
    Promise.all(
      logs.map(async log => {
        const block = await provider.getBlock(log.blockNumber)
        const receipt = await provider.getTransactionReceipt(log.transactionHash)
        const status = await randomizer.getRandomizeStatus(log.blockNumber)
        const transaction = await provider.getTransaction(log.transactionHash)
        let readiness = {}
        if (status === "Ready") {
          const randomness = options["trace-back"] ? await randomizer.fetchRandomnessAfter(log.blockNumber) : undefined
          let { finality, trail, timestamp } = await randomizer.fetchRandomnessAfterProof(log.blockNumber)
          if (finality) timestamp = (await provider.getBlock(finality)).timestamp
          const ttr = moment.duration(moment.unix(timestamp).diff(moment.unix(Number(block.timestamp)))).humanize()
          readiness = { finality, randomness, trail, ttr }
        }
        return {
          ...log,
          cost: transaction.value + receipt.gasPrice * receipt.gasUsed,
          gasPrice: receipt.gasPrice,
          origin: transaction.from,
          status,
          ...readiness,
        }
      })
    ).catch(err => console.error(err))
  )
  if (logs.length > 0) {
    if (options["trace-back"]) {
      helpers.traceTable(
        logs.map(log => [
          log.blockNumber,
          log.randomness,
          log.trail?.slice(2),
        ]),
        {
          colors: [
            helpers.colors.white,
            helpers.colors.green,
            helpers.colors.magenta,
          ],
          headlines: [
            "EVM BLOCK:",
            "WITNET-GENERATED RANDOMNESS",
            `RANDOMIZE WITNESSING ACT ON ${helpers.colors.lwhite(`WITNET ${utils.isEvmNetworkMainnet(network) ? "MAINNET" : "TESTNET"}`)}`,
          ],
          humanizers: [helpers.commas],
        }
      )
    } else {
      helpers.traceTable(
        logs.map(log => [
          log.blockNumber,
          log.origin, // `${log.origin?.slice(0, 8)}..${log.origin?.slice(-4)}`,
          (
            Number(log.gasPrice) / 10 ** 9 < 1.0
              ? Number(Number(log.gasPrice) / 10 ** 9).toFixed(6)
              : helpers.commas(Number(Number(log.gasPrice) / 10 ** 9).toFixed(1))
          ) + " gwei",
          Number(Number(log.cost) / 10 ** 18).toFixed(9),
          log.ttr,
          log.status === "Error"
            ? helpers.colors.mred("Error")
            : (log.status === "Ready"
              ? helpers.colors.mgreen("Ready")
              : helpers.colors.yellow(log.status)
            ),

        ]),
        {
          colors: [
            helpers.colors.white,
            helpers.colors.mblue,
            helpers.colors.blue,
            helpers.colors.gray,,
            helpers.colors.magenta,
          ],
          headlines: [
            "EVM BLOCK:",
            ":EVM RANDOMIZER",
            "EVM GAS PRICE",
            `$${helpers.colors.lwhite(symbol)} COST`,
            "T.T.R.",
            ":STATUS",
          ],
          humanizers: [helpers.commas],
        }
      )
    }
    console.info(`^ Listed ${logs.length} out of ${totalLogs} randomness requests${
      fromBlock ? ` since block #${helpers.commas(fromBlock)}.` : ` up until current block #${helpers.colors.lwhite(helpers.commas(blockNumber))}.`
    }`)
  } else {
    console.info(`^ No randomness requests${fromBlock ? ` since block #${helpers.colors.lwhite(helpers.commas(fromBlock))}.` : "."}`)
  }
}

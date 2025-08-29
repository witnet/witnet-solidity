const helpers = require("../helpers")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()
const { utils, Witnet, WitOracle } = require("../../../dist/src/lib")

module.exports = async function (options = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)

  const witOracle = await WitOracle.fromJsonRpcUrl(
    `http://127.0.0.1:${options?.port || 8545}`,
    options?.signer,
  )

  const { network } = witOracle
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
  const framework = helpers.getNetworkAddresses(network)

  let target = args[0]
  if (!target) {
    const contracts = Object.fromEntries(Object.entries(framework?.apps).filter(([key]) => key.startsWith("WitPriceFeeds")))
    if (Object.keys(contracts).length === 1) {
      target = Object.values(contracts)[0]
    } else {
      const selection = await prompt([{
        choices: Object.values(contracts),
        message: "Select EVM contract address ... ",
        name: "addr",
        type: "rawlist",
      }])
      target = selection.addr
    }
  }
  let pfs
  try {
    pfs = await witOracle.getWitPriceFeedsAt(target)
  } catch {
    pfs = await witOracle.getWitPriceFeedsLegacyAt(target)
  }
  const artifact = await pfs.getEvmImplClass()
  if (artifact.indexOf("Legacy") >= 0) {
    pfs = await witOracle.getWitPriceFeedsLegacyAt(target)
  }
  const version = await pfs.getEvmImplVersion()
  const maxWidth = Math.max(18, artifact.length + 2)
  console.info(`> ${helpers.colors.lwhite(artifact)}:${" ".repeat(maxWidth - artifact.length)}${helpers.colors.lblue(target)} ${helpers.colors.blue(`[ v${version} ]`)}`)

  let priceFeeds = await pfs.lookupPriceFeeds()

  const traceBack = options["trace-back"]
  const dryRun = options["dry-run"]
  if (!traceBack || dryRun) {
    const registry = await witOracle.getWitOracleRadonRegistry()
    priceFeeds = await helpers.prompter(
      Promise.all(
        priceFeeds.map(async pf => {
          let providers, dryrun
          const bytecode = await registry.lookupRadonRequestBytecode(pf.oracle.dataSources)
          if (!traceBack) {
            const request = Witnet.Radon.RadonRequest.fromBytecode(bytecode)
            providers = request.sources.map(source => {
              const authority = source.authority.split('.').slice(-2)[0]
              return authority[0].toUpperCase() + authority.slice(1)
            })
          }
          if (dryRun) {
            // TODO
          }
          return {
            ...pf,
            dryrun,
            providers
          }
        })
      ).catch(err => console.error(err))
    )
  }
  
  if (priceFeeds?.length > 0) {
    helpers.traceTable(
      priceFeeds.map(pf => [
        pf.id,
        pf.symbol,
        helpers.colors.mgreen(`${pf.oracle?.dataSources?.slice(2).slice(0, 6)}..${pf.oracle?.dataSources.slice(-5)}`),
        pf.lastUpdate.value.toFixed(6),
        moment.unix(Number(pf.lastUpdate.timestamp)).fromNow(),
        ...(traceBack ? [pf.lastUpdate.trackHash.slice(2)] : [pf?.providers.join(", ")]),
      ]),
      {
        colors: [
          helpers.colors.lwhite,
          helpers.colors.lgreen,
          helpers.colors.mgreen,
          helpers.colors.mcyan,
          helpers.colors.magenta,
          helpers.colors.mmagenta,
        ],
        headlines: [
          ":ID4",
          ":CAPTION",
          ":RADON REQUEST",
          "LAST PRICE:",
          "FRESHNESS:",
          options["trace-back"] 
            ? `DATA WITNESSING ACT ON ${helpers.colors.lwhite(`WITNET ${utils.isEvmNetworkMainnet(network) ? "MAINNET" : "TESTNET"}`)}`
            : "DATA PROVIDERS"
        ],
      }
    )
  } else {
    console.info("> No price feeds currently supported.")
  }
}

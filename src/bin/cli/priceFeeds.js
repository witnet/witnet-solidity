const { Witnet } = require("@witnet/sdk")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()
const { utils, WitOracle } = require("../../../dist/src/lib")
const helpers = require("../helpers.js")

module.exports = async function (options = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)

  const witOracle = await WitOracle.fromJsonRpcUrl(
    `http://127.0.0.1:${options?.port || 8545}`,
    options?.signer,
  )

  const { network, provider } = witOracle
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
  const framework = await helpers.prompter(utils.fetchWitOracleFramework(provider))

  let target = args[0]
  let chosen = false
  if (!target) {
    const artifacts = Object.entries(framework).filter(([key]) => key.startsWith("WitPriceFeeds"))
    if (artifacts.length === 1) {
      target = artifacts[0][1].address
    } else {
      const selection = await prompt([{
        choices: artifacts.map(([key, artifact]) => artifact.address),
        message: "Price feeds contract:",
        name: "target",
        type: "rawlist",
      }])
      target = selection.target
      chosen = true
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
  console.info(
    `> ${
      helpers.colors.lwhite(artifact)
    }:${
      " ".repeat(maxWidth - artifact.length)
    }${
      chosen ? "" : helpers.colors.lblue(target) + " "
    }${
      helpers.colors.blue(`[ ${version} ]`)
    }`
  )

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
              const authority = source.authority.split(".").slice(-2)[0]
              return authority[0].toUpperCase() + authority.slice(1)
            })
          }
          if (dryRun) {
            // TODO
          }
          return {
            ...pf,
            dryrun,
            providers,
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
            : "DATA PROVIDERS",
        ],
      }
    )
  } else {
    console.info("> No price feeds currently supported.")
  }
}

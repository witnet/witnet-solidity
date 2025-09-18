const { Contract, JsonRpcProvider } = require("ethers")
const helpers = require("../helpers.js")
const { utils } = require("../../../dist/src/lib")
const { ABIs } = require("witnet-solidity-bridge").default

const deployables = helpers.readWitnetJsonFiles("templates", "modals")

module.exports = async function (flags = {}, params = []) {
  let [args] = helpers.deleteExtraFlags(params)

  let provider
  try {
    provider = new JsonRpcProvider(`http://127.0.0.1:${flags?.port || 8545}`)
  } catch (err) {
    throw new Error(`Unable to connect to local ETH/RPC gateway: ${err.message}`)
  }
  const chainId = (await provider.getNetwork()).chainId
  const network = utils.getEvmNetworkByChainId(chainId)
  if (!network) {
    throw new Error(`Connected to unsupported EVM chain id: ${chainId}`)
  }
  
  let artifacts = {}
  if (flags?.templates || flags?.modals) {
    const assets = helpers.importRadonAssets(flags)
    if (flags?.templates) {
      const dict = utils.flattenRadonTemplates(assets)
      if (Object.keys(dict).length > 0 && deployables.templates[network]) {
        artifacts.templates = Object.fromEntries(
          Object
            .entries(deployables.templates[network])
            .filter(([key]) => dict[key] !== undefined) 
            .map(([key, address]) => [key, { address }])
        )
      }
    }
    if (flags?.modals) {
      const dict = utils.flattenRadonModals(assets)
      if (Object.keys(dict).length > 0 && deployables.modals[network]) {
        artifacts.modals = Object.fromEntries(
          Object
            .entries(deployables.modals[network])
            .filter(([key]) => dict[key] !== undefined)
            .map(([key, address]) => [key, { address }])
        )
      }
    }   
  } else {
    const addresses = Object.fromEntries(
      Object.entries(helpers.flattenObject(helpers.getNetworkAddresses(network)))
        .map(([key, addr]) => [
          key.split(".").slice(-1)[0],
          addr
        ])
      );
    const contracts = Object.fromEntries(
      Object.entries(helpers.flattenObject(helpers.getNetworkArtifacts(network))).map(
        ([key, addr]) => [
          key.split(".").slice(-1)[0],
          addr
        ]
      )
    )
    const exclusions = [
      "WitOracleRadonRequestFactoryModals",
      "WitOracleRadonRequestFactoryTemplates",
    ]
    const targets = [
      "WitOracle",
      "WitOracleRadonRegistry",
      "WitOracleRadonRequestFactory",
      // "WitOracleRequestFactory",
      "WitPriceFeeds",
      "WitRandomnessV2",
      "WitRandomnessV3",
    ]
    artifacts = helpers.orderKeys(Object.fromEntries(
      Object.entries(addresses)
        .filter(([key,]) => targets.includes(key) && !exclusions.includes(findBase(contracts, key)))
        .map(([key, address ]) => [key, { address }])
      ));
    if (!args || args.length === 0) {
      args = ["WitOracle"]
    }
  }
  artifacts = (await helpers.prompter(
    Promise.all(
      Object.entries(artifacts).map(async ([key, obj]) => {
        const code = await provider.getCode(obj.address)
        if (code.length < 3) return [key, undefined];
        let impl, isUpgradable, specs, version
        const appliance = new Contract(obj.address, ABIs.WitAppliance, provider)
        try { impl = await appliance.class.staticCall() } catch { impl = key }
        try { specs = await appliance.specs.staticCall() } catch {}
        const upgradable = new Contract(obj.address, ABIs.WitnetUpgradableBase, provider)
        try { isUpgradable = await upgradable.isUpgradable.staticCall() } catch { isUpgradable = false }
        try { version = await upgradable.version.staticCall() } catch { version = "" }
        return [
          key,
          { ...obj, impl, isUpgradable, specs, version }
        ]
      })
    )
  )).filter(([,obj]) => obj !== undefined)
  helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
  helpers.traceTable(
    artifacts.map(([key, obj]) => {
      const match = includes(args, key)
      return [
        match ? helpers.colors.lwhite(key) : helpers.colors.white(key),
        match ? helpers.colors.mblue(obj.address) : helpers.colors.blue(obj.address),
        match ? helpers.colors.mgreen(obj.specs) : helpers.colors.green(obj.specs),
        ...(flags?.verbose ? [
          match ? helpers.colors.myellow(obj.impl) : helpers.colors.yellow(obj.impl),
          helpers.colors.gray(obj?.version || ""),
        ] : [])
      ]
    }), {
      headlines: [ 
        ":WIT/ORACLE FRAMEWORK", 
        ":EVM CONTRACT ADDRESS",
        ":EVM SPECS", 
        ...(flags?.verbose ? [":DEPLOYED CONTRACT", ":VERSION" ] : []) 
      ],
    }
  )
}

const findBase = (obj, value) => {
  Object.entries(obj).find(([, impl]) => impl === value)?.[0]
}

const includes = (selection, key) => {
    return selection.filter(
      artifact => key.toLowerCase().endsWith(artifact.toLowerCase())
    ).length > 0
  }
#!/usr/bin/env node

require("dotenv").config()
const { JsonRpcProvider } = require("ethers")

const helpers = require("./helpers")
const { green, yellow, lwhite } = helpers.colors

const { utils } = require("../../dist/src/lib")

/// CONSTANTS AND GLOBALS =============================================================================================

const settings = {
  flags: {
    all: "List all available Radon assets, even if not yet deployed.",
    apps: "Show addresses of Wit/Oracle appliances.",
    await: "Hold down until next event is triggered.",
    "check-result-status": "Check result status for each oracle query.",
    decode: "Decode selected Radon assets, as currently deployed.",
    deploy: "Deploy selected Radon assets, if not yet deployed.",
    "dry-run": "Dry-run selected Radon asset, as currently deployed (supersedes --decode).",
    force: "Force operations without user intervention.",
    help: "Describe how to use some command.",
    legacy: "Filter to those declared in witnet/assets folder.",
    mainnets: "List supported EVM mainnets.",
    randomize: "Pay for a new randomize request.",
    requests: "Includes WitOracleRequest artifacts.",
    templates: "List deployed WitOracleRadonRequestTemplate contracts.",
    testnets: "List supported EVM testnets.",
    verbose: "Outputs detailed information.",
    version: "Print binary name and version as headline.",
  },
  options: {
    confirmations: {
      hint: "Number of block confirmations to wait for after an EVM transaction gets mined.",
      param: "NUMBER",
    },
    contract: {
      hint: "Path or name of the new mockup contract to be created",
      param: "path/to/output",
    },
    depth: {
      hint: "Maximum number of randomize transactions to list, before the latest one (default: 16).",
    },
    "filter-consumer": {
      hint: "Filter events triggered by given consumer.",
      param: "EVM_ADDRESS",
    },
    "filter-requester": {
      hint: "Filter events triggered by given requester.",
      param: "EVM_ADDRESS",
    },
    "filter-radHash": {
      hint: "Filter events referring given RAD hash.",
      param: "RAD_HASH_FRAGMENT",
    },
    fromBlock: {
      hint: "Process events since given EVM block number.",
      param: "EVM_BLOCK",
    },
    gasPrice: {
      hint: "EVM gas price to pay for.",
      param: "GAS_PRICE",
    },
    gasLimit: {
      hint: "Maximum EVM gas to spend per transaction.",
      param: "GAS_LIMIT",
    },
    limit: {
      hint: "Limit number of output records (default: 64).",
      param: "LIMIT",
    },
    into: {
      hint: "Address of some WitOracleConsumer contract where to report into.",
      param: "EVM_ADDRESS",
    },
    module: {
      hint: "Package where to fetch Radon assets from (supersedes --legacy).",
      param: "NPM_PACKAGE",
    },
    network: {
      hint: "Bind mockup contract to immutable Wit/Oracle addresses on this EVM network.",
      param: "NETWORK",
    },
    port: {
      hint: "Port on which the local ETH/RPC signing gateway is expected to be listening (default: 8545).",
      param: "HTTP_PORT",
    },
    provider: {
      hint: "Force the local gateway to rely on this remote ETH/RPC provider.",
      param: "PROVIDER_URL",
    },
    "dr-tx-hash": {
      hint: "Retrieve the finalized result to the given Wit/Oracle query, and push it into some consumer contract (requires: --into).",
      param: "WIT_DR_TX_HASH",
    },
    signer: {
      hint: "EVM signer address, other than gateway's default.",
      param: "EVM_ADDRESS",
    },
    target: {
      hint: "Address of the contract to interact with.",
      param: "EVM_ADDRESS",
    },
    toBlock: {
      hint: "Process events emitted before this EVM block number.",
      param: "EVM_BLOCK",
    },
    witnet: {
      hint: "Wit/Oracle RPC provider to connect to, other than default.",
      param: "URL",
    },
    // witnesses: {
    //   hint: "Number of witnessing nodes required to solve the randomness request in the Witnet blockchain.",
    //   param: "NUMBER",
    // },
  },
  envars: {
    ETHRPC_PRIVATE_KEYS: "=> Private keys used by the ETH/RPC gateway for signing EVM transactions.",
    ETHRPC_PROVIDER_URL: "=> Remote ETH/RPC provider to rely on, if no otherwise specified.",
    WITNET_KERMIT_PROVIDER_URL: "=> Wit/Kermit API-REST provider to connect to, if no otherwise specified.",
  },
}

/// MAIN WORKFLOW =====================================================================================================

main()

async function main () {
  let ethRpcPort = 8545
  if (process.argv.indexOf("--port") >= 0) {
    ethRpcPort = parseInt(process.argv[process.argv.indexOf("--port") + 1])
  }
  let ethRpcProvider, ethRpcNetwork
  try {
    ethRpcProvider = new JsonRpcProvider(`http://127.0.0.1:${ethRpcPort}`)
    ethRpcNetwork = utils.getEvmNetworkByChainId((await ethRpcProvider.getNetwork()).chainId)
  } catch (err) {}

  const router = {
    ...(ethRpcNetwork
      ? {
        assets: {
          hint: `Formally verify deployable Radon assets into ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          params: "[RADON_ASSETS ...]",
          flags: ["all", "decode", "deploy", "dry-run", "legacy"],
          options: [
            "module",
            "port",
            "signer",
          ],
        },
        contracts: {
          hint: `List available Wit/Oracle Framework addresses in ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          params: "[ARTIFACT_NAMES ...]",
          flags: [
            // 'apps',
            "templates",
          ],
          options: [
            "port",
          ],
        },
        priceFeeds: {
          hint: `Show latest Wit/Price Feeds updates on ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          params: "[EVM_ADDRESS]",
        },
        queries: {
          hint: `Show latest Wit/Oracle queries pulled from ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          // params: "[TOPICS ...]",
          flags: [
            "check-result-status",
          ],
          options: [
            "filter-radHash",
            "filter-requester",
            "fromBlock",
            "limit",
            "signer",
            "toBlock",
          ],
          envars: [],
        },
        randomness: {
          hint: `Show latest Wit/Randomness seeds randomized from ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          params: "[EVM_ADDRESS]",
          flags: [
            "randomize",
          ],
          options: [
            "confirmations",
            "depth",
            "gasPrice",
            "signer",
          ],
          envars: [],
        },
        reports: {
          hint: `Show latest Wit/Oracle data reports pushed into ${helpers.colors.mcyan(ethRpcNetwork.toUpperCase())}.`,
          flags: [
            "verbose",
          ],
          options: [
            "confirmations",
            "dr-tx-hash",
            "filter-consumer",
            "filter-radHash",
            "fromBlock",
            "gasPrice",
            "gasLimit",
            "into",
            "limit",
            "signer",
            "toBlock",
            "witnet",
          ],
          envars: [
            "WITNET_KERMIT_PROVIDER_URL",
          ],
        },
      }
      : {}),
    gateway: {
      hint: "Launch a local ETH/RPC signing gateway connected to some specific EVM network.",
      params: ["EVM_NETWORK"],
      options: [
        "port",
        "provider",
      ],
      envars: [
        "ETHRPC_PRIVATE_KEYS",
        "ETHRPC_PROVIDER_URL",
      ],
    },
    networks: {
      hint: "List EVM networks currently bridged to the Witnet blockchain.",
      params: "[EVM_ECOSYSTEM]",
      flags: [
        "mainnets",
        "testnets",
      ],
    },
    wizard: {
      hint: "Generate Solidity mockup contracts adapted to your use case.",
      options: [
        "contract",
        "network",
      ],
    },
    commands: {
      assets: require("./cli/assets"),
      contracts: require("./cli/contracts"),
      gateway: require("./cli/gateway"),
      networks: require("./cli/networks"),
      priceFeeds: require("./cli/priceFeeds"),
      queries: require("./cli/queries"),
      randomness: require("./cli/randomness"),
      reports: require("./cli/reports"),
      wizard: require("./cli/wizard"),
    },
  }

  let [args, flags] = helpers.extractFlagsFromArgs(process.argv.slice(2), Object.keys(settings.flags))
  if (flags.version) {
    helpers.showVersion()
  }
  let options; [args, options] = helpers.extractOptionsFromArgs(args, Object.keys(settings.options))
  if (args[0] && router.commands[args[0]] && router[args[0]]) {
    const cmd = args[0]
    if (flags.help) {
      showCommandUsage(router, cmd, router[cmd])
    } else {
      try {
        await router.commands[cmd]({ ...settings, ...flags, ...options }, args.slice(1))
      } catch (e) {
        showUsageError(router, cmd, router[cmd], e)
      }
    }
  } else {
    showMainUsage(router)
  }
}

function showMainUsage (router) {
  showUsageHeadline(router)
  showUsageFlags(["help", "version"])
  showUsageOptions(["port"])
  console.info("\nCOMMANDS:")
  const maxLength = Object.keys(router.commands).map(key => key.length).reduce((prev, curr) => curr > prev ? curr : prev)
  Object.keys(router.commands).forEach(cmd => {
    if (router[cmd]) console.info("  ", `${cmd}${" ".repeat(maxLength - cmd.length)}`, " ", router[cmd]?.hint)
  })
}

function showCommandUsage (router, cmd, specs) {
  showUsageHeadline(router, cmd, specs)
  showUsageFlags(specs?.flags || [])
  showUsageOptions(specs?.options || [])
  showUsageEnvars(specs?.envars || [])
}

function showUsageEnvars (envars) {
  if (envars.length > 0) {
    console.info("\nENVARS:")
    const maxWidth = envars.map(envar => envar.length).reduce((curr, prev) => curr > prev ? curr : prev)
    envars.forEach(envar => {
      if (envar.toUpperCase().indexOf("KEY") < 0 && process.env[envar]) {
        console.info("  ", `${yellow(envar.toUpperCase())}${" ".repeat(maxWidth - envar.length)}`, ` => Settled to "${process.env[envar]}"`)
      } else {
        console.info("  ", `${yellow(envar.toUpperCase())}${" ".repeat(maxWidth - envar.length)}`, ` ${settings.envars[envar]}`)
      }
    })
  }
}

function showUsageError (router, cmd, specs, error) {
  showCommandUsage(router, cmd, specs)
  if (error) {
    console.info()
    console.error(error)
    // console.error(error?.stack?.split('\n')[0] || error)
  }
}

function showUsageFlags (flags) {
  if (flags.length > 0) {
    const maxWidth = flags.map(flag => flag.length).reduce((curr, prev) => curr > prev ? curr : prev)
    console.info("\nFLAGS:")
    flags.forEach(flag => {
      if (settings.flags[flag]) {
        console.info(`   --${flag}${" ".repeat(maxWidth - flag.length)}   ${settings.flags[flag]}`)
      }
    })
  }
}

function showUsageHeadline (router, cmd, specs) {
  console.info("USAGE:")
  const flags = cmd && (!specs?.flags || specs.flags.length === 0) ? "" : "[FLAGS] "
  const options = specs?.options && specs.options.length > 0 ? "[OPTIONS] " : ""
  if (cmd) {
    let params
    if (specs?.params) {
      const optionalize = (str) => str.endsWith(" ...]")
        ? `[<${str.slice(1, -5)}> ...]`
        : (
          str[0] === "[" ? `[<${str.slice(1, -1)}>]` : `<${str}>`
        )
      if (Array.isArray(specs?.params)) {
        params = specs.params.map(param => optionalize(param)).join(" ") + " "
      } else {
        params = optionalize(specs?.params) + " "
      }
      console.info(`   ${lwhite(`npx witnet-ethers ${cmd}`)} ${params ? green(params) : ""}${flags}${options}`)
    } else {
      console.info(`   ${lwhite(`npx witnet-ethers ${cmd}`)} ${flags}${options}`)
    }
    console.info("\nDESCRIPTION:")
    console.info(`   ${router[cmd].hint}`)
  } else {
    console.info(`   ${lwhite("npx witnet-ethers")} <COMMAND> ${flags}${options}`)
  }
}

function showUsageOptions (options) {
  if (options.length > 0) {
    console.info("\nOPTIONS:")
    const maxLength = options
      .map(option => settings.options[option].param
        ? settings.options[option].param.length + option.length + 3
        : option.length
      )
      .reduce((prev, curr) => curr > prev ? curr : prev)
    options.forEach(option => {
      if (settings.options[option].hint) {
        const str = `${option}${settings.options[option].param ? helpers.colors.gray(` <${settings.options[option].param}>`) : ""}`
        console.info("  ", `--${str}${" ".repeat(maxLength - helpers.colorstrip(str).length)}`, "  ", settings.options[option].hint)
      }
    })
  }
}

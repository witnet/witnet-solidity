#!/usr/bin/env node

require('dotenv').config()
const fs = require("fs")

const helpers = require("./helpers")
const { green, yellow, lwhite } = helpers.colors


/// CONSTANTS AND GLOBALS =============================================================================================

const MODULE_WITNET_PATH = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const settings = {
  checks: {
    toolkitRadonIsInitialized: fs.existsSync("./witnet/assets/index.js"),
    packageIsInitialized: fs.existsSync("./witnet/addresses.json")
  },
  paths: {
    truffleConfigFile: `${MODULE_WITNET_PATH}/scripts/truffle.config.js`,
    truffleContractsPath: `${MODULE_WITNET_PATH}/contracts`,
    truffleMigrationsPath: `${MODULE_WITNET_PATH}/scripts/truffle`,
    truffleTestsPath: `${MODULE_WITNET_PATH}/tests/truffle`,
  },
  flags: {
    apps: "Includes Wit/Oracle appliances",
    await: "Holds on until next event is triggered",
    "dry-run": "Dry-runs deployment workfow into a mocked environment",
    force: "Forces operation without user intervention", 
    help: "Describes command's usage",
    legacy: "Includes artifacts from Witnet legacy packages",
    mainnets: "Lists supported EVM mainnets",
    requests: "Includes WitOracleRequest artifacts",
    templates: "Includes WitOracleRequestTemplate artifacts",
    testnets: "Lists supported EVM testnets",
    version: "Prints tool name and version as headline",
  },
  options: {
    consumer: {
      hint: "Consuming contract address where to push data results from the Wit/Oracle",
      param: "EVM_ADDRESS"
    },
    contract: {
      hint: "Path or name of the new mockup contract to be created",
      param: "path/to/output"
    },
    from: {
      hint: "Reporter's address other than default (must be known by the ETH/RPC gateway)",
      param: "EVM_ADDRESS"
    },
    fromBlock: {
      hint: "Process events since given EVM block number",
      param: "EVM_BLOCK"
    },
    gasLimit: {
      hint: "Maximum gas to spend in the EVM transaction",
      param: "GAS_LIMIT"
    }, 
    network: {
      hint: "EVM network to connect instead of the one settled as default",
      param: "NETWORK",
    },
    provider: {
      hint: "Forces the local gateway to rely on this remote ETH/RPC provider",
      param: "ETHRPC_PROVIDER_URL"
    },
    radHash: {
      hint: "Filters events referring given RAD hash",
      param: "RAD_HASH",
    },
    requester: {
      hint: "Filters events triggered by given requester",
      param: "EVM_ADDRESS",
    },
  },
  envars: {
    ETHRPC_PRIVATE_KEYS: "=> Private keys used by the ETH/RPC gateway for signing EVM transactions.",
    WITNET_SOLIDITY_DEFAULT_CONSUMER: "=> Default EVM consuming contract, if no otherwise specified.",
    WITNET_SOLIDITY_DEFAULT_NETWORK: "=> Default EVM network to interact with, if no otherwise specified.",
  },
}

const router = {
  console: {
    hint: "Launch an EVM console as to interact with Witnet-related artifacts.",
    params: "[ASSET_NAMES ...]",
    flags: [ 'apps', 'legacy', 'requests', 'templates', ],
    options: [ 'network', ],
    envars: [ 
      'ETHRPC_PRIVATE_KEYS',
      'WITNET_SOLIDITY_DEFAULT_NETWORK',
    ],
  },
  contracts: {
    hint: "List available Witnet-related EVM addresses on the specified EVM chain.",
    params: "[ASSET_NAMES ...]",
    flags: [ 
      'apps', 
      'legacy', 
      'requests', 
      'templates', 
    ],
    options: [ 
      'network', 
    ],
    envars: [ 
      'WITNET_SOLIDITY_DEFAULT_NETWORK', 
    ],
  },
  deploy: {
    hint: "Deploy specified Radon artifacts into some EVM chain.",
    params: [
      "[ARTIFACT_NAMES ...]",
    ],
    flags: [ 
      'all', 
      'dry-run', 
      'legacy', 
    ],
    options: [ 
      'network', 
    ],
    envars: [ 
      'ETHRPC_PRIVATE_KEYS',
      'WITNET_SOLIDITY_DEFAULT_NETWORK',
    ],
  },
  ethrpc: {
    hint: "Run a local ETH/RPC gateway connecting to the specified network.",
    options: [ 
      'network', 
      'provider', 
    ],
    envars: [ 
      'ETHRPC_PRIVATE_KEYS',
      'WITNET_SOLIDITY_DEFAULT_NETWORK',
    ],
  },
  events: {
    hint: "Trace latest events logged by the WitOracle core contract",
    params: "[TOPICS ...]",
    flags: [ 
      'await', 
    ],
    options: [ 
      'fromBlock', 
      'network', 
      'requester', 
      'radHash', 
    ],
    envars: [
      'WITNET_SOLIDITY_DEFAULT_NETWORK', 
    ],
  },
  networks: {
    hint: "List EVMs and networks currently bridged to the Wit/Oracle blockchain.",
    params: "[ECOSYSTEM]",
    flags: [
      'mainnets', 
      'testnets', 
    ],
  },
  report: {
    hint: "Push into some consumer contract the result to a data request transaction in the Wit/Oracle blockchain.",
    params: "DR_TX_HASH",
    flags: [
      'force', 
    ],
    options: [
      'consumer',
      'from', 
      'gasLimit', 
      'network', 
    ],
    envars: [
      'ETHRPC_PRIVATE_KEYS', 
      'WITNET_SOLIDITY_DEFAULT_CONSUMER', 
      'WITNET_SOLIDITY_DEFAULT_NETWORK', 
    ],
  },
  wizard: {
    hint: "Generate Solidity mockup contracts adapted to your use case.",
    options: [
      'contract', 
      'network', 
    ],
    envars: [
      'WITNET_SOLIDITY_DEFAULT_NETWORK', 
    ],
  },
  commands: {
    console: require("./cli/console"),
    contracts: require("./cli/contracts"),
    deploy: require("./cli/deploy"),
    ethrpc: require("./cli/ethrpc"),
    events: require("./cli/events"),
    networks: require("./cli/networks"),
    report: require("./cli/report"),
    wizard: require("./cli/wizard"),
  }
}


/// MAIN WORKFLOW =====================================================================================================

main()

async function main() {
  var [args, flags, ] = helpers.extractFlagsFromArgs(process.argv.slice(2), Object.keys(settings.flags))
  if (flags.version) {
    helpers.showVersion()
  }
  if (!settings.checks.toolkitRadonIsInitialized || !settings.checks.packageIsInitialized) {
    install()
  }
  var [args, options, ] = helpers.extractOptionsFromArgs(args, Object.keys(settings.options))
  if (args[0] && router.commands[args[0]]) {
    const cmd = args[0]
    if (flags.help) {
      showCommandUsage(cmd, router[cmd])
    } else {
      try {
        await router.commands[cmd]({...settings, ...flags, ...options}, args.slice(1))
      } catch (e) {
        showUsageError(cmd, router[cmd], e)
      }
    }
  } else {
    showMainUsage()
  }
}

function install() {
  if (!fs.existsSync("./witnet/assets")) {
    fs.mkdirSync("./witnet/assets", { recursive: true })
  }
  if (!fs.existsSync(".env_witnet")) {
    fs.cpSync("node_modules/witnet-solidity/.env_witnet", ".env_witnet")
  }
  if (!fs.existsSync("./witnet/assets/requests.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_requests.js", "./witnet/assets/requests.js")
  }
  if (!fs.existsSync("./witnet/assets/retrievals.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_retrievals.js", "./witnet/assets/retrievals.js")
  }
  if (!fs.existsSync("./witnet/assets/templates.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_templates.js", "./witnet/assets/templates.js")
  }
  if (!fs.existsSync("./witnet/assets/templates.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_templates.js", "./witnet/assets/templates.js")
  }
  if (!fs.existsSync("./witnet/addresses.json")) {
    fs.writeFileSync("./witnet/addresses.json", "{}")
  }
  if (!fs.existsSync("./witnet/assets/index.js") || settings.flags.force) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_index.js", "./witnet/assets/index.js")
  }
}

function showMainUsage() {
  showUsageHeadline()
  showUsageFlags([ 'help', 'version', ])
  console.info(`\nCOMMANDS:`)
  var maxLength = Object.keys(router.commands).map(key => key.length).reduce((prev, curr) => curr > prev ? curr : prev)
  Object.keys(router.commands).forEach(cmd => {
    console.info("  ", `${cmd}${" ".repeat(maxLength - cmd.length)}`, " ", router[cmd]?.hint)
  })
}

function showCommandUsage(cmd, specs) {
  showUsageHeadline(cmd, specs)
  showUsageFlags(specs?.flags || [])
  showUsageOptions(specs?.options || [])
  showUsageEnvars(specs?.envars || [])
}

function showUsageEnvars(envars) {
  if (envars.length > 0) {
    console.info(`\nENVARS:`)
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

function showUsageError(cmd, specs, error) {
  showCommandUsage(cmd, specs)
  if (error) {
    console.info(`\nERROR:`)
    console.error(error?.stack?.split('\n')[0] || error)
  }
}

function showUsageFlags(flags) {
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

function showUsageHeadline(cmd, specs) {
  console.info("USAGE:")
  const flags = cmd && (!specs?.flags || specs.flags.length === 0) ? "" : "[FLAGS] "
  const options = specs?.options && specs.options.length > 0 ? "[OPTIONS] " : ""
  if (cmd) {
    if (specs?.params) {
      var optionalize = (str) => str.endsWith(' ...]') ? `[<${str.slice(1, -5)}> ...]` : (
        str[0] === '[' ? `[<${str.slice(1, -1)}>]` : `<${str}>`
      )
      if (Array.isArray(specs?.params)) {
        params = specs.params.map(param => optionalize(param)).join(' ') + " "
      } else {
        params = optionalize(specs?.params) + " "
      }
      console.info(`   ${lwhite(`npx witnet-solidity ${cmd}`)} ${params ? green(params) : ""}${flags}${options}`)
    } else {
      console.info(`   ${lwhite(`npx witnet-solidity ${cmd}`)} ${flags}${options}`)
    }
    console.info(`\nDESCRIPTION:`)
    console.info(`   ${router[cmd].hint}`)
  } else {
    console.info(`   ${lwhite("npx witnet-solidity")} <COMMAND> ${flags}${options}`)
  }
}

function showUsageOptions(options) {
  if (options.length > 0) {
    console.info(`\nOPTIONS:`)
    var maxLength = options
      .map(option => settings.options[option].param 
        ? settings.options[option].param.length + option.length + 3 
        : option.length
      )
      .reduce((prev, curr) => curr > prev ? curr : prev);
    options.forEach(option => {
      if (settings.options[option].hint) {
        var str = `${option}${settings.options[option].param ? ` <${settings.options[option].param}>` : ""}`
        console.info("  ", `--${str}${" ".repeat(maxLength - str.length)}`, "  ", settings.options[option].hint)
      }
    })
  }
}

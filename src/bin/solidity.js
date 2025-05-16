#!/usr/bin/env node

require('dotenv').config()
const fs = require("fs")

const helpers = require("./helpers")
const { green, yellow, lwhite } = helpers.colors


/// CONSTANTS AND GLOBALS =============================================================================================

const MODULE_WITNET_PATH = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const settings = {
  checks: {
    toolkitIsInitialized: fs.existsSync("./witnet/assets/index.js"),
    packageIsInitialized: fs.existsSync("./witnet/addresses.json")
  },
  paths: {
    truffleConfigFile: `${MODULE_WITNET_PATH}/scripts/truffle.config.js`,
    truffleContractsPath: `${MODULE_WITNET_PATH}/contracts`,
    truffleMigrationsPath: `${MODULE_WITNET_PATH}/scripts/truffle`,
    truffleTestsPath: `${MODULE_WITNET_PATH}/tests/truffle`,
  },
  flags: {
    all: "List all available Radon assets, even if not yet verified.",
    apps: "Show addresses of Wit/Oracle appliances.",
    await: "Hold down until next event is triggered.",
    decode: "Decode selected Radon assets as currently on the specified network.",
    "dry-run": "Dry-run deployment workfow into a mocked environment",
    force: "Force operations without user intervention.", 
    help: "Describe command's usage",
    legacy: "Filter to those declared in witnet/assets folder.",
    mainnets: "List supported EVM mainnets.",
    requests: "Includes WitOracleRequest artifacts.",
    templates: "Show addresses of WitOracleRequestTemplate.",
    testnets: "List supported EVM testnets.",
    verify: "Formally verify selected Radon assets.",
    version: "Print binary name and version as headline.",
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
      hint: "EVM signer address, other than gateway's default.",
      param: "EVM_ADDRESS"
    },
    fromBlock: {
      hint: "Process events since given EVM block number.",
      param: "EVM_BLOCK"
    },
    gasLimit: {
      hint: "Maximum gas to spend in the EVM transaction.",
      param: "GAS_LIMIT"
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
      hint: "Local port where some ETH/RPC signing gateway is expected to be running (default: 8545).",
      param: "HTTP_PORT",
    },
    provider: {
      hint: "Force the local gateway to rely on this remote ETH/RPC provider.",
      param: "HTTP_REMOTE_URL"
    },
    radHash: {
      hint: "Filter events referring given RAD hash.",
      param: "RAD_HASH",
    },
    requester: {
      hint: "Filter events triggered by given requester.",
      param: "EVM_ADDRESS",
    },
  },
  envars: {
    ETHRPC_PRIVATE_KEYS: "=> Private keys used by the ETH/RPC gateway for signing EVM transactions.",
    ETHRPC_PROVIDER_URL: "=> Remote ETH/RPC provider to rely on, if no otherwise specified.",
  },
}

if (!settings.checks.toolkitIsInitialized || !settings.checks.packageIsInitialized) {
  install()
}

const router = {
  assets: {
    hint: "Show Witnet Radon assets formally verified into some locally connected network.",
    params: "[RADON_ASSETS ...]",
    flags:   [ "all", "force", "legacy", "verify" ],
    options: [ "from", "module", "port" ],
  },
  // console: {
  //   hint: "Launch an EVM console as to interact with Witnet-related artifacts.",
  //   params: "[ASSET_NAMES ...]",
  //   flags: [ 'apps', 'legacy', 'requests', 'templates', ],
  //   options: [ 'network', ],
  //   envars: [ 
  //     'ETHRPC_PRIVATE_KEYS',
  //     'WITNET_SDK_SOLIDITY_NETWORK',
  //   ],
  // },
  contracts: {
    hint: "Show available Wit/Oracle contract addresses in some locally connected network.",
    params: "[WIT_ORACLE_ARTIFACTS ...]",
    flags: [ 
      'apps', 
      // 'legacy', 
      // 'requests',
      'templates',
    ],
    options: [ 
      'port', 
    ],
  },
  // deploy: {
  //   hint: "Deploy specified Radon artifacts into some EVM chain.",
  //   params: [
  //     "[ARTIFACT_NAMES ...]",
  //   ],
  //   flags: [ 
  //     'all', 
  //     'dry-run', 
  //     'legacy', 
  //   ],
  //   options: [ 
  //     'network', 
  //   ],
  //   envars: [ 
  //     'ETHRPC_PRIVATE_KEYS',
  //     'WITNET_SDK_SOLIDITY_NETWORK',
  //   ],
  // },
  ethrpc: {
    hint: "Launch a local ETH/RPC signing gateway connected to the specified EVM network.",
    params: ["EVM_NETWORK"],
    options: [ 
      'port', 
      'provider', 
    ],
    envars: [ 
      'ETHRPC_PRIVATE_KEYS',
      'ETHRPC_PROVIDER_URL',
    ],
  },
  "logs": {
    hint: "Trace latest events emitted by the Wit/Oracle core contract.",
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
      'WITNET_SDK_SOLIDITY_NETWORK', 
    ],
  },
  networks: {
    hint: "List EVM networks currently bridged to the Witnet blockchain.",
    params: "[EVM_ECOSYSTEM]",
    flags: [
      'mainnets', 
      'testnets', 
    ],
  },
  "report": {
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
      'WITNET_SDK_SOLIDITY_NETWORK', 
    ],
  },
  wizard: {
    hint: "Generate Solidity mockup contracts adapted to your use case.",
    options: [
      'contract', 
      'network', 
    ],
  },
  commands: {
    assets: require("./cli/assets"),
    contracts: require("./cli/contracts"),
    ethrpc: require("./cli/ethrpc"),
    // console: require("./cli/console"),
    networks: require("./cli/networks"),
    // deploy: require("./cli/deploy"),
    // logs: require("./cli/events"),
    // report: require("./cli/report"),
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
  if (!fs.existsSync("./witnet/assets/sources.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_sources.js", "./witnet/assets/sources.js")
  }
  if (!fs.existsSync("./witnet/assets/templates.js")) {
    fs.cpSync("node_modules/witnet-solidity/witnet/assets/_templates.js", "./witnet/assets/templates.js")
  }
  if (!fs.existsSync("./witnet/addresses.json")) {
    fs.writeFileSync("./witnet/addresses.json", "{}")
  }
  if (!fs.existsSync("./witnet/requests.json")) {
    fs.writeFileSync("./witnet/requests.json", "{}")
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
    console.info()
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

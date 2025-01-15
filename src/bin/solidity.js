#!/usr/bin/env node

require('dotenv').config()
const fs = require("fs")

const helpers = require("../lib/helpers")
const { green, yellow, lwhite } = helpers.colors

/// ENVIRONMENT ACQUISITION =========================================================================================

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_PATH || "../../../../witnet/assets"
const MODULE_WITNET_PATH = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

let args = process.argv
let force;
let forceIndex = args.indexOf('--force');
if (forceIndex >= 2) {
  force = args[forceIndex]
  args.splice(forceIndex, 1)
}

let help = false
if (args.includes('--help')) {
  help = true
  args.splice(args.indexOf('--help'), 1)
}

let version = false
if (args.includes('--version')) {
  version = true
  args.splice(args.indexOf('--version'), 1)
}


/// CONSTANTS AND GLOBALS =============================================================================================


const settings = {
  checks: {
    toolkitRadonIsInitialized: fs.existsSync("./witnet/assets/index.js"),
    packageIsInitialized: fs.existsSync("./witnet/addresses.json")
  },
  flags: {
    force,
    help,
    showVersion: version,
  },
  paths: {
    truffleConfigFile: `${MODULE_WITNET_PATH}/scripts/truffle.config.js`,
    truffleContractsPath: `${MODULE_WITNET_PATH}/contracts`,
    truffleMigrationsPath: `${MODULE_WITNET_PATH}/scripts/truffle`,
    truffleTestsPath: `${MODULE_WITNET_PATH}/tests/truffle`,
  },
}

const router = {
  console: {
    hint: "Launch an EVM console as to interact with Witnet-related artifacts.",
    options: {
      apps: {
        hint: "Injects Wit/Oracle appliances into the console runtime",
      },
      core: {
        hint: "Injects Wit/Oracle core artifacts into the console runtime",
      },
      network: {
        hint: "Connects to this EVM network instead of the one settled as default",
        param: "EVM_NETWORK"
      },
    },
    envars: {
      ETHRPC_PRIVATE_KEYS: "=> Private keys used by the ETH/RPC gateway for signing EVM transactions.",
      WITNET_SOLIDITY_DEFAULT_NETWORK: "=> Default EVM network to interact with, if no otherwise specified.",
    },
  },
  contracts: {
    hint: "List available Witnet-related EVM addresses on some given network.",
    params: "[ASSET_NAMES ...]",
    options: {
      apps: {
        hint: "Includes Wit/Oracle appliances",
      },
      network: {
        hint: "Connects to this EVM network instead of the one settled as default",
        param: "EVM_NETWORK"
      },
      requests: {
        hint: "Includes WitOracleRequest artifacts",
      },
      templates: {
        hint: "Includes WitOracleRequestTemplate artifacts",
      },
    },
    envars: {
      WITNET_SOLIDITY_DEFAULT_NETWORK: "=> Default EVM network to interact with, if no otherwise specified.",
    },
  },
  deploy: {
    hint: "Deploy specified Radon artifacts into some given EVM network.",
    params: ["[ARTIFACT_NAMES ...]",],
    options: {
      "dry-run": {
        hint: "Dry-runs deployment workflow into a mocked environment",
      },
      legacy: {
        hint: "Includes artifacts from Witnet legacy packages",
      },
      network: {
        hint: "Connects to this EVM network instead of the one settled as default",
        param: "EVM_NETWORK"
      },
    }
  },
  ethrpc: {
    hint: "Run a local ETH/RPC gateway to the specified network.",
    options: {
      provider: {
        hint: "Forces the local gateway to rely on this ETH/RPC provider",
        param: "ETHRPC_PROVIDER_URL"
      },
      network: {
        hint: "Connects to this EVM network instead of the one settled as default",
        param: "EVM_NETWORK"
      },
    },
    envars: {
      ETHRPC_PRIVATE_KEYS: "=> Private keys used by the ETH/RPC gateway for signing EVM transactions.",
      WITNET_SOLIDITY_DEFAULT_NETWORK: "=> Default EVM network to interact with, if no otherwise specified.",
    },
  },
  networks: {
    hint: "List ecosystems and EVM networks currently bridged to the Wit/Oracle blockchain.",
    params: "[ECOSYSTEM]",
    options: {
      mainnets: {
        hint: "Lists supported EVM mainnets",
      },
      testnets: {
        hint: "Lists supported EVM testnets",
      },
    },
  },
  wizard: {
    hint: "Generate Solidity mockup contracts adapted to your use case.",
    options: {
      contract: {
        hint: "Path and name of new mockup contract to be created",
        param: "CONTRACT_NAME"
      },
      subfolder: {
        hint: "Settles output contracts subfolder (default: contracts/)",
        param: "RELATIVE_PATH"
      }
    }
  },
  commands: {
    console: require("../lib/cli/console"),
    contracts: require("../lib/cli/contracts"),
    deploy: require("../lib/cli/deploy"),
    ethrpc: require("../lib/cli/ethrpc"),
    networks: require("../lib/cli/networks"),
    wizard: require("../lib/cli/wizard"),
  }
}


/// MAIN WORKFLOW =====================================================================================================

var assets = {}

main()

async function main() {
  if (settings.flags.showVersion) {
    showVersion()
  }
  if (!settings.checks.toolkitRadonIsInitialized || !settings.checks.packageIsInitialized) {
    install()
  }
  assets = require(`${WITNET_ASSETS_PATH}`)
  if (args[2] && router.commands[args[2]]) {
    const cmd = args[2]
    if (settings.flags.help) {
      showCommandUsage(cmd, router[cmd])
    } else {
      [args, options] = helpers.extractFromArgs(args.slice(3), router[cmd]?.options)
      try {
        await router.commands[cmd](settings, args, options)
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
  showUsageFlags()
  console.info(`\nCOMMANDS:`)
  var maxLength = Object.keys(router.commands).map(key => key.length).reduce((prev, curr) => curr > prev ? curr : prev)
  Object.keys(router.commands).forEach(cmd => {
    console.info("  ", `${cmd}${" ".repeat(maxLength - cmd.length)}`, "  ", router[cmd]?.hint)
  })
}

function showCommandUsage(cmd, specs) {
  showUsageHeadline(cmd, specs)
  showUsageFlags()
  showUsageOptions(specs?.options || {})
  showEnvarsUsage(specs?.envars || [])
}

function showEnvarsUsage(envars) {
  var envars = Object.entries(envars)//.filter(([envar,]) => !process.env[envar])
  if (envars.length > 0) {
    console.info(`\nENVARS:`)
    const maxWidth = envars.map(([envar,]) => envar.length).reduce((curr, prev) => curr > prev ? curr : prev)
    envars.forEach(([envar, hint]) => {
      if (envar.toUpperCase().indexOf("KEY") < 0 && process.env[envar]) {
        console.info("  ", `${yellow(envar.toUpperCase())}${" ".repeat(maxWidth - envar.length)}`, "  ", `Currently settled to: ${process.env[envar]}`)
      } else {
        console.info("  ", `${yellow(envar.toUpperCase())}${" ".repeat(maxWidth - envar.length)}`, "  ", `${hint}`)
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

function showUsageFlags() {
  console.info("\nFLAGS:")
  console.info("    --help      Describes command usage")
  console.info("    --version   Prints tool name and version as headline")
}

function showUsageHeadline(cmd, specs) {
  console.info("USAGE:")
  if (cmd) {
    if (specs?.params) {
      var optionalize = (str) => str.endsWith(' ...]') ? `[<${str.slice(1, -5)}> ...]` : (
        str[0] === '[' ? `[<${str.slice(1, -1)}>]` : `<${str}>`
      )
      if (Array.isArray(specs?.params)) {
        params = specs.params.map(param => optionalize(param)).join(' ') + " "
      } else {
        params = optionalize(specs?.params)
      }
      console.info(`    ${lwhite(`npx witnet-solidity ${cmd}`)} [FLAGS] ${params ? green(params) + " " : ""}${specs?.options && Object.keys(specs?.options).length > 0 ? "[OPTIONS]" : ""}`)
    } else {
      console.info(`    ${lwhite(`npx witnet-solidity ${cmd}`)} [FLAGS] <COMMAND>`)
    }
  } else {
    console.info(`    ${lwhite("npx witnet-solidity")} [FLAGS] <COMMAND>`)
  }
}

function showUsageOptions(options) {
  var options = Object.entries(options)
  if (options.length > 0) {
    console.info(`\nOPTIONS:`)
    var maxLength = options
      .map(option => option[1].param ? option[1].param.length + option[0].length + 3 : option[0].length)
      .reduce((prev, curr) => curr > prev ? curr : prev);
    options.forEach(option => {
      if (option[1].hint) {
        var str = `${option[0]}${option[1].param ? ` <${option[1].param}>` : ""}`
        console.info("  ", `--${str}${" ".repeat(maxLength - str.length)}`, "  ", option[1].hint)
      }
    })
  }
}

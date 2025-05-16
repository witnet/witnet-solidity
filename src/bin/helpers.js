const fs = require("fs")
const merge = require("lodash.merge")
const framework = require("witnet-solidity-bridge")

const cyan = (str) => `\x1b[36m${str}\x1b[0m`
const gray = (str) => `\x1b[90m${str}\x1b[0m`
const green = (str) => `\x1b[32m${str}\x1b[0m`
const red = (str) => `\x1b[31m${str}\x1b[0m`
const yellow = (str) => `\x1b[33m${str}\x1b[0m`
const white = (str) => `\x1b[98m${str}\x1b[0m`
const lcyan = (str) => `\x1b[1;96m${str}\x1b[0m`
const lwhite = (str) => `\x1b[1;98m${str}\x1b[0m`
const mcyan = (str) => `\x1b[96m${str}\x1b[0m`
const mred = (str) => `\x1b[91m${str}\x1b[0m`
const myellow = (str) => `\x1b[93m${str}\x1b[0m`

const WITNET_SDK_RADON_ASSETS_PATH = process.env.WITNET_SDK_RADON_ASSETS_PATH || "../../../../witnet/assets"
const isModuleInitialized = fs.existsSync("./witnet/assets/index.js")

module.exports = {
    colors: {
        cyan, gray, green, red, yellow, white,
        lcyan, lwhite,
        mcyan, mred, myellow,
    },
    deleteExtraFlags, extractFlagsFromArgs, extractOptionsFromArgs,
    flattenObject, orderKeys,
    showVersion, traceHeader, traceWitnetAddresses,
    getNetworkAddresses, 
    getNetworkConstructorArgs: framework.getNetworkConstructorArgs,
    loadAssets,
    readJsonFromFile: framework.utils.readJsonFromFile,
    overwirteJsonFile: framework.utils.overwriteJsonFile,
}

function deleteExtraFlags(args) {
    deleted = []
    return [
        args?.filter(arg => { 
            if (arg.startsWith('--')) {
                deleted.push(arg.slice(2))
                return false
            } else {
                return true
            }
        }),
        deleted
    ];
}

function extractFlagsFromArgs(args, flags) {
    const curated = {}
    if (args && Array.isArray(args) && flags) {
        flags.forEach(flag => {
            const index = args.indexOf(`--${flag}`)
            if (index >= 0) {
                curated[flag] = true
                args.splice(index, 1)
            }
        })
    }
    return [args || [], curated,]
}

function extractOptionsFromArgs(args, options) {
    const curated = {}
    if (args && Array.isArray(args) && options) {
        options.forEach(option => {
            const index = args.indexOf(`--${option}`)
            if (index >= 0) {
                curated[option] = args[index]
                if (!args[index + 1] || args[index + 1].startsWith('--')) {
                    throw `Missing required parameter for --${option}`
                } else {
                    curated[option] = args[index + 1]
                    args.splice(index, 2)
                }
            }
        })
    }
    return [args || [], curated,]
}

function flattenObject(ob) {
    var toReturn = {};
    for (const i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            const flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

function getNetworkAddresses(network) {
    return require("lodash.merge")(
        framework.getNetworkAddresses(network.toLowerCase()),
        require("../../witnet/addresses.json")[network.toLowerCase()],
    )
}

function orderKeys(obj) {
    const keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
        if (k1 < k2) return -1
        else if (k1 > k2) return +1
        else return 0
    })
    let i; const after = {}
    for (i = 0; i < keys.length; i++) {
        after[keys[i]] = obj[keys[i]]
        delete obj[keys[i]]
    }
    for (i = 0; i < keys.length; i++) {
        obj[keys[i]] = after[keys[i]]
    }
    return obj
}

function showVersion() {
    console.info(`${mcyan(`Wit/Oracle Solidity SDK v${require("../../package.json").version}`)}`)
}

function traceHeader(header, color = white, indent = "") {
    console.info(`${indent}┌─${"─".repeat(header.length)}─┐`)
    console.info(`${indent}│ ${color(header)} │`)
    console.info(`${indent}└─${"─".repeat(header.length)}─┘`)
}

function traceWitnetAddresses(addresses, constructorArgs, artifacts, indent = "", level) {
    const includes = (selection, key) => {
        return selection.filter(
            artifact => key.toLowerCase().indexOf(artifact.toLowerCase()) >= 0
        ).length > 0
    }
    let found = 0
    for (const key in orderKeys(addresses)) {
        if (typeof addresses[key] === "object") {
            found += traceWitnetAddresses(addresses[key], constructorArgs, artifacts, indent, (level || 0) + 1)
        } else {
            if (
                key !== "WitnetDeployer"
                && !key.endsWith("Lib")
                && !key.endsWith("Proxy")
                && key.indexOf("Trustable") < 0
                && key.indexOf("Upgradable") < 0
                && constructorArgs[key] !== undefined
                || includes(artifacts, key)
            ) {
                found++
                if (includes(artifacts, key)) {
                    console.info(`${indent}${mcyan(addresses[key])}`, "<=", `${lwhite(key)}`)
                } else {
                    console.info(`${indent}${cyan(addresses[key])}`, "<=", `${white(key)}`)
                }
            }
        }
    }
    return found
}

function loadAssets (options) {
    const { assets } = options?.module ? require(options.module) : (options?.legacy ? {} : require("witnet-toolkit"))
    return isModuleInitialized ? merge(assets, require(`${WITNET_SDK_RADON_ASSETS_PATH}`)) : assets
}


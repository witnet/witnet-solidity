const cyan = (str) => `\x1b[36m${str}\x1b[0m`
const green = (str) => `\x1b[32m${str}\x1b[0m`
const yellow = (str) => `\x1b[33m${str}\x1b[0m`
const white = (str) => `\x1b[98m${str}\x1b[0m`
const lcyan = (str) => `\x1b[1;96m${str}\x1b[0m`
const lwhite = (str) => `\x1b[1;98m${str}\x1b[0m`
const mcyan = (str) => `\x1b[96m${str}\x1b[0m`

module.exports = {
    colors: {
        cyan, green, yellow, white,
        lcyan, lwhite,
        mcyan, 
    },
    deleteExtraFlags, extractFromArgs,
    orderKeys,
    showVersion,
    traceHeader, traceWitnetAddresses,
}

function deleteExtraFlags(args) {
    return args?.filter(arg => !arg.startsWith('--'))
}

function extractFromArgs(args, options) {
    const curated = {}
    if (args && options) {
        Object.keys(options).forEach(option => {
            const index = args.indexOf(`--${option}`)
            if (index >= 0) {
                if (options[option].param) {
                    curated[option] = args[index]
                    if (!args[index + 1] || args[index + 1].startsWith('--')) {
                        throw `Missing required parameter for --${option}`
                    } else {
                        curated[option] = args[index + 1]
                        args.splice(index, 2)
                    }
                } else {
                    curated[option] = true
                    args.splice(index, 1)
                }
            }
        })
    }
    return [args, curated,]
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
    console.info(`${lcyan(`Witnet Solidity v${require("../../package.json").version}`)}`)
}

function traceHeader(header, color = white, indent = "") {
    console.info(`${indent}┌─${"─".repeat(header.length)}─┐`)
    console.info(`${indent}│ ${color(header)} │`)
    console.info(`${indent}└─${"─".repeat(header.length)}─┘`)
}

function traceWitnetAddresses(addresses, artifacts, indent = "", level) {
    const includes = (selection, key) => {
        return selection.filter(
            artifact => key.toLowerCase().indexOf(artifact.toLowerCase()) >= 0
        ).length > 0
    }
    let found = 0
    for (const key in orderKeys(addresses)) {
        if (typeof addresses[key] === "object") {
            found += traceWitnetAddresses(addresses[key], artifacts, indent, (level || 0) + 1)
        } else {
            if (
                key !== "WitnetDeployer"
                && !key.endsWith("Lib")
                && !key.endsWith("Proxy")
                || includes(artifacts, key)
            ) {
                found++
                if (includes(artifacts, key)) {
                    console.info(`${indent}${lcyan(addresses[key])}`, "\t<=", `${lwhite(key)}`)
                } else {
                    console.info(`${indent}${cyan(addresses[key])}`, "\t<=", `${white(key)}`)
                }
            }
        }
    }
    return found
}
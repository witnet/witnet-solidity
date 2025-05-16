const { JsonRpcProvider } = require("ethers")
const fs = require("fs")
const merge = require("lodash.merge")
const prompt = require("inquirer").createPromptModule()
const { supportsNetwork } = require("witnet-solidity-bridge")
const { utils, Witnet } = require("witnet-toolkit")

const helpers = require("../helpers")
const solidity = require("../../../dist/src/lib/solidity")

const WITNET_SDK_RADON_ASSETS_PATH = process.env.WITNET_SDK_RADON_ASSETS_PATH || "../../../../../witnet/assets"

const requests = fs.existsSync(`${WITNET_SDK_RADON_ASSETS_PATH}/../requests.json`) 
        ? require(`${WITNET_SDK_RADON_ASSETS_PATH}/../requests.json`)
        : {}

module.exports = async function (flags = {}, args = []) {
    [args, extraFlags] = helpers.deleteExtraFlags(args)

    let provider
    try {
        provider = new JsonRpcProvider(`http://127.0.0.1:${flags?.port || 8545}`)
    } catch (err) {
        throw new Error(`Unable to connect to local ETH/RPC gateway: ${err.message}`)
    }
    const chainId = (await provider.getNetwork()).chainId
    const network = solidity.getNetworkName(chainId)
    if (!network) {
        throw new Error(`Connected to unsupported EVM chain id: ${chainId}`)
    } else if (!requests[network]) {
        requests[network] = {}
    }

    const WitOracleRadonRegistry = solidity.core.WitOracleRadonRegistry.from(network, await provider.getSigner(flags?.from))

    helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)

    let assets = helpers.loadAssets(flags)
    if (!assets || Object.keys(assets).length === 0)  {
        throw new Error(`No Radon assets declared just yet in witnet/assets.`)
    } else {
        assets = clearEmptyBranches(WitOracleRadonRegistry, assets, args, !flags?.all)
    }
    const selection = (
        await selectWitnetArtifacts(WitOracleRadonRegistry, assets, args, "  ", !flags?.all)
    ).sort(([a,], [b,]) => { if (a < b) return -1; else if (a > b) return 1; else return 0; });
    if (flags?.verify && selection.length > 0) {
        const maxWidth = Math.max(...selection.map(([key,]) => key.length))
        for (const index in selection) {
            const [ key, color, asset ] = selection[index]
            if (asset instanceof Witnet.Radon.RadonRequest) {
                if (!flags?.force) {
                    const user = await prompt([{
                        message: `Formally verify RadonRequest::${color(key)} into ${network} ?`,
                        name: "continue",
                        type: "confirm",
                        default: true,
                    }])
                    if (!user.continue) continue;
                }
                if (flags?.force) process.stdout.write(`${key}${" ".repeat(maxWidth - key.length)} => `);
                try {
                    const radHash = await WitOracleRadonRegistry.verifyRadonRequest(asset)
                    if (flags?.force) {
                        process.stdout.write(`${helpers.colors.mcyan(radHash.slice(2))}\n`)
                    } else {
                        process.stdout.write(`  RAD hash: ${helpers.colors.mcyan(radHash.slice(2))}\n\n`)
                    }
                    requests[network][key] = radHash
                    saveRequests()

                } catch (err) {
                    process.stdout.write(`${helpers.colors.mred(err)}\n`)
                }
            }
        }
    }
}

function saveRequests() {
    const filename = `${WITNET_SDK_RADON_ASSETS_PATH}/../requests.json`
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, "{}")
    }
    const json = merge(JSON.parse(fs.readFileSync(filename)), requests)
    fs.writeFileSync(filename, JSON.stringify(json, null, 4), { flag: "w+" })
}

function clearEmptyBranches(registry, node, args, filter) {
    if (node) {
        const assets = Object.fromEntries(
            Object.entries(node).map(([key, value]) => {
                if (
                    (
                        !filter 
                            || args.find(arg => key.toLowerCase().indexOf(arg.toLowerCase()) >= 0)
                            || (requests[registry.network] && requests[registry.network][key] !== undefined)
                    ) && (
                        // value instanceof Witnet.Radon.RadonRetrieval ||
                        // value instanceof Witnet.Radon.RadonModal ||
                        // value instanceof Witnet.Radon.RadonTemplate ||
                        value instanceof Witnet.Radon.RadonRequest
                    )
                ) {
                    return [key, value]

                } else if (typeof value === "object") {
                    if (countWitnetArtifacts(registry, value, args, filter) > 0) {
                        return [key, clearEmptyBranches(registry, value, args, filter)]
                    } else {
                        return [key, undefined]
                    }
                } else {
                    return [key, undefined]
                }
            })
                .filter(([, value]) => value !== undefined)
        )
        if (Object.keys(assets).length > 0) {
            return assets
        } else {
            return undefined
        }
    }
}

function countWitnetArtifacts(registry, assets, args, filter = false) {
    // console.log("countWitnetArtifacts")
    let counter = 0
    Object.entries(assets).forEach(([key, value]) => {
        if ((
            value instanceof Witnet.Radon.RadonModal ||
            value instanceof Witnet.Radon.RadonRequest ||
            value instanceof Witnet.Radon.RadonTemplate ||
            value instanceof Witnet.Radon.RadonRetrieval
        ) && (
                !filter ||
                !args ||
                args.length === 0 ||
                args.find(arg => key.toLowerCase().indexOf(arg.toLowerCase()) >= 0) ||
                (requests[registry.network] && requests[registry.network][key] !== undefined)
            )) {
            counter++
        } else if (typeof value === "object") {
            counter += countWitnetArtifacts(registry, value, args)
        }
    })
    return counter
}

async function selectWitnetArtifacts(registry, assets = {}, args, indent = "", filter = false) {
    // console.log("selectWitnetArtifacts:", registry.network)
    const network = registry.network
    const selection = []
    const prefix = `${indent}`
    for (const index in Object.keys(assets)) {
        const key = Object.keys(assets)[index]
        const asset = assets[key]
        const isLast = parseInt(index) === (Object.keys(assets).length - 1)
        let found = args.find(arg => key.toLowerCase().indexOf(arg.toLowerCase()) >= 0)
        let color = (
            found 
                ? (requests[network] && requests[network][key] !== undefined ? helpers.colors.lcyan : helpers.colors.myellow)
                : (requests[network] && requests[network][key] !== undefined ? helpers.colors.cyan : helpers.colors.gray)
        );
        if (asset instanceof Witnet.Radon.RadonRequest) {
            if (
                requests[network] 
                && requests[network][key] !== undefined
            ) {
                const radHash = asset.radHash
                try {
                    await registry.lookupRadonRequest(radHash)
                    if (requests[network][key] !== radHash) {
                        // already verified but with a different RAD hash
                        color = found ? helpers.colors.mred : helpers.colors.red
                    } else {
                        // already verified into target network with same RAD hash
                        found = false
                    }
                } catch {
                    color = found ? helpers.colors.white : helpers.colors.gray
                }
            }
            if (!filter || found || (requests[network] && requests[network][key] !== undefined)) {
                console.info(`${prefix}${color(key)}`)
                if (isLast) {
                    console.info(`${prefix}`)
                }
            }
        
        } else if (
            asset instanceof Witnet.Radon.RadonTemplate ||
            asset instanceof Witnet.Radon.RadonModal
        ) {
            const argsCount = assets[key].argsCount
            if (!filter || found) {
                console.info(`${prefix}${color(key)} ${argsCount > 0 ? helpers.colors.green(`(${argsCount} args)`) : ""}`)
                if (isLast) {
                    console.info(`${prefix}`)
                }
            }

        } else if (asset instanceof Witnet.Radon.RadonRetrieval) {
            const argsCount = asset.argsCount
            if (!filter || found) {
                console.info(`${prefix}${color(key)} ${argsCount > 0 ? helpers.colors.green(`(${argsCount} args)`) : ""}`)
                if (isLast) {
                    console.info(`${prefix}`)
                }
            }

        } else if (typeof asset === "object" && countWitnetArtifacts(registry, asset, args, filter) > 0) {
            console.info(`${indent}${isLast ? "└─ " : "├─ "}${key}`)
            selection.push(...await selectWitnetArtifacts(registry, asset, args, !isLast ? `${indent}│  ` : `${indent}   `, filter))
        }
        if (found) selection.push([key, color, asset]);
    }
    return selection
}
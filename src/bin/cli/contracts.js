const merge = require("lodash.merge")
const { supportsNetwork } = require("witnet-solidity-bridge")
const { utils, Witnet } = require("witnet-toolkit")

const helpers = require("../helpers")
const solidity = require("../../../dist/src/lib/solidity")

module.exports = async function (flags = {}, args = []) {
    [args, extraFlags] = helpers.deleteExtraFlags(args)
    const network = flags?.network
    if (!network || !supportsNetwork(network)) {
        if (network) throw new Error(`Unsupported network "${network}"`)
        else throw new Error("No EVM network was specified!")
    }
    const allAddrs = helpers.getNetworkAddresses(network)
    const constructorArgs = helpers.getNetworkConstructorArgs(network)
    const addresses = {}
    const assets = loadAssets(flags)
    addresses.core = allAddrs?.core
    if (flags?.apps) {
        addresses.apps = allAddrs?.apps
    }
    if (flags?.requests) {
        const dict = utils.flattenRadonRequests(assets)
        if (dict && allAddrs?.requests) {
            addresses.requests = Object.fromEntries(Object.entries(allAddrs?.requests).filter(([key,]) => dict[key]))
        }
    }
    if (flags?.templates) {
        const dict = utils.flattenRadonTemplates(assets)
        if (dict && allAddrs?.templates) {
            addresses.templates = Object.fromEntries(Object.entries(allAddrs?.templates).filter(([key,]) => dict[key]))
        }
    }
    extraFlags.forEach(flag => {
        if (allAddrs[flag]) {
            addresses[flag] = allAddrs[flag]
        }
    })
    // include core artifacts, if not flags were specified:
    if (Object.keys(addresses).length === 0) {
        addresses.core = allAddrs?.core
    }
    // always include libs, although they will only shown if searched for
    addresses.libs = allAddrs?.libs

    helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
    const addrs = helpers.orderKeys(Object.fromEntries(
        Object.entries(helpers.flattenObject(addresses)).map(([key, addr]) => [
            key.split('.').slice(-1)[0],
            addr
        ])
    ));
    if (!helpers.traceWitnetAddresses(addrs, constructorArgs, args, "  ")) {
        throw new Error(`No artifacts named after: ${JSON.stringify(args)}`)
    }
    return [network, addresses]
}

function loadAssets (options) {
    const { assets } = options?.module ? require(options.module) : (options?.legacy ? {} : require("witnet-toolkit"))
    return merge(assets, require(`${WITNET_ASSETS_PATH}`))
}

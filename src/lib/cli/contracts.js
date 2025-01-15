const helpers = require("../helpers")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (_settings, args, options) {
    args = helpers.deleteExtraFlags(args)
    const network = options?.network || process.env.WITNET_SOLIDITY_DEFAULT_NETWORK
    if (!network || !assets.supportsNetwork(network)) {
        if (network) throw `Unsupported network "${network}"`
        else throw undefined;
    }
    const legacy = assets.getAddresses(network)
    var addresses = {}
    if (options?.apps && legacy?.apps) {
        addresses.apps = legacy.apps
    }
    if (options?.requests && legacy?.requests) {
        addresses.requests = legacy.requests
    }
    if (options?.templates && legacy?.templates) {
        addresses.templates = legacy.templates
    }
    addresses.WitnetDeployer = legacy?.WitnetDeployer
    addresses.core = legacy?.core
    addresses.libs = legacy?.libs
    helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
    if (!helpers.traceWitnetAddresses(addresses, args)) {
        throw `No artifacts named after: ${JSON.stringify(args)}`
    }
}

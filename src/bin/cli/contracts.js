const { JsonRpcProvider } = require("ethers")
const helpers = require("../helpers")
const { utils } = require("../../../dist/src/lib")

const deployables = helpers.readWitnetJsonFiles("templates")

module.exports = async function (flags = {}, args = []) {
    [args, extraFlags] = helpers.deleteExtraFlags(args)

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
    const framework = helpers.getNetworkAddresses(network)
    const constructorArgs = helpers.getNetworkConstructorArgs(network)
    const addresses = {}
    const assets = helpers.importRadonAssets(flags)
    addresses.core = framework?.core
    addresses.apps = framework?.apps
    addresses.libs = framework?.libs
    if (flags?.templates) {
        const dict = utils.flattenRadonTemplates(assets)
        if (Object.keys(dict).length > 0 && deployables.templates[network]) {
            addresses.templates = Object.fromEntries(
                Object
                    .entries(deployables.templates[network])
                    .filter(([key,]) => { 
                        if (dict[key] !== undefined) {
                            constructorArgs[key] = {}
                            return true
                        }
                    })
            )
        }
    }
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

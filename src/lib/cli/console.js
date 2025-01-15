const { execSync } = require("node:child_process")
const helpers = require("../helpers")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (settings, args, options) {
    var args = helpers.deleteExtraFlags(args)
    const network = options?.network || process.env.WITNET_SOLIDITY_DEFAULT_NETWORK
    if (!network || !assets.supportsNetwork(network)) {
        if (network) throw `Unsupported network "${network}"`
        else throw undefined;
    }
    const addresses = assets.getAddresses(network)
    helpers.traceHeader(`${network.replaceAll(".", ":").toUpperCase()}`, helpers.colors.lcyan)
    if (helpers.traceWitnetAddresses(addresses, []) === 0) {
        console.info("  ", "None available.")
    }
    console.info()
    // eslint-disable-next-line
    execSync(
        `npx truffle console --config ${
                settings.paths.truffleConfigFile
            } --contracts_directory ${
                settings.paths.truffleContractsPath
            } --migrations_directory ${
                settings.paths.truffleMigrationsPath
            } --network ${
                network
            }`,
        { stdio: "inherit" }
    )
}

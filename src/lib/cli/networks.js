const helpers = require("../helpers")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (settings, args, options) {
    args = helpers.deleteExtraFlags(args)
    if (!settings.flags.showVersion) {
        helpers.showVersion()
    }
    const networks = Object.fromEntries(
        Object.entries(assets.supportedNetworks())
            .filter(([network, config,]) => {
                return (!args[0] || network.indexOf(args[0].toLowerCase()) >= 0) && (
                    !options
                    || options?.mainnets && config.mainnet
                    || options?.testnets && !config.mainnet
                    || !options?.mainnets && !options?.testnets
                )
            }).map(([network, config]) => [
                network, {
                    "Mainnet": config?.mainnet,
                    "Network id": config?.network_id,
                    "Gateway port": config?.port,
                    "Verifying explorer URL": config?.verified,
                }
            ])
    )
    console.table(networks)
}

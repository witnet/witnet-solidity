const helpers = require("../helpers")

// const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
// const assets = require(`${WITNET_ASSETS_PATH}`)

const { supportedNetworks } = require("witnet-solidity-bridge")

module.exports = async function (flags = {}, args = []) {
  [args] = helpers.deleteExtraFlags(args)
  const networks = Object.fromEntries(
    Object.entries(supportedNetworks())
      .filter(([network, config]) => {
        return (!args || !args[0] || network.indexOf(args[0].toLowerCase()) >= 0) && (
          !flags ||
            (flags?.mainnets && config.mainnet) ||
            (flags?.testnets && !config.mainnet) ||
            (!flags?.mainnets && !flags?.testnets)
        )
      }).map(([network, config]) => [
        network, {
          Mainnet: config?.mainnet,
          "Network id": config?.network_id,
          "Gateway port": config?.port,
          "Contracts verification explorer URL": config?.verified,
        },
      ])
  )
  console.table(networks)
}

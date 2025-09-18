const helpers = require("../helpers.js")

const { supportedNetworks } = require("witnet-solidity-bridge").default

module.exports = async function (flags = {}, [ecosystem]) {
  const networks = Object.fromEntries(
    Object.entries(supportedNetworks())
      .filter(([, config]) => {
        return (
          !flags ||
            (flags?.mainnets && config.mainnet) ||
            (flags?.testnets && !config.mainnet) ||
            (!flags?.mainnets && !flags?.testnets)
        )
      }).map(([network, config]) => [
        network, {
          browser: config?.verified,
          id: config?.network_id,
          mainnet: config?.mainnet,
          match: ecosystem && network.toLowerCase().indexOf(ecosystem.toLowerCase()) > -1,
          name: network,
          symbol: config?.symbol,
        },
      ])
  )
  helpers.traceTable(
    Object.values(networks).map(network => [
      network.match ? helpers.colors.mcyan(network.name) : helpers.colors.cyan(network.name),
      network.match ? helpers.colors.lwhite(network.symbol) : helpers.colors.white(network.symbol),
      network.match ? helpers.colors.myellow(helpers.commas(network.id)) : helpers.colors.yellow(helpers.commas(network.id)),
      network.match ? helpers.colors.white(network.browser || "") : helpers.colors.gray(network.browser || ""),
    ]), {
      headlines: [
        ":Network",
        ":Symbol",
        "Network Id",
        ":Verified Block Explorer",
      ],
    }
  )
  console.info(`^ Listed ${Object.keys(networks).length} networks.`)
}

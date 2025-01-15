const assets = require("witnet-solidity/assets")
module.exports = {
  getAddresses: (network) => {
    return {
      ...assets.getAddresses(network.toLowerCase()),
      ...require("../addresses.json")[network.toLowerCase()],
    }
  },
  supportedEcosystems: assets.supportedEcosystems,
  supportedNetworks: assets.supportedNetworks,
  supportsNetwork: assets.supportsNetwork,
  ABIs: assets.ABIs,
  legacy: {
    requests: { ...assets.legacy.requests, ...require("./requests") },
    retrievals: { ...assets.legacy.retrievals, ...require("./retrievals") },
    templates: { ...assets.legacy.templates, ...require("./templates") },
  },
}

const framework = require("witnet-solidity-bridge")
const legacy = require("witnet-toolkit/assets").legacy
module.exports = {
  getAddresses: (network) => {
    return {
      ...framework.getAddresses(network.toLowerCase()),
      ...require("../addresses.json")[network.toLowerCase()],
    }
  },
  supportedEcosystems: framework.supportedEcosystems,
  supportedNetworks: framework.supportedNetworks,
  supportsNetwork: framework.supportsNetwork,
  ABIs: framework.ABIs,
  legacy: {
    requests: { ...legacy.requests, ...require("./requests") },
    retrievals: { ...legacy.retrievals, ...require("./retrievals") },
    templates: { ...legacy.templates, ...require("./templates") },
  }
}

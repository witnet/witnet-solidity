const { ABIs, getNetworkAddresses, supportedEcosystems, supportedNetworks, supportsNetwork } = require("witnet-solidity-bridge")
const { legacy } = require("witnet-toolkit/assets")

const merge = require("lodash.merge")

module.exports = {
  ABIs,
  getNetworkAddresses: (network) => {
    return merge(
      getNetworkAddresses(network.toLowerCase()),
      require("../addresses.json")[network.toLowerCase()],
    )
  },
  legacy: {
    requests: merge(legacy?.requests, require("./requests")),
    retrievals: merge(legacy?.retrievals, require("./retrievals")),
    templates: merge(legacy?.templates, require("./templates")),
  },
  supportedEcosystems,
  supportedNetworks,
  supportsNetwork,
};

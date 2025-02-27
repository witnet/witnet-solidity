const { 
  ABIs, 
  getNetworkAddresses, 
  legacy,
  supportedEcosystems, 
  supportedNetworks, 
  supportsNetwork,
} = require("witnet-solidity/assets")

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

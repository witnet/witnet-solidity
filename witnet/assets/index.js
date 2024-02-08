const witnet = require("witnet-solidity-bridge/assets")
module.exports = {
    getAddresses: (network) => {
        return {
            ...witnet.getAddresses(network.toLowerCase()),
            ...require("./addresses.json")[network.toLowerCase()]
        }
    },
    supportedEcosystems: witnet.supportedEcosystems,
    supportedNetworks: witnet.supportedNetworks,
    artifacts: witnet.artifacts,
    requests: require("./requests"),
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};

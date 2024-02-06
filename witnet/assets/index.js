const bridge = require("witnet-solidity-bridge")
const merge = require("lodash.merge")

module.exports = {
    getAddresses: (network) => {
        return merge(
            bridge.getAddresses(network.toLowerCase()),
            require("./addresses.json")[network.toLowerCase()]
        );
    },
    getNetworks: () => { return bridge.getNetworks(); },
    artifacts: bridge.artifacts,
    requests: require("./requests"),
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};

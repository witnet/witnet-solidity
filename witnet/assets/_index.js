const witnet = require("witnet-solidity/assets")
module.exports = {
    getAddresses: (network) => {
        return {
            ...witnet.getAddresses(network.toLowerCase()),
            ...require("../addresses.json")[network.toLowerCase()]
        }
    },
    supportedEcosystems: witnet.supportedEcosystems,
    supportedNetworks: witnet.supportedNetworks,
    artifacts: witnet.artifacts,
    requests: { ...witnet.requests, ...require("./requests"), },
    sources: { ...witnet.sources, ...require("./sources"), },
    templates: { ...witnet.templates, ...require("./templates"), },
};
const merge = require("lodash.merge")
module.exports = {
    abis: require("witnet-solidity/assets").abis,
    addresses: merge(
        require("witnet-solidity/assets").addresses,
        require("./addresses.json"),
    ),
    requests: require("./requests"),
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};
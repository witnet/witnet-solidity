const { merge } = require("lodash")
module.exports = {
    abis: require("witnet-solidity/witnet/assets").abis,
    addresses: merge(
        require("witnet-solidity/witnet/assets").addresses,
        require("./addresses.json"),
    ),
    requests: require("./requests"),
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};
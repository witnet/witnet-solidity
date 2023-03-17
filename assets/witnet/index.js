const { merge } = require("lodash")
module.exports = {
    addresses: merge(
        require("witnet-solidity-bridge/migrations/witnet.addresses"),
        require("../../migrations/witnet/addresses"),
    ),
    radons: require("../../migrations/witnet/radons"),
    requests: require("../../migrations/witnet/requests"),
    templates: require("../../migrations/witnet/templates"),
}
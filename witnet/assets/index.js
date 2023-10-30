const { merge } = require("lodash")
const Witnet = require("witnet-utils")
module.exports = {
    abis: {
        WitnetBytecodes: require("./abis/WitnetBytecodes.json"),
        WitnetPriceFeeds: require("./abis/WitnetPriceFeeds.json"),
        WitnetRandomness: require("./abis/WitnetRandomness.json"),
        WitnetRequest: require("./abis/WitnetRequest.json"),
        WitnetRequestFactory: require("./abis/WitnetRequestFactory.json"),
        WitnetRequestTemplate: require("./abis/WitnetRequestTemplate.json"),
    },
    addresses: merge(
        require("witnet-solidity-bridge/migrations/witnet.addresses"),
        require("../migrations/addresses"),
    ),
    requests: {
        RNG: {
            WitnetRequestRandomness: Witnet.StaticRequest({
                retrieve: [ Witnet.Retrievals.RNG(), ],
                tally: Witnet.Reducers.ConcatHash(),
            }),
        },
    },
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};
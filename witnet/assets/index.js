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
        require("./addresses.json"),
    ),
    requests: {
        Globals: {
            WitnetRequestRandomness: Witnet.StaticRequest({
                retrieve: [ Witnet.Retrievals.RNG(), ],
                tally: Witnet.Reducers.ConcatHash(),
            }),
            WitnetRequestPriceUsdtWit9: Witnet.StaticRequest({
                retrieve: [
                    Witnet.Retrievals.HttpGet({
                        url: "https://api-cloud.bitmart.com/spot/v1/ticker?symbol=WIT_USDT",
                        script: Witnet.Script()
                            .parseJSONMap()
                            .getMap("data")
                            .getArray("tickers")
                            .getMap(0)
                            .getFloat("last_price")
                            .power(-1)
                            .multiply(1e9)
                            .round(),
                    }),
                    Witnet.Retrievals.HttpGet({
                        url: "https://data.gateapi.io/api2/1/ticker/wit_usdt",
                        script: Witnet.Script()
                            .parseJSONMap()
                            .getFloat("last")
                            .power(-1)
                            .multiply(1e9)
                            .round(),
                    }),
                    Witnet.Retrievals.HttpGet({
                        url: "https://www.mexc.com/open/api/v2/market/ticker?symbol=WIT_USDT",
                        script: Witnet.Script()
                            .parseJSONMap()
                            .getArray("data")
                            .getMap(0)
                            .getFloat("last")
                            .power(-1)
                            .multiply(1e9)
                            .round(),
                    }),
                ],
                aggregate: Witnet.Reducers.Median(Witnet.Filters.Stdev(1.4)),
                tally: Witnet.Reducers.PriceTally(),
            }),
        },
    },
    retrievals: require("./retrievals"),
    templates: require("./templates"),
};
const Witnet = require("witnet-utils")
module.exports = {
    "aex/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.aex.zone/v2/exchange-rates?currency=\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("rates").getFloat("\\0\\").power(-1).multiply(1e6).round()
    }),
    "bkex/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bkex.com/v2/q/ticker/price?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("price").multiply(1e6).round()
    }),
    "binance.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.binance.com/api/v3/ticker/price?symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("price").multiply(1e6).round(),
        tuples: {
            "BTC/USD": [ "BTC", "USD" ],
        },
    }),
}
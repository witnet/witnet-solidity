const Witnet = require("witnet-toolkit")

module.exports = {
  legacy: {
    WitnetRequestPriceUsdtWit9: Witnet.StaticRequest({
      retrieve: [
        Witnet.Sources.HttpGet({
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
        Witnet.Sources.HttpGet({
          url: "https://data.gateapi.io/api2/1/ticker/wit_usdt",
          script: Witnet.Script()
            .parseJSONMap()
            .getFloat("last")
            .power(-1)
            .multiply(1e9)
            .round(),
        }),
        Witnet.Sources.HttpGet({
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
    WitnetRequestRandomness: Witnet.StaticRequest({
      retrieve: [Witnet.Sources.RNG()],
      tally: Witnet.Reducers.ConcatHash(),
    }),
  },
}

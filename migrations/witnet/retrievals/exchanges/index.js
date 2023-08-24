const Witnet = require("witnet-utils")
module.exports = {
    "aex.zone/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.aex.zone/v2/exchange-rates?currency=\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("rates").getFloat("\\0\\").power(-1).multiply(1e6).round(),
    }),
    "ascendex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://ascendex.com/api/pro/v1/spot/ticker?symbol=\\0\\/\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getFloat("close").multiply(1e6).round(),
    }),
    "bkex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bkex.com/v2/q/ticker/price?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("price").multiply(1e6).round(),
        tuples: {
            "OP/USDT-6": [ "OP", "USDT" ],
            "REEF/USDT-6": [ "REEF", "USDT" ],
            "SYS/USDT-6": [ "SYS", "USDT" ],
        },
    }),
    "binance.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.binance.com/api/v3/ticker/price?symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("price").multiply(1e6).round(),
    }),
    "binance.us/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.binance.us/api/v3/ticker/price?symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("price").multiply(1e6).round(),
    }),
    "bitfinex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bitfinex.com/v1/pubticker/\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last_price").multiply(1e6).round(),
    }),
    "bitfinex.com/ticker/v2": Witnet.Retrievals.HttpGet({
        url: "https://api-pub.bitfinex.com/v2/ticker/\\0\\",
        script: Witnet.Script().parseJSONMap().getFloat(0).multiply(1e6).round(),
    }),
    "bitget.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bitget.com/api/spot/v1/market/ticker?symbol=\\0\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getFloat("close").multiply(1e6).round(),
        tuples: { "SYS/USDT-6": [ "SYSUSDT_SPBL" ], }
    }),
    "bitmart.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api-cloud.bitmart.com/spot/v1/ticker?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getArray("tickers").getMap(0).getFloat("last_price").multiply(1e6).round(),
    }),
    "bitrue.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://openapi.bitrue.com/api/v1/ticker/price?symbol=\\0\\",
        script: Witnet.Script().parseJSONMap().getFloat("price").multiply(1e6).round(),
    }),
    "bitstamp.net/ticker": Witnet.Retrievals.HttpGet({
        url: "https://www.bitstamp.net/api/v2/ticker/\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e6).round(),
    }),
    "bittrex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bittrex.com/v3/markets/\\0\\-\\1\\/ticker",
        script: Witnet.Script().parseJSONMap().getFloat("lastTradeRate").multiply(1e6).round(),
    }),
    "bybit.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.bybit.com/v5/market/tickers?category=inverse&symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("result").getArray("list").getMap(0).getFloat("lastPrice").multiply(1e6).round(),
    }),
    "coinbase.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.coinbase.com/v2/exchange-rates?currency=\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("rates").getFloat("\\0\\").power(-1).multiply(1e6).round(),
    }),
    "coinbase.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.coinbase.com/v2/exchange-rates?currency=\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("rates").getFloat("\\0\\").power(-1).multiply(1e9).round(),
    }),
    "coinflex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://v2api.coinflex.com/v3/tickers?marketCode=\\0\\-\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("markPrice").multiply(1e6).round(),
    }),
    "coinone.co.kr/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.coinone.co.kr/public/v2/ticker_new/\\0\\/\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("tickers").getMap(0).getFloat("last").multiply(1e3).round(),
    }),
    "coinyep.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://coinyep.com/api/v1/?from=\\0\\&to=\\1\\&lang=es&format=json",
        script: Witnet.Script().parseJSONMap().getFloat("price").multiply(1e9).round(),
    }),
    "digifinex.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://openapi.digifinex.com/v3/ticker?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("ticker").getMap(0).getFloat("last").multiply(1e6).round(),
    }),
    "freeforexapi.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://www.freeforexapi.com/api/live?pairs=\\0\\",
        script: Witnet.Script().parseJSONMap().getMap("rates").getMap("\\0\\").getFloat("rate").power(-1).multiply(1e9).round(),
    }),
    "gateapi.io/ticker": Witnet.Retrievals.HttpGet({
        url: "https://data.gateapi.io/api2/1/ticker/\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e6).round(),
    }),
    "gateapi.io/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://data.gateapi.io/api2/1/ticker/\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e9).round(),
    }),
    "exchangerate.host/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.exchangerate.host/latest?base=\\0\\&symbol=\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("rates").getFloat("\\1\\").multiply(1e9).round(),
        tuples: { "KRW/USD-9": [ "KRW", "USD" ] },
    }),
    "fastforex.io/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.fastforex.io/fetch-one?from=\\0\\&to=\\1\\&api_key=demo",
        script: Witnet.Script().parseJSONMap().getMap("result").getFloat("\\1\\").multiply(1e9).round(),
        tuples: { "KRW/USD-9": [ "KRW", "USD" ] },
    }),
    "gemini.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.gemini.com/v1/pubticker/\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e6).round(),
        tuples: { "USDC/USD-6": [ "usdc", "usd" ] },
    }),
    "hitbtc.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.hitbtc.com/api/3/public/ticker?symbols=\\0\\",
        script: Witnet.Script().parseJSONMap().getMap("\\0\\").getFloat("last").multiply(1e6).round(),
        tuples: { "REEF/USDT-6": [ "REEFUSDT" ] },
    }),
    "hotbit.io/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.hotbit.io/api/v1/market.last?market=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("result").multiply(1e6).round(),
        tuples: { 
            "GLMR/USDT-6": [ "GLMR", "USDT" ],
            "METIS/USDT-6": [ "METIS", "USDT" ],
        },
    }),
    "huobi.pro/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.huobi.pro/market/detail/merged?symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("tick").getFloat("close").multiply(1e6).round(),
        tuples: {
            "BNB/USDT-6": [ "bnb", "usdt" ],
            "BOBA/USDT-6": [ "boba", "usdt" ],
            "BORING/USDT-6": [ "boring", "usdt" ],
            "CUBE/USDT-6": [ "cube", "usdt" ],
            "ELON/USDT-6": [ "elon", "usdt" ],
            "FTM/USDT-6": [ "ftm", "usdt" ],
            "KAVA/USDT-6": [ "kava", "usdt" ],
        }
    }),
    "huobi.pro/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.huobi.pro/market/detail/merged?symbol=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("tick").getFloat("close").multiply(1e6).round(),
        tuples: {
            "BNB/USDT-9": [ "bnb", "usdt" ],
            "BOBA/USDT-9": [ "boba", "usdt" ],
            "BORING/USDT-9": [ "boring", "usdt" ],
            "CUBE/USDT-9": [ "cube", "usdt" ],
            "ELON/USDT-9": [ "elon", "usdt" ],
            "FTM/USDT-9": [ "ftm", "usdt" ],
            "KAVA/USDT-9": [ "kava", "usdt" ],
        },
    }),
    "indoex.io/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.indoex.io/getSelectedMarket/\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("marketdetails").getMap(0).getFloat("last").multiply(1e6).round(),
        tuples: { "BUSD/USDT-6": [ "BUSD", "USDT", ]},
    }),
    "jsdelivr.net/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/\\0\\.json",
        script: Witnet.Script().parseJSONMap().getMap("\\0\\").getFloat("\\1\\").multiply(1e9).round(),
    }),
    "killswitch.finance/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.killswitch.finance/ksw2/prices?chain=56",
        script: Witnet.Script().parseJSONMap().getFloat("\\0\\").multiply(1e6).round(),
    }),
    "korbit.co.kr/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.korbit.co.kr/v1/ticker/detailed?currency_pair=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e3).round(),
    }),
    "kraken.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.kraken.com/0/public/Ticker?pair=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("result").getMap("\\0\\\\1\\").getArray("a").getFloat(0).multiply(1e6).round(),
    }),
    "kraken.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.kraken.com/0/public/Ticker?pair=\\0\\\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("result").getMap("\\0\\\\1\\").getArray("a").getFloat(0).multiply(1e9).round(),
    }),
    "kucoin.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=\\0\\-\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getFloat("price").multiply(1e6).round(),
    }),
    "kucoin.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=\\0\\-\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getFloat("price").multiply(1e9).round(),
    }),
    "live-rates.com/ticker-9": Witnet.Retrievals.HttpGet({
        url: "https://www.live-rates.com/rates",
        script: Witnet.Script()
            .parseJSONArray()
            .filter(
                Witnet.InnerScript(Witnet.Types.RadonMap).getString("currency").match({ "\\1\\/\\0\\": true }, false)
            ).getMap(0).getFloat("rate").power(-1).multiply(1e9).round()
    }),
    "messari.io/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://data.messari.io/api/v1/assets/\\0\\/metrics/market-data?fields=market_data/price_\\1\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("market_data").getFloat("price_\\1\\").multiply(1e9).round(),
    }),
    "mexc.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://www.mexc.com/open/api/v2/market/ticker?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("last").multiply(1e6).round(),
    }),
    "mexc.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://www.mexc.com/open/api/v2/market/ticker?symbol=\\0\\_\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("last").multiply(1e9).round(),
    }),
    "okcoin.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://www.okcoin.com/api/spot/v3/instruments/\\0\\-\\1\\/ticker",
        script: Witnet.Script().parseJSONMap().getFloat("last").multiply(1e6).round(),
    }),
    "okx.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://www.okx.com/api/v5/market/ticker?instId=\\0\\-\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("last").multiply(1e6).round(),
    }),
    "okx.com/ticker#9": Witnet.Retrievals.HttpGet({
        url: "https://www.okx.com/api/v5/market/ticker?instId=\\0\\-\\1\\",
        script: Witnet.Script().parseJSONMap().getArray("data").getMap(0).getFloat("last").multiply(1e9).round(),
    }),
    "pancakeswap.info/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.pancakeswap.info/api/v2/tokens/\\0\\",
        script: Witnet.Script().parseJSONMap().getMap("data").getFloat("price").multiply(1e6).round(),
    }),
    "ultron-dev.net/ticker": Witnet.Retrievals.HttpGet({
        url: "https://exchange-info.ultron-dev.net/api/v1/ultronswap",
        script: Witnet.Script().parseJSONMap().getMap("\\1\\_\\0\\").getFloat("last_price").multiply(1e6).round(),
        tuples: { "WBTC/WULX-6": [ "0xd2b86a80a8f30b83843e247a50ecdc8d843d87dd", "0x3a4f06431457de873b588846d139ec0d86275d54" ], }
    }),
    "ultron-dev.net/ticker#inverse": Witnet.Retrievals.HttpGet({
        url: "https://exchange-info.ultron-dev.net/api/v1/ultronswap",
        script: Witnet.Script().parseJSONMap().getMap("\\0\\_\\1\\").getFloat("last_price").power(-1).multiply(1e6).round(),
        tuples: { "WETH/WULX-6": [ "0x2318bf5809a72aabadd15a3453a18e50bbd651cd", "0x3a4f06431457de873b588846d139ec0d86275d54" ], }
    }),
    "upbit.com/ticker": Witnet.Retrievals.HttpGet({
        url: "https://api.upbit.com/v1/ticker?markets=\\1\\-\\0\\",
        script: Witnet.Script().parseJSONArray().getMap(0).getFloat("trade_price").multiply(1e6).round(),
    }),
    "xt.pub/ticker": Witnet.Retrievals.HttpGet({
        url: "https://www.xt.pub/exchange/api/markets/returnTicker",
        script: Witnet.Script().parseJSONMap().getMap("\\0\\_\\1\\").getFloat("last").multiply(1e6).round(),
    }),
}
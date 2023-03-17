const Witnet = require("witnet-requests");
const witnetRadonScript = () => new Witnet.Script([ Witnet.TYPES.STRING ]);
const requestMethod = Witnet.Types.RETRIEVAL_METHODS.HttpGet;
const requestPath = "";
const requestSchema = "https://";
const ticker = {
    requestMethod, requestSchema, requestPath,
    requestScript: witnetRadonScript()
}
module.exports = {
    "api.aex.zone": {
        "aex/ticker": {
            ...ticker,
            requestPath: "v2/exchange-rates",
            requestQuery: "currency=\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("rates")
                .getFloat("\\0\\")
                .power(-1)
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "ADA", "ALGO", "APE", "ATOM", "AVAX",
                    "BCH", "BTC", "CGLD", "CRO", "DOGE",
                    "DOT", "EOS", "ETH", "LINK", "MATIC",
                    "SHIB", "SOL", "WBTC", "XLM",
                ],
                quote: [
                    "EUR", "USD", 
                ]
            },
        },
    },
    "api.bkex.com": {
        "bkex/ticker": {
            ...ticker,       
            requestPath: "v2/q/ticker/price",
            requestQuery: "symbol=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("price")
                .multiply(1e6)
                .round()
            , templateValues: [[ "OP", "REEF", "SYS" ], [ "USDT" ]],
        }
    },
    "api.binance.com": {
        "binance.com/ticker": {
            ...ticker, 
            requestPath: "api/v3/ticker/price",
            requestQuery: "symbol=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("price")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "CFX", "FTM", "FXS", "GLMR", "KAVA",
                    "KLAY", "OMVR", "OMG", "OP", "REEF",
                    "SYS",
                ],
                quote: [
                    "BTC", "ETH", "USD", "USDT",
                ]
            },
        },
    },
    "api.binance.us": {
        "binance.us/ticker": {
            ...ticker, 
            requestPath: "api/v3/ticker/price",
            requestQuery: "symbol=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("price")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "AVAX", "APE", "AVAX", "BTC", "DAI", 
                    "DOGE", "ETH", "MATIC", "USDC", "USDT",
                ],
                quote: [
                    "BTC", "ETH", "USD", "USDT" 
                ]
            },
        },
    },
    "api.bitfinex.com": {
        "bitfinex/ticker": {
            ...ticker,
            requestPath: "v1/pubticker/\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last_price")
                .multiply(1e6)
                .round()
            , templateValues: [
                [ "alg", "btc", "eth", "omg" ], 
                [ "eth", "btc", "usd" ]
            ],
        }
    },
    "api.bitget.com": {
        "bitget/ticker": {
            ...ticker, 
            requestPath: "api/spot/v1/market/ticker",
            requestQuery: "symbol=\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getFloat("close")
                .multiply(1e6)
                .round()
            , templateValues: [[ "SYSUSDT_SPBL" ]],
        }
    },
    "api.bittrex.com": {
        "bittrex/ticker": {
            ...ticker, 
            requestPath: "v3/markets/\\0\\-\\1\\/ticker",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("lastTradeRate")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "ADA", "ATOM", "AVAX", "BCH", "BTC", 
                    "CELO", "CRO", "DAI", "DOGE", "DOT", 
                    "EOS", "ETH", "FTM", "TUSDT", "USDC",
                    "USDT", "XML",
                ],
                quote: [ "EUR", "USD", "USDT", ],
            },
        }
    },
    "api.bybit.com": {
        "bybit/ticker": {
            ...ticker,
            requestPath: "v5/market/tickers",
            requestQuery: "category=inverse&symbol=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("result")
                .getArray("list")
                .getMap(0)
                .getFloat("lastPrice")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "BNB", ],
                quote: [ "USDT", ],
            }
        },
    },
    "api.coinbase.com": {
        "coinbase/ticker": {
            ...ticker, 
            requestPath: "v2/exchange-rates",
            requestQuery: "currency=\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("rates")
                .getFloat("\\0\\")
                .power(-1)
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "ADA", "ALGO", "APE", "ATOM", "AVAX",
                    "BCH", "BTC", "CGLD", "CRO", "DOGE",
                    "DOT", "EOS", "ETH", "LINK", "MATIC",
                    "SHIB", "SOL", "WBTC", "XLM",
                ],
                quote: [
                    "EUR", "USD", 
                ]
            },
        },
        "coinbase/ticker#9": {
            ...ticker, 
            requestPath: "v2/exchange-rates",
            requestQuery: "currency=\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("rates")
                .getFloat("\\0\\")
                .power(-1)
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [
                    "ADA", "ALGO", "APE", "ATOM", "AVAX",
                    "BCH", "BTC", "CGLD", "CRO", "DOGE",
                    "DOT", "EOS", "ETH", "LINK", "MATIC",
                    "SHIB", "SOL", "WBTC", "XLM",
                ],
                quote: [
                    "EUR", "USD", 
                ]
            },
        },
    },
    "api.coinone.co.kr": {
        "coinone/ticker": {
            ...ticker, 
            requestPath: "public/v2/ticker_new/\\0\\/\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("tickers")
                .getMap(0)
                .getFloat("last")
                .multiply(1e3)
                .round()
            , templateValues: {
                base: [ "krw" ], 
                quote: [ "ksp" ]
            },
        }
    },
    "api.exchangerate.host": {
        "exchangerate/ticker#9": {
            ...ticker,
            requestPath: "latest",
            requestQuery: "base=\\0\\&symbol=\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("rates")
                .getFloat("\\1\\")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ "KRW" ], 
                quote: [ "USD" ]
            },
        }
    },
    "api.fastforex.io": {
        "fastforex/ticker#9": {
            ...ticker,
            requestPath: "fetch-one",
            requestQuery: "from=\\0\\&to=\\1\\&api_key=demo",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("result")
                .getFloat("\\1\\")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ "KRW" ], 
                quote: [ "USD" ]
            },
        }
    },
    "api.gemini.com": {
        "gemini/ticker": {
            ...ticker,
            requestPath: "v1/pubticker/\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "usdc" ], 
                quote: [ "usd" ]
            },
        }
    },
    "api.hitbtc.com": {
        "hitbtc/ticker": {
            ...ticker,            
            requestPath: "api/3/public/ticker",
            requestQuery: "symbols=\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("\\0\\")
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: [[ "REEFUSDT" ]],
        }
    },
    "api.hotbit.io": {
        "hotbit/ticker": {
            ...ticker,
            requestPath: "api/v1/market.last",
            requestQuery: "market=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("result")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "GLMR", "METIS" ], 
                quote: [ "USDT" ]
            },
        }
    },
    "api.huobi.pro": {
        "huobi/ticker": {
            ...ticker,
            requestPath: "market/detail/merged",
            requestQuery: "symbol=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("tick")
                .getFloat("close")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "bnb", "boba", "boring", "cube", "elon", "ftm", "kava" ], 
                quote: [ "usdt" ]
            },
        },
        "huobi/ticker#9": {
            ...ticker,
            requestPath: "market/detail/merged",
            requestQuery: "symbol=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("tick")
                .getFloat("close")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ "bnb", "boba", "boring", "cube", "elon", "ftm", "kava" ], 
                quote: [ "usdt" ]
            },
        },
    },
    "api.indoex.io": {
        "indoex/ticker": {
            ...ticker,
            requestPath: "getSelectedMarket/\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("marketdetails")
                .getMap(0)
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "BUSD",  ], 
                quote: [ "USDT", ]
            },
        },
    },
    "api.killswitch.finance": {
        "killswitch/ticker": {
            ...ticker,
            requestPath: "ksw2/prices",
            requestQuery: "chain=56",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("\\0\\")
                .multiply(1e6)
                .round()
        }
    },
    "api.korbit.co.kr": {
        "korbit/ticker": {
            ...ticker,
            requestPath: "v1/ticker/detailed",
            requestQuery: "currency_pair=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e3)
                .round()
            , templateValues: {
                base: [ "ksp" ], 
                quote: [ "krw" ]
            },
        }
    },
    "api.kraken.com": {
        "kraken/ticker": {
            ...ticker,
            requestPath: "0/public/Ticker",
            requestQuery: "pair=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("result")
                .valuesAsArray()
                .getMap(0)
                .getArray("a")
                .getFloat(0)
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ 
                    "ADA", "ALGO", "APE", "ATOM", "AVAX",
                    "BCH", "BTC", "DAI", "DOGE", "DOT",
                    "EOS", "ETH", "MATIC", "OMG", "SHIB",
                    "SOL", "USDC", "USDT", "WBTC", "XLM"
                ],
                quote: [ 
                    "BTC", "ETH", "USD" 
                ],
            },
        },
        "kraken/ticker#9": {
            ...ticker,
            requestPath: "0/public/Ticker",
            requestQuery: "pair=\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("result")
                .valuesAsArray()
                .getMap(0)
                .getArray("a")
                .getFloat(0)
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ 
                    "ADA", "ALGO", "APE", "ATOM", "AVAX",
                    "BCH", "BTC", "DAI", "DOGE", "DOT",
                    "EOS", "ETH", "MATIC", "OMG", "SHIB",
                    "SOL", "USDC", "USDT", "WBTC", "XLM"
                ],
                quote: [ 
                    "BTC", "ETH", "USD" 
                ],
            },
        }
    },
    "api.kucoin.com": {
        "kucoin/ticker": {
            ...ticker, 
            requestQuery: "symbol=\\0\\-\\1\\",
            requestPath: "api/v1/market/orderbook/level1",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getFloat("price")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [
                    "CFX", "CRO", "ELON", "FTM", "FXS",
                    "GLMR", "KAVA", "KCS", "KLAY", "MJT",
                    "MOVR", "MTRG", "OP", "REEF", "SYS",
                ],
                quote: [
                    "KCS", "USDT",
                ]
            },
        },
        "kucoin/ticker#9": {
            ...ticker, 
            requestQuery: "symbol=\\0\\-\\1\\",
            requestPath: "api/v1/market/orderbook/level1",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getFloat("price")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [
                    "CFX", "CRO", "ELON", "FTM", "FXS",
                    "GLMR", "KAVA", "KCS", "KLAY", "MJT",
                    "MOVR", "MTRG", "OP", "REEF", "SYS",
                ],
                quote: [
                    "KCS", "USDT",
                ]
            },
        }
    },
    "api.pancakeswap.info": {
        "pancakeswap/ticker": {
            ...ticker,
            requestPath: "api/v2/tokens/\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getFloat("price")
                .multiply(1e6)
                .round()
        }
    },
    "api.upbit.com": {
        "upbit/ticker": {
            ...ticker,
            requestPath: "v1/ticker",
            requestQuery: "markets=\\1\\-\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONArray()
                .getMap(0)
                .getFloat("trade_price")
                .multiply(10 ** 6)
                .round()
        },
    },
    "api-cloud.bitmart.com": {
        "bitmart/ticker": {
            ...ticker, 
            requestPath: "spot/v1/ticker",
            requestQuery: "symbol=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getArray("tickers")
                .getMap(0)
                .getFloat("last_price")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "BUSD" ],
                quote: [ "USDT" ],
            },
        }
    },
    "api-pub.bitfinex.com": {
        "bitfinex-pub/ticker": {
            ...ticker,
            requestPath: "v2/ticker/\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat(0)
                .multiply(1e6)
                .round()
            , templateValues: [["tTSDUSD"]],
        }
    },
    "ascendex.com": {
        "ascendex/ticker": {
            ...ticker,
            requestPath: "api/pro/v1/spot/ticker",
            requestQuery: "symbol=\\0\\/\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getFloat("close")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "CRO", "KCS" ], 
                quote: [ "USDT" ]
            },
        }
    },
    "cdn.jsdelivr.net": {
        "jsdelivr/ticker#9": {
            ...ticker,
            requestPath: "gh/fawazahmed0/currency-api@1/latest/currencies/\\0\\.json",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("\\0\\")
                .getFloat("\\1\\")
                .multiply(1e9)
                .round()
            , templateValues: { 
                base: [ "krw"],
                quote: [ "usd" ]
            },
        }
    },
    "coinyep.com": {
        "coinyep/ticker-9": {
            ...ticker,
            requestPath: "api/v1/",
            requestQuery: "from=\\0\\&to=\\1\\&lang=es&format=json",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("price")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ "OMG" ], 
                quote: [ "ETH" ]
            },
        }
    },
    "data.gateapi.io": {
        "gateio/ticker": {
            ...ticker,
            requestPath: "api2/1/ticker/\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ 
                    "boba", "boring", "cfx", "cro", "cube",
                    "dai", "elon", "frax", "ftm", "fxs", 
                    "glmr", "kava", "metis", "movr", "mtrg",
                    "mtr", "okt", "omg", "op", "reef",
                    "shib", "sys" 
                ], 
                quote: [ 
                    "btc", "eth", "usd", "usdt"
                ],
            },
        },
        "gateio/ticker#9": {
            ...ticker,
            requestPath: "api2/1/ticker/\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ 
                    "boba", "boring", "cfx", "cro", "cube",
                    "dai", "elon", "frax", "ftm", "fxs", 
                    "glmr", "kava", "metis", "movr", "mtrg",
                    "mtr", "okt", "omg", "op", "reef",
                    "shib", "sys" 
                ], 
                quote: [ 
                    "btc", "eth", "usd", "usdt"
                ],
            },
        },
    },
    "data.messari.io": {
        "messari/ticker-9": {
            ...ticker,
            requestPath: "api/v1/assets/\\0\\/metrics/market-data",
            requestQuery: "fields=market_data/price_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("market_data")
                .getFloat("price_\\1\\")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ "omg" ], 
                quote: [ "eth "]
            },
        }
    },
    "exchange-info.ultron-dev.net": {
        "ultron-dev/ticker": {
            ...ticker,
            requestPath: "api/v1/ultronswap",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("\\1\\_\\0\\")
                .getFloat("last_price")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "0xd2b86a80a8f30b83843e247a50ecdc8d843d87dd" ], // WBTC
                quote: [ "0x3a4f06431457de873b588846d139ec0d86275d54" ], // WULX
            }
        },
        "ultron-dev/ticker#inverse": {
            ...ticker,
            requestPath: "api/v1/ultronswap",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("\\0\\_\\1\\")
                .getFloat("last_price")
                .power(-1)
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ "0x2318bf5809a72aabadd15a3453a18e50bbd651cd" ], // WETH
                quote: [ "0x3a4f06431457de873b588846d139ec0d86275d54" ], // WULX
                
            }
        }
    },
    "openapi.bitrue.com": {
        "bitrue/ticker": {
            ...ticker,
            requestPath: "api/v1/ticker/price",
            requestQuery: "symbol=\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("price")
                .multiply(1e6)
                .round()
            , templateValues: [[ "BATUSDT", "REEFUSDT" ]],
        }
    },
    "openapi.digifinex.com": {
        "digifinex/ticker": {
            ...ticker,
            requestPath: "v3/ticker",
            requestQuery: "symbol=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("ticker")
                .getMap(0)
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: { 
                base: [ "op", "reef", "sys" ], 
                quote: [ "usdt" ]
            },
        }
    },
    "v2api.coinflex.com": {
        "coinflex/ticker": {
            ...ticker,
            requestPath: "v3/tickers",
            requestQuery: "marketCode=\\0\\-\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("markPrice")
                .multiply(1e6)
                .round()
        }
    },
    "www.bitstamp.net": {
        "bitstamp/ticker": {
            ...ticker,
            requestPath: "api/v2/ticker/\\0\\\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ 
                    "ada", "algo", "bch", "btc", "dai",
                     "eth", "link", "matic", "omg", "usdc",
                     "usdt", "xlm"
                ],
                quote: [ "btc", "usd" ]
            },
        }
    },
    "www.freeforexapi.com": {
        "freeforexapi/ticker-9": {
            ...ticker,
            requestPath: "api/live",
            requestQuery: "pairs=\\0\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("rates")
                .getMap("\\0\\")
                .getFloat("rate")
                .power(-1)
                .multiply(1e9)
                .round()
            , templateValues: [[ "USDKRW" ]],
        }
    },
    "www.live-rates.com": {
        "live-rates/ticker-9": {
            ...ticker,
            requestPath: "rates",
            requestScript: witnetRadonScript()
                .parseJSONArray()
                .filter(new Witnet.Script([ Witnet.TYPES.MAP ])
                    .getString("currency")
                    .match(
                        [ "\\1\\/\\0\\", true ],
                        false
                    )
                )
                .getMap(0)
                .getFloat("rate")
                .power(-1)
                .multiply(1e9)
                .round()
            , templateValues: { base: [ "KRW" ], quote: [ "USD" ]},
        }
    },
    "www.mexc.com": {
        "mexc/ticker": {
            ...ticker,
            requestPath: "open/api/v2/market/ticker",
            requestQuery: "symbol=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: {
                base: [ 
                    "BOBA", "BORING", "CFX", "ELON", "FTM",
                    "FXS", "GLMR", "KAVA", "KCS", "METIS",
                    "MTRG", "MTR", "NATION", "OKT", "OMG",
                    "SYS" 
                ], 
                quote: [ 
                    "BTC", "ETH", "USDT" 
                ],
            },
        },
        "mexc/ticker#9": {
            ...ticker,
            requestPath: "open/api/v2/market/ticker",
            requestQuery: "symbol=\\0\\_\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("last")
                .multiply(1e9)
                .round()
            , templateValues: {
                base: [ 
                    "BOBA", "BORING", "CFX", "ELON", "FTM",
                    "FXS", "GLMR", "KAVA", "KCS", "METIS",
                    "MTRG", "MTR", "NATION", "OKT", "OMG",
                    "SYS" 
                ], 
                quote: [ 
                    "BTC", "ETH", "USDT" 
                ],
            },
        }
    },
    "www.okcoin.com": {
        "okcoin/ticker": {
            ...ticker,
            requestPath: "api/spot/v3/instruments/\\0\\-\\1\\/ticker",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: { base: [ "CELO" ], quote: [ "USD" ] },
        }
    },
    "www.okx.com": {
        "okx/ticker": {
            ...ticker,
            requestPath: "api/v5/market/ticker",
            requestQuery: "instId=\\0\\-\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("last")
                .multiply(1e6)
                .round()
        },
        "okx/ticker#9": {
            ...ticker,
            requestPath: "api/v5/market/ticker",
            requestQuery: "instId=\\0\\-\\1\\",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getArray("data")
                .getMap(0)
                .getFloat("last")
                .multiply(1e9)
                .round()
        },
    },
    "www.xt.pub": {
        "xt/ticker": {
            ...ticker,
            requestPath: "exchange/api/markets/returnTicker",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("\\0\\_\\1\\")
                .getFloat("last")
                .multiply(1e6)
                .round()
            , templateValues: { base: [ "CUBE" ], quote: [ "USDT" ] },
        }
    }
};
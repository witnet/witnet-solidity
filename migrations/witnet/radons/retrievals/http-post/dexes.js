const Witnet = require("witnet-requests")
const witnetRadonScript = () => new Witnet.Script([ Witnet.TYPES.STRING ]);

const requestMethod = Witnet.Types.RETRIEVAL_METHODS.HttpPost;
const requestSchema = "https://";
const subgraphTicker = {
    requestMethod,
    requestSchema,
    requestBody: "{\"query\":\"{pair(id:\\\"\\0\\\\\"){token\\1\\Price}}\"}",
    requestScript: witnetRadonScript()
        .parseJSONMap()
        .getMap("data")
        .getMap("pair")
        .getFloat("token\\1\\Price")
        .multiply(1e6)
        .round()
};
const token_index = [ 0, 1, ];

/// module exports
module.exports = {
    "api.thegraph.com": {
        "subgraphs/name/beamswap/beamswap-dex": {
            ...subgraphTicker,
            templateValues: {
                pair_id: [ 
                    "0x61b4cec9925b1397b64dece8f898047eed0f7a07", // GLINT/USDC
                ],
                token_index,
            },
        },
        "subgraphs/name/jesse-sawa/uniswap-celo": {
            requestMethod,
            requestSchema,
            requestBody: "{\"query\":\"{pool(id:\\\"\\0\\\\\"){token\\1\\Price}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("pool")
                .getFloat("token\\1\\Price")
                .multiply(1e6)
                .round()
            , templateValues: {
                pair_id: [
                    "0xdb24905b1b080f65dedb0ad978aad5c76363d3c6", // CELO/NCT
                ],
                token_index,
            },
        },
        "subgraphs/name/oolongswap/oolongswap-mainnet": {
            requestMethod,
            requestSchema,
            requestBody: "{\"query\":\"{pairs(where:{token0:\\\"\\0\\\\\",token1:\\\"\\1\\\\\"}){token1Price}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getArray("pairs")
                .getMap(0)
                .getFloat("token1Price")
                .multiply(1e6)
                .round()
            , templateValues: {
                token0: [
                    "0x5008f837883ea9a07271a1b5eb0658404f5a9610", // OLO
                ],
                token1: [
                    "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc", // USDC
                ],
            },
        },
        "subgraphs/name/sameepsi/quickswap-v3": {
            requestMethod,
            requestSchema,
            requestBody: "{\"query\":\"{pool(id:\\\"\\0\\\\\"){token\\1\\Price}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("pool")
                .getFloat("token\\1\\Price")
                .multiply(1e6)
                .round()
            , templateValues: {
                pair_id: [
                    "0x022df0b3341b3a0157eea97dd024a93f7496d631", // QUICK/USDC
                ],
                token_index,
            },
        },
        "subgraphs/name/sameepsi/quickswap-v3_9": {
            requestMethod,
            requestSchema,
            requestPath: "subgraphs/name/sameepsi/quickswap-v3",
            requestBody: "{\"query\":\"{pool(id:\\\"\\0\\\\\"){token\\1\\Price}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("pool")
                .getFloat("token\\1\\Price")
                .multiply(1e9)
                .round()
            , templateValues: {
                pair_id: [
                    "0x022df0b3341b3a0157eea97dd024a93f7496d631", // QUICK/USDC
                ],
                token_index,
            },
        },
        "subgraphs/name/stellaswap/stella-swap": {
            ...subgraphTicker,
            templateValues: {
                pair_id: [
                    "0x81e11a9374033d11cc7e7485a7192ae37d0795d6", // STELLA/USDT
                ],
                token_index,
            },
        },
        "subgraphs/name/sushiswap/matic-exchange": {
            ...subgraphTicker,
            templateValues: {
                pair_id: [
                    "0x5cf66ceaf7f6395642cd11b5929499229edef531", // VSQ/DAI
                ],
                token_index,
            },
        },
        "subgraphs/name/ubeswap/ubeswap": {
            ...subgraphTicker,
            requestBody: "{\"query\":\"{query PairsCurrent{pairs(first:100,orderBy:reserveUSD,orderDirection:desc,subgraphError:allow){id token\\1\\Price}}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getArray("pairs")
                .filter(
                    new Witnet.Script([ Witnet.TYPES.MAP ])
                        .getString("id")
                        .match([ "\\0\\", true ], false)
                )
                .getMap(0)
                .getFloat("token\\1\\Price")
                .multiply(1e6)
                .round()
            , templateValues: {
                pair_id: [
                    "0x7d63809ebf83ef54c7ce8ded3591d4e8fc2102ee", // IMMO/mCUSD
                ],
                token_index,
            },
        },
        "subgraphs/name/uniswap/uniswap-v3": {
            ...subgraphTicker,
            requestBody: "{\"query\":\"{pool(id:\\\"\\0\\\\\"){token\\1\\Price}}\"}",
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("pool")
                .getFloat("token\\1\\Price")
                .multiply(1e6)
                .round()
            , templateValues: {
                pair_id: [
                    "0xc2a856c3aff2110c1171b8f942256d40e980c726", // FRAX/USDT
                    "0xc2a856c3aff2110c1171b8f942256d40e980c726", // NATION/USDT
                    "0x9adf4617804c762f86fc4e706ad0424da3b100a7", // ULX/USDT
                ],
                token_index,
            },
        },        
    },
    "info.kuswap.finance": {
        "subgraphs/name/kuswap/swap": {
            ...subgraphTicker,
            templateValues: {
                pair_id: [
                    "0x1ee6b0f7302b3c48c5fa89cd0a066309d9ac3584", // KCS/KUS
                ],
                token_index,
            }
        }
    },
    "thegraph.kcc.network": {
        "subgraphs/name/mojito/swap": {
            ...subgraphTicker,
            templateValues: {
                pair_id: [
                    "0xb3b92d6b2656f9ceb4a381718361a21bf9b82bd9", // KCS/USDT
                    "0xa0d7c8aa789362cdf4faae24b9d1528ed5a3777f", // KCS/MJT
                    "0x1162131b63d95210acf5b3419d38c68492f998cc", // SAX/USDT
                ],
                token_index,
            }
        },
        "subgraphs/name/mojito/swap#9": {
            ...subgraphTicker,
            requestScript: witnetRadonScript()
                .parseJSONMap()
                .getMap("data")
                .getMap("pair")
                .getFloat("token\\1\\Price")
                .multiply(1e9)
                .round()
            , templateValues: {
                pair_id: [
                    "0xa0d7c8aa789362cdf4faae24b9d1528ed5a3777f", // MJT/KCS
                ],
                token_index,
            }
        },
    },
};
const Witnet = require("witnet-utils")

const defaultQuery = { query: `{ pair (id: "\\0\\") { token\\1\\Price } }` }
const defaultScript = { 
    script: Witnet.Script()
        .parseJSONMap()
        .getMap("data")
        .getMap("pair")
        .getFloat("token\\1\\Price")
        .multiply(1e6)
        .round(),
}

module.exports = {
    "beamswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/beamswap/beamswap-dex",
        ...defaultQuery,
        ...defaultScript,
    }),
    "kuswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://info.kuswap.finance/subgraphs/name/kuswap/swap",
        ...defaultQuery,
        ...defaultScript,
    }),
    "mojitoswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://thegraph.kcc.network/subgraphs/name/mojito/swap",
        ...defaultQuery,
        ...defaultScript,
    }),
    "mojitoswap/ticker#9": Witnet.Retrievals.GraphQLQuery({
        url: "https://thegraph.kcc.network/subgraphs/name/mojito/swap",
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("pair").getFloat("token\\1\\Price").multiply(1e9).round(),
        ...defaultQuery,
    }),
    "oolongswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/oolongswap/oolongswap-mainnet",
        query: `{ pairs ( where: { token0: "\\0\\", token1: "\\1\\" }) { token1Price } }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getArray("pairs").getMap(0).getFloat("token1Price").multiply(1e6).round(),
    }),
    "quickswap-v3/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3",
        query: `{ pool (id: "\\0\\") { token\\1\\Price } }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("pool").getFloat("token\\1\\Price").multiply(1e6).round(),
    }),
    "quickswap-v3/ticker#9": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3",
        query: `{ pool (id: "\\0\\") { token\\1\\Price } }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("pool").getFloat("token\\1\\Price").multiply(1e6).round(),
    }),
    "stellaswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/stellaswap/stella-swap",
        ...defaultQuery,
        ...defaultScript,
    }),
    "sushiswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange",
        ...defaultQuery,
        ...defaultScript
    }),
    "ubeswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap",
        query: `
            query PairsCurrent { 
                pairs (first: 100, orderBy: reserveUSD, orderDirection: desc, subgraphError: allow) {
                    id token\\1\\Price 
                } 
            }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getArray("pairs").filter(
                Witnet.InnerScript(Witnet.Types.RadonMap).getString("id").match({ "\\0\\": true }, false)
            ).getMap(0).getFloat("token\\1\\Price").multiply(1e6).round(),
    }),
    "uniswap-celo/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo",
        query: `{ pool (id: "\\0\\") { token\\1\\Price } }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("pool").getFloat("token\\1\\Price").multiply(1e6).round(),
    }),
    "uniswap-v3/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
        query: `{ pool (id: "\\0\\") { token\\1\\Price } }`,
        script: Witnet.Script().parseJSONMap().getMap("data").getMap("pool").getFloat("token\\1\\Price").multiply(1e6).round(),
    }),    
}

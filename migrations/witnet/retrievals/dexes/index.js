const Witnet = require("witnet-utils")

const defaultTicker = {
    query: `{ pair (id: "\\0\\") { token\\1\\Price } }`,
    script: Witnet.Script().parseJSONMap().getMap("data").getMap("pair").getFloat("token\\1\\Price").multiply(1e6).round(),
}

module.exports = {
    "beamswap/ticker": Witnet.Retrievals.GraphQLQuery({
        url: "https://api.thegraph.com/subgraphs/name/beamswap/beamswap-dex",
        ...defaultTicker,
    }),
}

const Witnet = require("witnet-utils")

module.exports = {
    "CrossChainWitSupplyInfo": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.WitGetSupplyInfo(),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
    "CrossChainWitGetTransactionByHash": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.WitGetTransactionByHash("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),  
}
const Witnet = require("../../../../dist/lib/radon")

module.exports = {
    "wit-supply-info": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.WIT.getSupplyInfo(),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
    "wit-get-transaction-by-hash": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.WIT.getTransactionByHash("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),  
}
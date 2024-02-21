const Witnet = require("witnet-toolkit")

module.exports = {
  "wit-supply-info": Witnet.Sources.CrossChainDataSource({
    url: "\\0\\",
    rpc: Witnet.CCDR.WIT.getSupplyInfo(),
    script: Witnet.Script().parseJSONMap().getMap("result"),
  }),
  "wit-get-transaction-by-hash": Witnet.Sources.CrossChainDataSource({
    url: "\\0\\",
    rpc: Witnet.CCDR.WIT.getTransactionByHash("\\1\\"),
    script: Witnet.Script().parseJSONMap().getMap("result"),
  }),
}

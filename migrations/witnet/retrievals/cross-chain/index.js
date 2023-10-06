const Witnet = require("witnet-utils")
module.exports = {
    RPC: {
        ETH: {
            "eth-block-number": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthBlockNumber(),
                script: Witnet.Script().parseJSONMap().getString("result")
            }),
            "eth-gas-price": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGasPrice(),
                script: Witnet.Script().parseJSONMap().getString("result")
            }),
            "eth-get-balance": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGetBalance("\\1\\"),
                script: Witnet.Script().parseJSONMap().getString("result")
            }),
            "eth-get-code": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGetCode("\\1\\"),
                script: Witnet.Script().parseJSONMap().getString("result")
            }),
            "eth-get-storage-at": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGetStorageAt("\\1\\", "\\2\\"),
                script: Witnet.Script().parseJSONMap().getString("result")
            }),
            "eth-get-transaction-by-hash": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGetTransactionByHash("\\1\\"),
                script: Witnet.Script().parseJSONMap().getMap("result"),
            }),
            "eth-get-transaction-receipt": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.EthGetTransactionReceipt("\\1\\"),
                script: Witnet.Script().parseJSONMap().getMap("result"),
            }),
        },
        WIT: {
            "wit-supply-info": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.WitGetSupplyInfo(),
                script: Witnet.Script().parseJSONMap().getMap("result"),
            }),
            "wit-get-transaction-by-hash": Witnet.Retrievals.CrossChainCall({
                url: "\\0\\",
                rpc: Witnet.Retrievals.RPC.WitGetTransactionByHash("\\1\\"),
                script: Witnet.Script().parseJSONMap().getMap("result"),
            }),
        }
    }   
}
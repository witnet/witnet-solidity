const Witnet = require("witnet-utils")
module.exports = {
    "cross-chain-block-number": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthBlockNumber(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "cross-chain-gas-price": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGasPrice(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "cross-chain-get-balance": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetBalance("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "cross-chain-get-code": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetCode("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "cross-chain-get-storage-at": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetStorageAt("\\1\\", "\\2\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "cross-chain-get-transaction-by-hash": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetTransactionByHash("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
    "cross-chain-get-transaction-receipt": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetTransactionReceipt("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
}
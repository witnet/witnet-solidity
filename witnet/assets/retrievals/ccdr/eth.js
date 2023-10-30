const Witnet = require("witnet-utils")

module.exports = {
    "CrossChainEthBlockNumber": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthBlockNumber(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "CrossChainEthGasPrice": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGasPrice(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "CrossChainEthGetBalance": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetBalance("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "CrossChainEthGetCode": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetCode("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "CrossChainEthGetStorageAt": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetStorageAt("\\1\\", "\\2\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "CrossChainEthGetTransactionByHash": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetTransactionByHash("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
    "CrossChainEthGetTransactionReceipt": Witnet.Retrievals.CrossChainCall({
        url: "\\0\\",
        rpc: Witnet.Retrievals.RPC.EthGetTransactionReceipt("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
}
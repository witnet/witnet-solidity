const Witnet = require("witnet-toolkit")

module.exports = {
    "eth-block-number": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.blockNumber(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "eth-gas-price": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.gasPrice(),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "eth-get-balance": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.getBalance("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "eth-get-code": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.getCode("\\1\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "eth-get-storage-at": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.getStorageAt("\\1\\", "\\2\\"),
        script: Witnet.Script().parseJSONMap().getString("result")
    }),
    "eth-get-transaction-by-hash": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.getTransactionByHash("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
    "eth-get-transaction-receipt": Witnet.Retrievals.CrossChainDataRetrieval({
        url: "\\0\\",
        rpc: Witnet.CCDR.ETH.getTransactionReceipt("\\1\\"),
        script: Witnet.Script().parseJSONMap().getMap("result"),
    }),
}
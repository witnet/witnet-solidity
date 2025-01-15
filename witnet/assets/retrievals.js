const Witnet = require("witnet-toolkit")
const retrievals = require("./retrievals")

module.exports = {
    CCDR: {
        "ccdr/ethBlockNumber": 
            Witnet.RadonRetrieve.CrossChainRPC({
                rpc: Witnet.RadonRetrieve.CCDR.ETH.blockNumber(),
                script: Witnet.RadonScript(Witnet.RadonString)
                    .parseJSONMap()
                    .getString("result"),
            }),
        "ccdr/ethGasPrice": 
            Witnet.RadonRetrieve.CrossChainRPC({
                rpc: Witnet.RadonRetrieve.CCDR.ETH.gasPrice(),
                script: Witnet.RadonScript(Witnet.RadonString)
                    .parseJSONMap()
                    .getString("result"),
            }),
        "ccdr/ethTransactionByHash": 
            Witnet.RadonRetrieve.CrossChainRPC({
                rpc: Witnet.RadonRetrieve.CCDR.ETH.getBalance("\\1\\"),
                script: Witnet.RadonScript(Witnet.RadonString)
                    .parseJSONMap()
                    .getString("result"),
            }),
        "ccdr/witSupplyInfo":
            Witnet.RadonRetrieve.CrossChainRPC({
                rpc: Witnet.RadonRetrieve.CCDR.WIT.getSupplyInfo(),
                script: Witnet.RadonScript(Witnet.RadonString)
                    .parseJSONMap()
                    .getMap("result"),
            }),
        "ccdr/witTransactionByHash":
            Witnet.RadonRetrieve.CrossChainRPC({
                rpc: Witnet.RadonRetrieve.CCDR.WIT.getTransactionByHash("\\1\\"),
                script: Witnet.RadonScript(Witnet.RadonString)
                    .parseJSONMap()
                    .getMap("result"),
            }),
    },
};

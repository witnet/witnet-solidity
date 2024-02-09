const Witnet = require("witnet-toolkit")

const sources = Witnet.Dictionary(
    Witnet.Sources.Class,
    require("../sources")
);

module.exports = {
    WitnetRequestTemplateEthBlockNumber: Witnet.RequestTemplate({
        retrieve: sources["eth-block-number"],
        tests: {
            "get block number from sepolia works": [ 
                "https://provider-url", 
            ],
        }
    }),
    WitnetRequestTemplateEthGasPrice: Witnet.RequestTemplate({
        retrieve: sources["eth-gas-price"],
        tests: {
            "get balance from sepolia works": [ 
                "https://provider-url", 
            ],
        }
    }),
    WitnetRequestTemplateEthTransactionByHash: Witnet.RequestTemplate({
        retrieve: sources["eth-get-transaction-by-hash"],
        tests: {
            "get transaction by hash from sepolia works": [ 
                "https://provider-url", 
                "transaction-hash", 
            ],
        }
    }),
    WitnetRequestTemplateWitSupplyInfo: Witnet.RequestTemplate({
        retrieve: sources["wit-supply-info"],
        tests: {
            "get Witnet supply info": [
                "https://provider-url", 
                "transaction-hash",
            ]
        }
    }),
    WitnetRequestTemplateWitTransactionByHash: Witnet.RequestTemplate({
        retrieve: sources["wit-get-transaction-by-hash"],
        tests: {
            "get transaction by hash from witnet works": [
                "https://provider-url", 
                "transaction-hash",
            ],
        }
    })
}
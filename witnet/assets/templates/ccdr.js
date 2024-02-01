const Witnet = require("../../../dist/lib/radon")
const retrievals = Witnet.Dictionary(
    Witnet.Retrievals.Class,
    require("../retrievals")
);

module.exports = {
    WitnetRequestTemplateEthBlockNumber: Witnet.RequestTemplate({
        retrieve: retrievals["eth-block-number"],
        tests: {
            "get block number from sepolia works": [ 
                "https://provider-url", 
            ],
        }
    }),
    WitnetRequestTemplateEthGasPrice: Witnet.RequestTemplate({
        retrieve: retrievals["eth-gas-price"],
        tests: {
            "get balance from sepolia works": [ 
                "https://provider-url", 
            ],
        }
    }),
    WitnetRequestTemplateEthTransactionByHash: Witnet.RequestTemplate({
        retrieve: retrievals["eth-get-transaction-by-hash"],
        tests: {
            "get transaction by hash from sepolia works": [ 
                "https://provider-url", 
                "transaction-hash", 
            ],
        }
    }),
    WitnetRequestTemplateWitSupplyInfo: Witnet.RequestTemplate({
        retrieve: retrievals["wit-supply-info"],
        tests: {
            "get Witnet supply info": [
                "https://provider-url", 
                "transaction-hash",
            ]
        }
    }),
    WitnetRequestTemplateWitTransactionByHash: Witnet.RequestTemplate({
        retrieve: retrievals["wit-get-transaction-by-hash"],
        tests: {
            "get transaction by hash from witnet works": [
                "https://provider-url", 
                "transaction-hash",
            ],
        }
    })
}
const Witnet = require("witnet-toolkit")

const sources = Witnet.Dictionary(
  Witnet.Sources.Class,
  require("../sources")
)

module.exports = {
  WitnetRequestTemplateEthBlockNumber: Witnet.RequestTemplate({
    retrieve: sources["eth-block-number"],
    tests: {
      "get block number from sepolia works": [
        "https://worldchain-mainnet.g.alchemy.com/public",
      ],
    },
  }),
  WitnetRequestTemplateEthGasPrice: Witnet.RequestTemplate({
    retrieve: sources["eth-gas-price"],
    tests: {
      "get balance from sepolia works": [
        "https://worldchain-mainnet.g.alchemy.com/public",
      ],
    },
  }),
  WitnetRequestTemplateEthTransactionByHash: Witnet.RequestTemplate({
    retrieve: sources["eth-get-transaction-by-hash"],
    tests: {
      "get transaction by hash from sepolia works": [
        "https://worldchain-mainnet.g.alchemy.com/public",
        "0xee0a762f4d76f824cd5e7d10fe86ff6c57e8bebf1aab6047be99ac27fe38bfd9",
      ],
    },
  }),
  WitnetRequestTemplateWitSupplyInfo: Witnet.RequestTemplate({
    retrieve: sources["wit-supply-info"],
    tests: {
      "get witnet supply info": [
        "http://3.133.4.38:21339",
      ],
    },
  }),
  WitnetRequestTemplateWitTransactionByHash: Witnet.RequestTemplate({
    retrieve: sources["wit-get-transaction-by-hash"],
    tests: {
      "get transaction by hash from witnet works": [
        "http://3.133.4.38:21339",
        "c40ecb835212dfe64feeebb5493fc49066d5207f28372672b219ca43fda08e7d",
      ],
    },
  }),
}

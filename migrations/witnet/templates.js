const priceTicker = {
    aggregator: 'price-aggregator',
    tally: 'price-tally', 
}
module.exports = {
    dexes: {
        WitnetRequestTemplateBeamswap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/beamswap/beamswap-dex',
            ],
        },
        WitnetRequestTemplateKuswap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/kuswap/swap',
            ],
        },
        WitnetRequestTemplateMaticExchange: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/sushiswap/matic-exchange',
            ],
        },
        WitnetRequestTemplateMojitoSwap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/mojito/swap'
            ],
        },
        WitnetRequestTemplateOolongswap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/oolongswap/oolongswap-mainnet'
            ],
        },
        WitnetRequestTemplateQuickswap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/sameepsi/quickswap-v3'
            ],
        },
        WitnetRequestTemplateQuickswap_9: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/sameepsi/quickswap-v3_9'
            ],
        },
        WitnetRequestTemplateStellaSwap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/stellaswap/stella-swap'
            ],
        },
        WitnetRequestTemplateUbeswap: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/ubeswap/ubeswap',
            ],
        },
        WitnetRequestTemplateUniswapCelo: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/jesse-sawa/uniswap-celo'
            ],
        },
        WitnetRequestTemplateUniswapV3: {
            ...priceTicker,
            retrievals: [
                'subgraphs/name/uniswap/uniswap-v3'
            ],
        },
    },
};
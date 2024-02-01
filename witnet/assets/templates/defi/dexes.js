const Witnet = require("../../../../dist/lib/radon")

const retrievals = new Witnet.Dictionary(
    Witnet.Retrievals.Class, 
    require("../../retrievals")
)

module.exports = {
    WitnetRequestTemplateBeamswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['beamswap/ticker'],
        ],
        tests: { 
            "GLINT/USDC-6 must work": [[ "0x61b4cec9925b1397b64dece8f898047eed0f7a07", "0" ]],
        },
    }),
    WitnetRequestTemplateKuswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['kuswap/ticker'],
        ],
        tests: { 
            "KUS/KCS-6 must work": [[ "0x1ee6b0f7302b3c48c5fa89cd0a066309d9ac3584", "0" ]],
        },
    }),
    WitnetRequestTemplateMojitoTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['mojitoswap/ticker'],
        ],
        tests: { 
            "KCS/USDT-6 must work": [[ "0xb3b92d6b2656f9ceb4a381718361a21bf9b82bd9", "0" ]],
            "MJT/KCS-6 must work": [[ "0xa0d7c8aa789362cdf4faae24b9d1528ed5a3777f", "1" ]],
            "SAX/USDT-6 must work": [[ "0x1162131b63d95210acf5b3419d38c68492f998cc", "0" ]],
        },
    }),
    WitnetRequestTemplateMojitoTicker9: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['mojitoswap/ticker#9'],
        ],
        tests: { 
            "KCS/USDT-9 must work": [[ "0xb3b92d6b2656f9ceb4a381718361a21bf9b82bd9", "0" ]],
            "MJT/KCS-9 must work": [[ "0xa0d7c8aa789362cdf4faae24b9d1528ed5a3777f", "1" ]],
            "SAX/USDT-9 must work": [[ "0x1162131b63d95210acf5b3419d38c68492f998cc", "0" ]],
        },
    }),
    WitnetRequestTemplateOolongTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['oolongswap/ticker'],
        ],
        tests: { 
            "OLO/USDC-6 must work": [[ 
                "0x5008f837883ea9a07271a1b5eb0658404f5a9610", 
                "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc" 
            ]],
        },
    }),
    WitnetRequestTemplateQuickswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['quickswap-v3/ticker'],
        ],
        tests: { 
            "QUICK/USDC-6 must work": [[ "0x022df0b3341b3a0157eea97dd024a93f7496d631", "0" ]],
        },
    }),
    WitnetRequestTemplateQuickswapTicker9: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['quickswap-v3/ticker#9'],
        ],
        tests: { 
            "QUICK/USDC-9 must work": [[ "0x022df0b3341b3a0157eea97dd024a93f7496d631", "0" ]],
        },
    }),
    WitnetRequestTemplateStellaswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['stellaswap/ticker'],
        ],
        tests: { 
            "STELLA/USDT-6 must work": [[ "0x81e11a9374033d11cc7e7485a7192ae37d0795d6", "1" ]],
        },
    }),
    WitnetRequestTemplateSushiswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['sushiswap/ticker'],
        ],
        tests: { 
            "VSQ/DAI-6 must work": [[ "0x5cf66ceaf7f6395642cd11b5929499229edef531", "1" ]],
        },
    }),
    WitnetRequestTemplateUbeswapTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['ubeswap/ticker'],
        ],
        tests: { 
            "IMMO/mCUSD-6 must work": [[ "0x7d63809ebf83ef54c7ce8ded3591d4e8fc2102ee", "0" ]],
        },
    }),
    WitnetRequestTemplateUniswapCeloTicker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['uniswap-celo/ticker'],
        ],
        tests: { 
            "NCT/CELO-6 must work": [[ "0xdb24905b1b080f65dedb0ad978aad5c76363d3c6", "1" ]],
        },
    }),
    WitnetRequestTemplateUniswapV3Ticker6: Witnet.PriceTickerTemplate({
        retrieve: [
            retrievals['uniswap-v3/ticker'],
        ],
        tests: { 
            "FRAX/USDT-6 must work": [[ "0xc2a856c3aff2110c1171b8f942256d40e980c726", "1" ]],
            "ULX/USDT-6 must work": [[ "0x9adf4617804c762f86fc4e706ad0424da3b100a7", "1" ]],
        },
    }),
};
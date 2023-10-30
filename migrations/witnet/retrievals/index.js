const Witnet = require("witnet-utils")
module.exports = {
    "Off-the-shelf": {
        "Cross-chain": require('./cross-chain'),
        "De-Fi": {
            "Exchanges": require('./exchanges'),
            "DEXes": require('./dexes')
        },
        "Generics": require('./generics'),
    },
}

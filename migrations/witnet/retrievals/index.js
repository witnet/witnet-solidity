const Witnet = require("witnet-utils")
module.exports = {
    "Off-the-shelf": {
        "De-Fi": {
            "Exchanges": require('./exchanges'),
            "DEXes": require('./dexes')
        },
        "Generics": require('./generics'),
        "Web3": require('./web3')
    },
}

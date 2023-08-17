const Witnet = require("witnet-utils")
module.exports = {
    "Off-the-shelf": {
        "De-Fi": {
            "Exchages": require('./exchanges'),
            "DEXes": require('./dexes')
        },
        "Generics": require('./generics'),
    }
}

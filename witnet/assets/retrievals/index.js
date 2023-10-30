const Witnet = require("witnet-utils")
module.exports = {
    "CCDR": {
        "ETH": require("./ccdr/eth"),
        "WIT": require("./ccdr/wit"),
    },
    "DeFi": {
        "APIs": require('./defi/apis'),
        "Graph-QLs": require('./defi/graphs')
    },
};
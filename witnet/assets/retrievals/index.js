module.exports = {
    "CCDR": {
        "eth": require("./ccdr/eth"),
        "wit": require("./ccdr/wit"),
    },
    "DeFi": {
        "APIs": require('./defi/apis'),
        "DEX": require('./defi/graphs')
    },
};
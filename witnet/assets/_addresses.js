const { merge } = require("lodash")

module.exports = merge(
    require("witnet-solidity/witnet/assets").addresses,
    require("../migrations/addresses.json"),
);

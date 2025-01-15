const Witnet = require("witnet-toolkit")
module.exports = {
    WitOracleRandomnessBomb: new Witnet.RadonRequest({
        retrieve: Witnet.RadonRetrieve.RNG(),
        tally: Witnet.RadonReducers.ConcatHash(Witnet.RadonFilters.Mode())
    })
}

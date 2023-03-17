const cbor = require("cbor")
const Witnet = require("witnet-requests")
module.exports = {
    "concatenate-hash-no-filters": {
        opcode: Witnet.Types.REDUCERS.concatenateAndHash,
    },
    "mode-no-filters": {
        opcode: Witnet.Types.REDUCERS.mode,
    },
    "price-aggregator": {
        opcode: Witnet.Types.REDUCERS.averageMean,
        filters: [
            {
                opcode: Witnet.Types.FILTERS.deviationStandard,
                args: cbor.encode(1.4),
            }
        ],
    },
    "price-tally": {
        opcode: Witnet.Types.REDUCERS.averageMean,
        filters: [
            {
                opcode: Witnet.Types.FILTERS.deviationStandard,
                args: cbor.encode(2.5),
            }
        ],
    },
}
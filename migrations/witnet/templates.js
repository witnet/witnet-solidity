const Witnet = require("witnet-utils")
const retrievals = new Witnet.Dictionary(Witnet.Retrievals.Class, require("../../assets/witnet/retrievals"))

module.exports = {
    dexes: {
        WitnetRequestTemplateBeamswap: Witnet.PriceTickerTemplate({
            retrieve: [
                retrievals['beamswap/ticker'],
            ],
            tests: { 
                "GLINT/USDC must work": [
                    [ "0x61b4cec9925b1397b64dece8f898047eed0f7a07", "0", ], 
                ],
            },
        }),
    },
    /////// REQUEST TEMPLATES ///////////////////////////////////////////////////////
    // path: { ... path: {
    //      WitnetRequestTemplateXXX: Witnet.RequestTemplate({
    //          specs: {
    //              retrieve: [ retrievals['retrieval-artifact-name-x'], ... ],
    //              aggregate?: Witnet.Reducers..,
    //              tally?: Witnet.Reducers..,
    //          },
    //          tests?: {
    //              "test-description-1": [
    //                  [ "..", ... ], // retrieval #0 args (string[])
    //                  ...
    //              ],
    //              ...
    //          }
    //      },
    //      ...
    // }, ... },
};

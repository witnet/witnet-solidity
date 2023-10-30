const { merge } = require("lodash")
const Witnet = require("witnet-utils")

const retrievals = new Witnet.Dictionary(Witnet.Retrievals.Class, require("./retrievals"))

module.exports = merge(require("witnet-solidity/witnet/assets").templates, {
    /////// REQUEST TEMPLATES ///////////////////////////////////////////////////////
    // path: { ... path: {
    //      WitnetRequestTemplateXXX: Witnet.RequestTemplate({
    //          retrieve: [ retrievals['retrieval-artifact-name-x'], ... ],
    //          aggregate?: Witnet.Reducers..,
    //          tally?: Witnet.Reducers..,
    //          tests?: {
    //              "test-description-1": [
    //                  [ "..", ... ], // retrieval #0 args (string[])
    //                  ...
    //              ],
    //              ...
    //          }
    //      }),
    //      ...
    // }, ... },
});  

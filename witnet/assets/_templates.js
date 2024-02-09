const Witnet = require("witnet-solidity")
const { templates } = require("witnet-solidity/assets")

const retrievals = Witnet.Dictionary(
    Witnet.Retrievals.Class, 
    require("./retrievals")
);

module.exports = { 
    ...templates, ...{
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
    },
};  

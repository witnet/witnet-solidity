const Witnet = require("witnet-solidity")
const { templates } = require("witnet-solidity/assets")

const sources = Witnet.Dictionary(
    Witnet.Retrievals.Class, 
    require("./sources")
);

module.exports = { 
    ...templates, ...{
        /////// REQUEST TEMPLATES ///////////////////////////////////////////////////////
        // path: { ... path: {
        //      WitnetRequestTemplateXXX: Witnet.RequestTemplate({
        //          retrieve: [ sources['retrieval-artifact-name-x'], ... ],
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

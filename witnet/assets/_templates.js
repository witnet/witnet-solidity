const Witnet = require("witnet-toolkit")
const { templates } = require("witnet-solidity/assets")

const sources = Witnet.Dictionary(
    Witnet.Sources.Class, 
    require("./sources")
);

module.exports = { 
    ...templates, ...{
        /////// REQUEST TEMPLATES ///////////////////////////////////////////////////////
        // path: { ... path: {
        //      WitnetRequestTemplateXXX: Witnet.RequestTemplate({
        //          retrieve: [ sources['source-name-x'], ... ],
        //          aggregate?: Witnet.Reducers..,
        //          tally?: Witnet.Reducers..,
        //          tests?: {
        //              "test-description-1": [
        //                  [ "..", ... ], // source #0 args (string[])
        //                  ...
        //              ],
        //              ...
        //          }
        //      }),
        //      ...
        // }, ... },
    },
};  

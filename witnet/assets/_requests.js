const merge = require("lodash.merge")
const Witnet = require("witnet-solidity")

const retrievals = Witnet.Dictionary(Witnet.Retrievals.Class, require("./retrievals"))
const templates = Witnet.Dictionary(Witnet.Artifacts.Template, require("./templates"))

module.exports = merge(require("witnet-solidity/assets").requests, {
    /////// STATIC REQUESTS /////////////////////////////////////////////////////////
    // path: { ... path: {
    //      WitnetRequestXXX: Witnet.StaticRequest({ 
    //          retrieve: [ Witnet.Retrievals.., ..., retrievals['retrieval-artifact-name-x'], ... ],
    //          aggregate?: Witnet.Reducers..,
    //          tally?: Witnet.Reducers..,
    //      }),
    ////// REQUESTS FROM TEMPLATE ///////////////////////////////////////////////////
    //      WitnetRequestYYY: Witnet.RequestFromTemplate(
    //          templates['template-artifact-name'], 
    //          [ [ .. ], .. ], // args: string[][]
    //      ),
    ////// REQUESTS FROM RETRIEVALS DICTIONARY //////////////////////////////////////
    //      WitnetRequestZZZ: Witnet.RequestFromDictionary({
    //          retrieve: {
    //              dict: retrievals,
    //              tags: { 
    //                  'retrieval-artifact-name-1': [ [ .. ], .. ], // args: string[][]
    //                  ...
    //              },
    //          },
    //          aggregate?: Witnet.Reducers.., // aggregate
    //          tally?: Witnet.Reducers.., // tally     
    //      }),
    // }, ... }, 
    },
);

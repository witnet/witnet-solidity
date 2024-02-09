const Witnet = require("witnet-toolkit")
const { requests } = require("witnet-solidity/assets")

const sources = Witnet.Dictionary(
    Witnet.Retrievals.Class, 
    require("./sources")
);
const templates = Witnet.Dictionary(
    Witnet.Artifacts.Template, 
    require("./templates")
);

module.exports = {
    ...requests, ...{
        /////// STATIC REQUESTS /////////////////////////////////////////////////////////
        // path: { ... path: {
        //      WitnetRequestXXX: Witnet.StaticRequest({ 
        //          retrieve: [ Witnet.Retrievals.., ..., sources['retrieval-artifact-name-x'], ... ],
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
        //              dict: sources,
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
};

const Witnet = require("witnet-utils")
const retrievals = new Witnet.Dictionary(Witnet.Retrievals.Class, require("../../assets/witnet/retrievals"))
const templates = new Witnet.Dictionary(Witnet.Artifacts.Template, require("../../assets/witnet/templates"))

module.exports = {
    WitnetRequestRandomness: Witnet.StaticRequest({
        retrieve: [ Witnet.Retrievals.RNG(), ],
        tally: Witnet.Reducers.ConcatHash(),
    }),
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
};

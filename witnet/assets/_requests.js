/* eslint-disable no-unused-vars */

const Witnet = require("witnet-toolkit")

const sources = Witnet.Dictionary(
  Witnet.Sources.Class,
  require("./sources")
)
const templates = Witnet.Dictionary(
  Witnet.Artifacts.Template,
  require("./templates")
)

module.exports = {
  /// //// STATIC REQUESTS /////////////////////////////////////////////////////////
  // path: { ... path: {
  //      WitnetRequestXXX: Witnet.StaticRequest({
  //          retrieve: [ Witnet.Sources.., ..., sources['source-name-x'], ... ],
  //          aggregate?: Witnet.Reducers..,
  //          tally?: Witnet.Reducers..,
  //      }),
  /// /// REQUESTS FROM TEMPLATE ///////////////////////////////////////////////////
  //      WitnetRequestYYY: Witnet.RequestFromTemplate(
  //          templates['WitnetRequestTemplateUniqueNameX'],
  //          [ [ .. ], .. ], // args: string[][]
  //      ),
  /// /// REQUESTS FROM RETRIEVALS DICTIONARY //////////////////////////////////////
  //      WitnetRequestZZZ: Witnet.RequestFromDictionary({
  //          retrieve: {
  //              dict: sources,
  //              tags: {
  //                  'source-name-1': [ [ .. ], .. ], // args: string[][]
  //                  ...
  //              },
  //          },
  //          aggregate?: Witnet.Reducers.., // aggregate
  //          tally?: Witnet.Reducers.., // tally
  //      }),
  // }, ... },
}

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
  //      WitOracleRequestXXX: Witnet.StaticRequest({
  //          retrieve: [ Witnet.Sources.., ..., sources['source-name-x'], ... ],
  //          aggregate?: Witnet.Reducers..,
  //          tally?: Witnet.Reducers..,
  //      }),
  /// /// REQUESTS FROM TEMPLATE ///////////////////////////////////////////////////
  //      WitOracleRequestYYY: Witnet.RequestFromTemplate(
  //          templates['WitOracleRequestTemplateUniqueNameX'],
  //          [ [ .. ], .. ], // args: string[][]
  //      ),
  /// /// REQUESTS FROM RETRIEVALS DICTIONARY //////////////////////////////////////
  //      WitOracleRequestZZZ: Witnet.RequestFromDictionary({
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

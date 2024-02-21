/* eslint-disable no-unused-vars */

const Witnet = require("witnet-toolkit")

const sources = Witnet.Dictionary(
  Witnet.Sources.Class,
  require("./sources")
)

module.exports = {
  /// //// REQUEST TEMPLATES ///////////////////////////////////////////////////////
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
}

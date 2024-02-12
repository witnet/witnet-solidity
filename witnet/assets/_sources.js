const Witnet = require("witnet-toolkit")

module.exports = {
    // path: { ... path: {
    /////// HTTP-GET RETRIEVALS /////////////////////////////////////////////////////
    //      'source-unique-resource-name-x': Witnet.Sources.HttpGet(
    //          url: "http-or-https://authority/path?query",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    /////// HTTP-POST RETRIEVALS ////////////////////////////////////////////////////
    //      'source-unique-resource-name-y': Witnet.Sources.HttpPost(
    //          url: "http-or-https://authority/path?query",
    //          body?: "...",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    /////// GRAPH-QL QUERIES ////////////////////////////////////////////////////////
    //      'source-unique-resource-name-z': Witnet.Sources.GraphQLQuery(
    //          url: "http-or-https://authority/path?query",
    //          query: "...",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    // }, ... }, 
};
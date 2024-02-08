const { retrievals } = require("witnet-solidity/assets")

module.exports = {
    ...retrievals, ...{
        // path: { ... path: {
        /////// HTTP-GET RETRIEVALS /////////////////////////////////////////////////////
        //      'retrieval-unique-resource-name-x': Witnet.Retrievals.HttpGet(
        //          url: "http-or-https://authority/path?query",
        //          headers?: {
        //              "http-header-tag": "http-header-value",
        //              ...,
        //          },
        //          script?: Witnet.Script..,
        //      }),
        /////// HTTP-POST RETRIEVALS ////////////////////////////////////////////////////
        //      'retrieval-unique-resource-name-y': Witnet.Retrievals.HttpPut(
        //          url: "http-or-https://authority/path?query",
        //          body?: "...",
        //          headers?: {
        //              "http-header-tag": "http-header-value",
        //              ...,
        //          },
        //          script?: Witnet.Script..,
        //      }),
        /////// GRAPH-QL QUERIES ////////////////////////////////////////////////////////
        //      'retrieval-unique-resource-name-z': Witnet.Retrievals.GraphQL(
        //          url: "http-or-https://authority/path?query",
        //          query: "...",
        //          headers?: {
        //              "http-header-tag": "http-header-value",
        //              ...,
        //          },
        //          script?: Witnet.Script..,
        //      }),
        // }, ... }, 
    },
};
const Witnet = require("witnet-requests");
const requestMethod = Witnet.Types.RETRIEVAL_METHODS.HttpGet;
const requestSchema = "https://"
const requestHeaders = []
module.exports = {
    "http-get-response-string": {
        requestMethod, requestSchema, requestHeaders,
        requestAuthority: "\\0\\",
        requestPath: "\\1\\",
        requestQuery: "\\2\\",
        requestScript: new Witnet.Script([ Witnet.Types.STRING ]),
    },
};
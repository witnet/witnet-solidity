const Witnet = require("witnet-requests");
const requestMethod = Witnet.Types.RETRIEVAL_METHODS.HttpPost;
const requestSchema = "https://"
const requestHeaders = []
module.exports = {
    "get-response-string": {
        requestMethod, requestSchema, requestHeaders,
        requestAuthority: "\\0\\",
        requestPath: "\\1\\",
        requestQuery: "\\2\\",
        requestBody: "\\3\\",
        requestScript: new Witnet.Script([ Witnet.Types.STRING ]),
    },
};
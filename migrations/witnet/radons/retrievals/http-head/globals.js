const Witnet = require("witnet-requests");
const requestMethod = Witnet.Types.RETRIEVAL_METHODS.HttpHead;
const requestSchema = "https://"
const requestHeaders = []
module.exports = {
    "http-post-response-header-string": {
        requestMethod, requestSchema, requestHeaders,
        requestAuthority: "\\0\\",
        requestPath: "\\1\\",
        requestQuery: "\\2\\",
        requestScript: (new Witnet.Script([ Witnet.Types.STRING ])
            .getString("\\3\\")
        ),
    },
};
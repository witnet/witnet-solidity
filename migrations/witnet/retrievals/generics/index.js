const Witnet = require("witnet-utils")
module.exports = {
    "http-get-response-string": Witnet.Retrievals.HttpGet({
        url: "\\0\\",
        script: Witnet.Script(),
    }),
    "http-post-body-response-string": Witnet.Retrievals.HttpPost({
        url: "\\0\\",
        body: "\\1\\",
        script: Witnet.Script(),
    }),
}
const Witnet = require("witnet-utils")
module.exports = {
    "https-get-response-string": Witnet.Retrievals.HttpGet({
        url: "https://\\0\\",
        script: Witnet.Script(),
    }),
    "https-post-body-response-string": Witnet.Retrievals.HttpPost({
        url: "https://\\0\\",
        body: "\\1\\",
        script: Witnet.Script(),
    }),
}
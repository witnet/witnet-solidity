const Witnet = require("witnet-requests");
module.exports = {
    "HTTP/GET": require("./http-get"),
    "HTTP/POST": require("./http-post"),
    "RNG": {
        requestMethod: Witnet.Types.RETRIEVAL_METHODS.Rng,
        requestScript: new Witnet.Script([ Witnet.TYPES.STRING ])
    }
};
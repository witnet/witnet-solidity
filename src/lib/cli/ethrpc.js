const { spawn } = require("node:child_process")
const os = require("os")

const helpers = require("../helpers")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (_settings, args, options) {
    var args = helpers.deleteExtraFlags(args)
    const network = options?.network || process.env.WITNET_SOLIDITY_DEFAULT_NETWORK
    if (!network || !assets.supportsNetwork(network)) {
        if (network) throw `Unsupported network "${network}"`
        else throw undefined;
    }
    const shell = spawn(
        os.type() === "Windows_NT" ? "npx.cmd" : "npx", [
        "ethrpc",
        network,
        options?.provider
    ],
        { shell: true, }
    )
    shell.stdout.on("data", (x) => {
        process.stdout.write(x.toString())
    })
    shell.stderr.on("data", (x) => {
        process.stderr.write(x.toString())
    })
}

const { execSync } = require("node:child_process")
const helpers = require("../helpers")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
const _assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (flags = {}, args = []) {
    const [network, _addresses] = await require("./contracts")(flags, args)
    console.info()
    // eslint-disable-next-line
    execSync(
        `npx truffle console --config ${
                flags.paths.truffleConfigFile
            } --contracts_directory ${
                flags.paths.truffleContractsPath
            } --migrations_directory ${
                flags.paths.truffleMigrationsPath
            } --network ${
                network
            }`,
        { stdio: "inherit" }
    )
}

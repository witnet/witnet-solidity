const { execSync } = require("node:child_process")
const { supportsNetwork } = require("witnet-solidity-bridge")

const helpers = require("../helpers")

// const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
// const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (flags = {}, args = []) {
    var subflags = args.filter(arg => arg.startsWith("--"))
    [ args ] = helpers.deleteExtraFlags(args)
    if (flags["dry-run"]) {   
        // eslint-disable-next-line
        execSync(
            `npx truffle test --compile-none --config ${flags.paths.truffleConfigFile
            } --contracts_directory ${flags.paths.truffleContractsPath
            } --migrations_directory ${flags.paths.truffleMigrationsPath
            } ${flags.paths.truffleTestsPath
            }/witnet.requests.spec.js ${
                flags?.legacy ? "--legacy" : ""
            } ${
                flags?.all ? "--all": ""
            } ${args.length > 0 ? `--artifacts ${args.join(" ")}` : ""
            } ${subflags.join(" ")
            }`,
            { stdio: "inherit" }
        )
    } else {
        const network = flags?.network || process.env.WITNET_SDK_SOLIDITY_NETWORK
        if (!network || !supportsNetwork(network)) {
            if (network) throw `Unsupported network "${network}"`
            else throw "No EVM network was specified!";
        }
        execSync(
            `npx truffle migrate --compile-none --config ${flags.paths.truffleConfigFile
            } --contracts_directory ${flags.paths.truffleContractsPath
            } --migrations_directory ${flags.paths.truffleMigrationsPath
            } --network ${network} ${
                flags?.legacy ? "--legacy" : ""
            } ${
                flags?.all ? "--all" : ""
            } ${args.length > 0 ? `--artifacts ${args.join(" ")}` : ""
            } ${subflags.join(" ")
            }`,
            { stdio: "inherit" }
        )
    }
}

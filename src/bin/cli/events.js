const { execSync } = require("node:child_process")

const helpers = require("../helpers")

// const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../witnet/assets"
// const assets = require(`${WITNET_ASSETS_PATH}`)

module.exports = async function (flags = {}, args = []) {
    [ args ] = helpers.deleteExtraFlags(args)
    if (flags["dry-run"]) {   
        // // eslint-disable-next-line
        // execSync(
        //     `npx truffle test --compile-none --config ${settings.paths.truffleConfigFile
        //     } --contracts_directory ${settings.paths.truffleContractsPath
        //     } --migrations_directory ${settings.paths.truffleMigrationsPath
        //     } ${settings.paths.truffleTestsPath
        //     }/witnet.requests.spec.js ${
        //         options?.legacy ? "--legacy" : ""
        //     } ${
        //         options?.all ? "--all": ""
        //     } ${args.length > 0 ? `--artifacts ${args.join(" ")}` : ""
        //     } ${subflags.join(" ")
        //     }`,
        //     { stdio: "inherit" }
        // )
    } else {
        // const network = settings?.flags?.network || process.env.WITNET_SOLIDITY_DEFAULT_NETWORK
        // if (!network || !assets.supportsNetwork(network)) {
        //     if (network) throw `Unsupported network "${network}"`
        //     else throw "No EVM network was specified!";
        // }
        // execSync(
        //     `npx truffle migrate --compile-none --config ${settings.paths.truffleConfigFile
        //     } --contracts_directory ${settings.paths.truffleContractsPath
        //     } --migrations_directory ${settings.paths.truffleMigrationsPath
        //     } --network ${network} ${
        //         options?.legacy ? "--legacy" : ""
        //     } ${
        //         options?.all ? "--all" : ""
        //     } ${args.length > 0 ? `--artifacts ${args.join(" ")}` : ""
        //     } ${subflags.join(" ")
        //     }`,
        //     { stdio: "inherit" }
        // )
    }
    throw "Not yet implemented!"
}

const merge = require("lodash.merge")
const utils = require("../../dist/utils")

const rn = utils.getRealmNetworkFromArgs()
const realm = rn[0]; const network = rn[1]

const { settings } = require("witnet-solidity-bridge")

if (!settings.networks[realm] || !settings.networks[realm][network]) {
  if (network !== "develop" && network !== "test" && network !== "development") {
    console.error(
      `Fatal: chain "${realm}:${network}"`,
      "not currently supported by Witnet."
    )
    process.exit(1)
  }
}

if (realm !== "default") console.info(`
Targetting "${realm.toUpperCase()}" ecosystem
=======================${"=".repeat(realm.length)}
`);

module.exports = {
  build_directory: "./node_modules/witnet-solidity-bridge/build",
  networks: merge(
    settings.networks[realm], {
      default: {
        "ethereum.mainnet": {
          confirmations: 2,
        },
      },
      polygon: {
        "polygon.goerli": {
          confirmations: 2,
        },
      },
    }
  ),
  compilers: merge(
    settings.compilers.default,
    settings.compilers[realm], {
      solc: {
        version: "0.8.22",
      }
    }
  ),
  mocha: {
    timeout: 100000,
    useColors: true,
  },
}

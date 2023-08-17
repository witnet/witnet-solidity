const { merge } = require("lodash")
const settings = require("witnet-solidity-bridge/migrations/witnet.settings")
const Witnet = require("witnet-utils")
const rn = Witnet.Utils.getRealmNetworkFromArgs()
const realm = rn[0]; const network = rn[1]
if (!settings.networks[realm] || !settings.networks[realm][network]) {
  if (network !== "develop" && network !== "test" && network !== "development") {
    console.error(
      `Fatal: chain "${realm}:${network}"`,
      "not currently supported by Witnet."
    )
    process.exit(1)
  }
}
console.info(`
Targetting "${realm.toUpperCase()}" ecosystem
=======================${"=".repeat(realm.length)}`)
module.exports = {
  build_directory: `./build/`,
  contracts_directory: "./contracts/",
  migrations_directory: "./migrations/truffle/",
  networks: merge(
    settings.networks[realm], {
      default: {
        "ethereum.mainnet": {
          skipDryRun: true,
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
    }
  ),
  mocha: {
    timeout: 100000,
    useColors: true,
  },
}

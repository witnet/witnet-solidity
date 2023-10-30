const { merge } = require("lodash")
const Witnet = require("witnet-utils")

const rn = Witnet.Utils.getRealmNetworkFromArgs()
const realm = rn[0]; const network = rn[1]

const settings = require("witnet-solidity-bridge/migrations/witnet.settings")
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
  build_directory: `./witnet/migrations/build/${realm}`,
  contracts_directory: "./witnet/migrations/contracts/",
  migrations_directory: "./witnet/migrations/scripts/",
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
    }
  ),
  mocha: {
    timeout: 100000,
    useColors: true,
  },
}

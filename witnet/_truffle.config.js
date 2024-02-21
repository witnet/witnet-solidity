const { settings, utils } = require("witnet-solidity-bridge")
const [ecosystem, target] = utils.getRealmNetworkFromArgs()
if (ecosystem) {
  const header = `${target.toUpperCase()}`
  console.info(header)
  console.info("=".repeat(header.length))
}

module.exports = {
  build_directory: "./node_modules/witnet-solidity-bridge/build",
  networks: settings.getNetworks(),
  compilers: { solc: settings.getCompilers() },
  mocha: {
    timeout: 100000,
    useColors: true,
  },
}

const { settings } = require("witnet-solidity-bridge")

module.exports = {
  build_directory: "./node_modules/witnet-solidity-bridge/build",
  networks: settings.getNetworks(),
  compilers: { solc: settings.getCompilers(), },
  mocha: {
    timeout: 100000,
    useColors: true,
  },
}

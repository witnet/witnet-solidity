require("@nomicfoundation/hardhat-ethers");

const { settings, utils } = require("witnet-solidity-bridge")
const [, target ] = utils.getRealmNetworkFromString();

module.exports = {
  networks: Object.fromEntries(Object.entries(
      settings.getNetworks()
    ).map(([network, config]) => {
      return [network, {
        chainId: config.network_id,
        url: `http://${config?.host || "localhost"}:${config?.port || 8545}`
      }]
    })
  ),
  solidity: settings.getCompilers(target),
};

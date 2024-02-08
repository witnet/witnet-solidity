require("@nomicfoundation/hardhat-ethers");

const { settings, utils } = require("witnet-solidity-bridge")
const [ ecosystem, target ] = utils.getRealmNetworkFromString();
if (ecosystem) {
  const header = `${target.toUpperCase()}`
  console.info()
  console.info(header)
  console.info("=".repeat(header.length))
}

task("deploy", "Deploys new Witnet artifacts")
  .addOptionalVariadicPositionalParam("artifacts")
  .setAction(async (taskArgs, hre) => {
      const deploy = require("./scripts/hardhat/deploy");
      await deploy.run(taskArgs).catch((error) => {
        console.error(error);
        process.exitCode = 1;
      })
  })

module.exports = {
  paths: {
    tests: "./tests/hardhat"
  },
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

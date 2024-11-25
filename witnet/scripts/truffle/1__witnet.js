const assets_relative_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
  ? `${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
)

const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const assets = require(`${assets_relative_path}/assets`)
const fs = require("fs")
const utils = require("../utils")

const WitOracle = artifacts.require("WitOracle")
const WitOracleRadonRegistry = artifacts.require("WitOracleRadonRegistry")
const WitOracleRequestFactory = artifacts.require("WitOracleRequestFactory")

module.exports = async function (deployer, network) {
  const addresses = assets.getAddresses(network)
  const isDryRun = utils.isDryRun(network)

  if (!isDryRun) {
    try {
      WitOracle.address = addresses.WitOracle
      const wrb = await WitOracle.deployed()
      WitOracleRadonRegistry.address = await wrb.registry.call()
      // WitOracleRequestFactory.address = await wrb.factory.call()
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!", e)
      process.exit(1)
    }
  } else {
    const WitOracleRadonEncodingLib = artifacts.require("WitOracleRadonEncodingLib")
    await deployer.deploy(WitOracleRadonEncodingLib)

    const WitOracleResultStatusLib = artifacts.require("WitOracleResultStatusLib")
    await deployer.deploy(WitOracleResultStatusLib)

    const WitOracleDataLib = artifacts.require("WitOracleDataLib")
    await deployer.deploy(WitOracleDataLib)

    const WitMockedRadonRegistry = artifacts.require("WitMockedRadonRegistry")
    await deployer.link(WitOracleRadonEncodingLib, WitMockedRadonRegistry)
    await deployer.deploy(WitMockedRadonRegistry)
    WitOracleRadonRegistry.address = WitMockedRadonRegistry.address

    const WitMockedOracle = artifacts.require("WitMockedOracle")
    await deployer.link(WitOracleResultStatusLib, WitMockedOracle)
    await deployer.link(WitOracleDataLib, WitMockedOracle)
    await deployer.deploy(WitMockedOracle, WitOracleRadonRegistry.address)
    WitOracle.address = WitMockedOracle.address

    const WitMockedRequestFactory = artifacts.require("WitMockedRequestFactory")
    await deployer.deploy(WitMockedRequestFactory, WitOracle.address)
    WitOracleRequestFactory.address = WitMockedRequestFactory.address

    addresses[network] = {
      WitOracle: WitOracle.address,
      WitOracleRadonRegistry: WitOracleRadonRegistry.address,
      WitOracleRequestFactory: WitOracleRequestFactory.address,
    }

    // create test addresses file if none exists yet:
    if (!fs.existsSync(`${witnet_module_path}/tests/truffle/addresses.json`)) {
      fs.writeFileSync(`${witnet_module_path}/tests/truffle/addresses.json`, "{}")
    }
    utils.saveAddresses(`${witnet_module_path}/tests/truffle`, addresses)
  }

  utils.traceHeader("Witnet Artifacts:")
  if (WitOracle.address) {
    console.info("  ", "> WitOracle:          ",
      WitOracle.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitOracle)})`
    )
  }
  if (WitOracleRadonRegistry.address) {
    console.info("  ", "> WitOracleRadonRegistry:",
      WitOracleRadonRegistry.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitOracleRadonRegistry)})`
    )
  }
  if (WitOracleRequestFactory.address) {
    console.info("  ", "> WitOracleRequestFactory:  ",
      WitOracleRequestFactory.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitOracleRequestFactory)})`
    )
  }
}

async function _readUpgradableArtifactVersion (artifact) {
  const WitnetUpgradableBase = artifacts.require("WitnetUpgradableBase")
  try {
    const upgradable = await WitnetUpgradableBase.at(artifact.address)
    if (await upgradable.isUpgradable() === true) {
      return await upgradable.version()
    } else {
      return "non-upgradable"
    }
  } catch {
    return "non-upgradable"
  }
}

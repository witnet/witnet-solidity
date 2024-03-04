const assets_relative_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
  ? `${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
)

const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const assets = require(`${assets_relative_path}/assets`)
const fs = require("fs")
const utils = require("../utils")

const WitnetRequestBytecodes = artifacts.require("WitnetRequestBytecodes")
const WitnetOracle = artifacts.require("WitnetOracle")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")

module.exports = async function (deployer, network) {
  const addresses = assets.getAddresses(network)
  const isDryRun = utils.isDryRun(network)

  if (!isDryRun) {
    try {
      WitnetOracle.address = addresses.WitnetOracle
      const wrb = await WitnetOracle.deployed()
      WitnetRequestBytecodes.address = await wrb.registry.call()
      WitnetRequestFactory.address = await wrb.factory.call()
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!", e)
      process.exit(1)
    }
  } else {
    const WitnetEncodingLib = artifacts.require("WitnetEncodingLib")
    await deployer.deploy(WitnetEncodingLib)

    const WitnetErrorsLib = artifacts.require("WitnetErrorsLib")
    await deployer.deploy(WitnetErrorsLib)

    const WitnetOracleDataLib = artifacts.require("WitnetOracleDataLib")
    await deployer.deploy(WitnetOracleDataLib)

    const WitnetMockedRequestBytecodes = artifacts.require("WitnetMockedRequestBytecodes")
    await deployer.link(WitnetEncodingLib, WitnetMockedRequestBytecodes)
    await deployer.deploy(WitnetMockedRequestBytecodes)
    WitnetRequestBytecodes.address = WitnetMockedRequestBytecodes.address

    const WitnetMockedOracle = artifacts.require("WitnetMockedOracle")
    await deployer.link(WitnetErrorsLib, WitnetMockedOracle)  
    await deployer.link(WitnetOracleDataLib, WitnetMockedOracle)  
    await deployer.deploy(WitnetMockedOracle, WitnetRequestBytecodes.address)
    WitnetOracle.address = WitnetMockedOracle.address

    const WitnetMockedRequestFactory = artifacts.require("WitnetMockedRequestFactory")
    await deployer.deploy(WitnetMockedRequestFactory, WitnetOracle.address)
    WitnetRequestFactory.address = WitnetMockedRequestFactory.address
    await (await WitnetMockedOracle.deployed()).setFactory(WitnetRequestFactory.address)

    addresses[network] = {
      WitnetRequestBytecodes: WitnetRequestBytecodes.address,
      WitnetOracle: WitnetOracle.address,
      WitnetRequestFactory: WitnetRequestFactory.address,
    }

    // create test addresses file if none exists yet:
    if (!fs.existsSync(`${witnet_module_path}/tests/truffle/addresses.json`)) {
      fs.writeFileSync(`${witnet_module_path}/tests/truffle/addresses.json`, "{}")
    }
    utils.saveAddresses(`${witnet_module_path}/tests/truffle`, addresses)
  }

  utils.traceHeader("Witnet Artifacts:")
  if (WitnetOracle.address) {
    console.info("  ", "> WitnetOracle:          ",
      WitnetOracle.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetOracle)})`
    )
  }
  if (WitnetRequestBytecodes.address) {
    console.info("  ", "> WitnetRequestBytecodes:",
      WitnetRequestBytecodes.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetRequestBytecodes)})`
    )
  }
  if (WitnetRequestFactory.address) {
    console.info("  ", "> WitnetRequestFactory:  ",
      WitnetRequestFactory.address,
      `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetRequestFactory)})`
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

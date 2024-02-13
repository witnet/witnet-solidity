const assets_relative_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH 
  ? `${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
);

const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet";

const assets = require(`${assets_relative_path}/assets`);
const utils = require("../utils");

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")

module.exports = async function (deployer, network) {
  const addresses = assets.getAddresses(network)
  const isDryRun = utils.isDryRun(network)

  if (!isDryRun) {
    try {
      WitnetRequestBoard.address = addresses.WitnetRequestBoard
      const wrb = await WitnetRequestBoard.deployed()
      WitnetBytecodes.address = await wrb.registry.call()
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

    const WitnetMockedBytecodes = artifacts.require("WitnetMockedBytecodes");
    await deployer.link(WitnetEncodingLib, WitnetMockedBytecodes);
    await deployer.deploy(WitnetMockedBytecodes);
    WitnetBytecodes.address = WitnetMockedBytecodes.address;

    const WitnetMockedRequestBoard = artifacts.require("WitnetMockedRequestBoard");
    await deployer.link(WitnetErrorsLib, WitnetMockedRequestBoard);
    await deployer.deploy(WitnetMockedRequestBoard, WitnetBytecodes.address);
    WitnetRequestBoard.address = WitnetMockedRequestBoard.address;

    const WitnetMockedRequestFactory = artifacts.require("WitnetMockedRequestFactory");
    await deployer.deploy(WitnetMockedRequestFactory, WitnetRequestBoard.address);
    WitnetRequestFactory.address = WitnetMockedRequestFactory.address;
    await (await WitnetMockedRequestBoard.deployed()).setFactory(WitnetRequestFactory.address);

    addresses[network] = {
      WitnetBytecodes: WitnetBytecodes.address,
      WitnetRequestBoard: WitnetRequestBoard.address,
      WitnetRequestFactory: WitnetRequestFactory.address,
    }

    utils.saveAddresses(`${witnet_module_path}/tests/truffle`, addresses);
  }
  
  utils.traceHeader("Witnet Artifacts:"); {
    if (WitnetBytecodes.address) {
      console.info("  ", "> WitnetBytecodes:      ", 
        WitnetBytecodes.address, 
        `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetBytecodes)})`
      )
    }
    if (WitnetRequestBoard.address) {
      console.info("  ", "> WitnetRequestBoard:   ", 
        WitnetRequestBoard.address, 
        `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetRequestBoard)})`
      )
    }
    if (WitnetRequestFactory.address) {
      console.info("  ", "> WitnetRequestFactory: ", 
        WitnetRequestFactory.address, 
        `(${isDryRun ? "mocked" : await _readUpgradableArtifactVersion(WitnetRequestFactory)})`
      )
    }
  }
}

async function _readUpgradableArtifactVersion(artifact) {
  const WitnetUpgradableBase = artifacts.require("WitnetUpgradableBase");
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

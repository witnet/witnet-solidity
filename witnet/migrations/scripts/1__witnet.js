const utils = require("../../../dist/utils")

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetPriceFeeds = artifacts.require("WitnetPriceFeeds")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")

module.exports = async function (deployer, network) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  let addresses = require(process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
      ? `../${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}/assets`
      : "../../../../../witnet/assets"
  ).addresses

  if (!isDryRun) {
    try {
      const witnetAddresses = addresses[ecosystem][network]
      WitnetBytecodes.address = witnetAddresses?.WitnetBytecodes
      WitnetPriceFeeds.address = witnetAddresses?.WitnetPriceFeeds
      WitnetRequestBoard.address = witnetAddresses?.WitnetRequestBoard
      WitnetRequestFactory.address = witnetAddresses?.WitnetRequestFactory
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!", e)
      process.exit(1)
    }
  
  } else {
    const WitnetEncodingLib = artifacts.require("WitnetEncodingLib")
    await deployer.deploy(WitnetEncodingLib)

    const WitnetErrorsLib = artifacts.require("WitnetErrorsLib")
    await deployer.deploy(WitnetErrorsLib)
    
    const WitnetPriceFeedsLib = artifacts.require("WitnetPriceFeedsLib")
    await deployer.deploy(WitnetPriceFeedsLib)

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

    const WitnetMockedPriceFeeds = artifacts.require("WitnetMockedPriceFeeds");
    await deployer.link(WitnetPriceFeedsLib, WitnetMockedPriceFeeds);
    await deployer.deploy(WitnetMockedPriceFeeds, WitnetRequestBoard.address);
    WitnetPriceFeeds.address = WitnetMockedPriceFeeds.address;

    addresses = {}
    addresses[ecosystem] = {}
    addresses[ecosystem][network] = {}
    utils.saveAddresses(addresses, `${process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"}/tests`)
  }
  
  utils.traceHeader("Witnet Artifacts:"); {
    if (WitnetBytecodes.address) {
      console.info("  ", "> WitnetBytecodes:      ", 
        WitnetBytecodes.address, 
        `(${await _readUpgradableArtifactVersion(WitnetBytecodes)})`
      )
    }
    if (WitnetRequestBoard.address) {
      console.info("  ", "> WitnetRequestBoard:   ", 
        WitnetRequestBoard.address, 
        `(${await _readUpgradableArtifactVersion(WitnetRequestBoard)})`
      )
    }
    if (WitnetRequestFactory.address) {
      console.info("  ", "> WitnetRequestFactory: ", 
        WitnetRequestFactory.address, 
        `(${await _readUpgradableArtifactVersion(WitnetRequestFactory)})`
      )
    }
    if (WitnetPriceFeeds.address) {
      console.info("  ", "> WitnetPriceFeeds:     ", 
        WitnetPriceFeeds.address, 
        isDryRun ? "(mocked)" : ""
      )
    }
  }
}

async function _readUpgradableArtifactVersion(artifact) {
  const WitnetUpgradableBase = artifacts.require("WitnetUpgradableBase");
  try {
    const upgradable = await WitnetUpgradableBase.at(artifact.address)
    return await upgradable.version()
  } catch {
    return "???"
  }
}

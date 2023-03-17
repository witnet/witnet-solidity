const utils = require("../../assets/witnet/utils/js")
const witnet = require("../../assets/witnet")

const WitnetEncodingLib = artifacts.require("WitnetEncodingLib")
const WitnetErrorsLib = artifacts.require("WitnetErrorsLib")

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetPriceFeeds = artifacts.require("WitnetPriceFeeds")
const WitnetRandomness = artifacts.require("WitnetRandomness")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")

const WitnetBytecodesDefault = artifacts.require("WitnetBytecodesDefault")
const WitnetPriceFeedsLib = artifacts.require("WitnetPriceFeedsLib")
const WitnetPriceFeedsUpgradable = artifacts.require("WitnetPriceFeedsUpgradable")
const WitnetRandomnessProxiable = artifacts.require("WitnetRandomnessProxiable")
const WitnetRequestBoardDefault = artifacts.require("WitnetRequestBoardTrustableDefault")
const WitnetRequestFactoryDefault = artifacts.require("WitnetRequestFactoryDefault")

const WitnetUpgradableBase = artifacts.require("WitnetUpgradableBase")

module.exports = async function (deployer, network, [, from]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  let witnetAddresses
  if (!isDryRun) {
    try {
      witnetAddresses = witnet.addresses[ecosystem][network]
      WitnetBytecodes.address = witnetAddresses?.WitnetBytecodes
      WitnetPriceFeeds.address = witnetAddresses?.WitnetPriceFeeds
      WitnetRandomness.address = witnetAddresses?.WitnetRandomness
      WitnetRequestBoard.address = witnetAddresses?.WitnetRequestBoard
      WitnetRequestFactory.address = witnetAddresses?.WitnetRequestFactory
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!", e)
      process.exit(1)
    }
  } else {
    await deployer.deploy(WitnetEncodingLib, { from })
    await deployer.link(WitnetEncodingLib, WitnetBytecodesDefault)
    await deployer.deploy(WitnetErrorsLib, { from })
    await deployer.link(WitnetErrorsLib, WitnetRequestBoardDefault)    
    await deployer.deploy(WitnetPriceFeedsLib, { from })
    await deployer.link(WitnetPriceFeedsLib, WitnetPriceFeedsUpgradable)
    await deployer.deploy(
      WitnetBytecodesDefault,
      false,
      utils.fromAscii(network),
      { from, gas: 6721975 }
    )
    WitnetBytecodes.address = WitnetBytecodesDefault.address    
    await deployer.deploy(
      WitnetRequestFactoryDefault,
      WitnetBytecodes.address,
      false,
      utils.fromAscii(network),
      { from, gas: 6721975 }
    )
    WitnetRequestFactory.address = WitnetRequestFactoryDefault.address    
    await deployer.deploy(
      WitnetRequestBoardDefault,
      WitnetRequestFactory.address,
      false,
      utils.fromAscii(network),
      135000,
      { from, gas: 6721975 }
    )
    WitnetRequestBoard.address = WitnetRequestBoardDefault.address    
    await deployer.deploy(
      WitnetPriceFeedsUpgradable,
      WitnetRequestBoard.address,
      false,
      utils.fromAscii(network),
      { from, gas: 6721975 }
    )
    WitnetPriceFeeds.address = WitnetPriceFeedsUpgradable.address    
    await deployer.deploy(
      WitnetRandomnessProxiable,
      WitnetRequestBoard.address,
      utils.fromAscii(network),
      { from, gas: 6721975 }
    )
    WitnetRandomness.address = WitnetRandomnessProxiable.address    
    const addresses = require("../witnet/addresses")
    if (addresses[ecosystem] && addresses[ecosystem][network]) {
      delete addresses[ecosystem][network]
      utils.saveAddresses(addresses)
    }
  }
  utils.traceHeader("Witnet artifacts:")
  if (WitnetBytecodes.address) {
    console.info("  ", "> WitnetBytecodes:      ", WitnetBytecodes.address, `(v${await readUpgradableArtifactVersion(WitnetBytecodes)})`)
  }
  if (WitnetPriceFeeds.address) {
    console.info("  ", "> WitnetPriceFeeds:     ", WitnetPriceFeeds.address, `(v${await readUpgradableArtifactVersion(WitnetPriceFeeds)})`)
  }
  if (WitnetRandomness.address) {
    console.info("  ", "> WitnetRandomness:     ", WitnetRandomness.address, `(v${await readUpgradableArtifactVersion(WitnetRandomness)})`)
  }
  if (WitnetRequestBoard.address) {
    console.info("  ", "> WitnetRequestBoard:   ", WitnetRequestBoard.address, `(v${await readUpgradableArtifactVersion(WitnetRequestBoard)})`)
  }
  if (WitnetRequestFactory.address) {
    console.info("  ", "> WitnetRequestFactory: ", WitnetRequestFactory.address, `(v${await readUpgradableArtifactVersion(WitnetRequestFactory)})`)
  }
}

async function readUpgradableArtifactVersion(artifact) {
  try {
    const upgradable = await WitnetUpgradableBase.at(artifact.address)
    return await upgradable.version()
  } catch {
    return "???"
  }
}

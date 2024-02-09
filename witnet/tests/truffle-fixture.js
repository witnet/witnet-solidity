const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetPriceFeeds = artifacts.require("WitnetPriceFeeds")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")

const WitnetEncodingLib = artifacts.require("WitnetEncodingLib")
const WitnetErrorsLib = artifacts.require("WitnetErrorsLib")
const WitnetPriceFeedsLib = artifacts.require("WitnetPriceFeedsLib")

const WitnetMockedBytecodes = artifacts.require("WitnetMockedBytecodes");
const WitnetMockedRequestBoard = artifacts.require("WitnetMockedRequestBoard");
const WitnetMockedRequestFactory = artifacts.require("WitnetMockedRequestFactory");
const WitnetMockedPriceFeeds = artifacts.require("WitnetMockedPriceFeeds");

const WitnetUpgradableBase = artifacts.require("WitnetUpgradableBase");

const assets = require("../assets")
const utils = require("../../dist/utils")

console.log("FUCK YEAH")

module.exports = async function () {
    
    const [, network] = utils.getRealmNetworkFromArgs()
    const addresses = assets.getAddresses(network)
    const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"

    console.log(assets, network)
    
    //   let addresses = require(process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
    //       ? `../${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}/assets`
    //       : "../../../../witnet/assets"
    //   ).addresses

    if (!isDryRun) {
        try {
            WitnetBytecodes.address = addresses?.WitnetBytecodes
            WitnetPriceFeeds.address = addresses?.WitnetPriceFeeds
            WitnetRequestBoard.address = addresses?.WitnetRequestBoard
            WitnetRequestFactory.address = addresses?.WitnetRequestFactory
        } catch (e) {
            console.error("Fatal: Witnet Foundation addresses were not provided!", e)
            process.exit(1)
        }

    } else {
        WitnetEncodingLib.setAsDeployed(await WitnetEncodingLib.new());        
        await WitnetEncodingLib.link(WitnetMockedBytecodes)
        WitnetBytecodes.setAsDeployed(await WitnetMockedBytecodes.new());

        
        WitnetErrorsLib.setAsDeployed(await WitnetErrorsLib.new());
        await WitnetErrorsLib.link(WitnetMockedRequestBoard)
        WitnetRequestBoard.setAsDeployed(await WitnetMockedRequestBoard.new(
            WitnetBytecodes.address
        ));
        
        WitnetRequestFactory.setAsDeployed(await WitnetMockedRequestFactory.new(
            WitnetRequestBoard.address
        ));
        await (await WitnetMockedRequestBoard.deployed()).setFactory(
            WitnetRequestFactory.address
        );

        WitnetPriceFeedsLib.setAsDeployed(await WitnetPriceFeedsLib.new());
        await WitnetPriceFeedsLib.link(WitnetMockedPriceFeeds)
        WitnetPriceFeeds.setAsDeployed(await WitnetMockedPriceFeeds.new(
            WitnetRequestBoard.address
        ));
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
    try {
        const upgradable = await WitnetUpgradableBase.at(artifact.address)
        return await upgradable.version()
    } catch {
        return "???"
    }
}

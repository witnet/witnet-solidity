const Witnet = require("witnet-utils")
const addresses = require("../witnet/addresses")
const selection = Witnet.Utils.getWitnetArtifactsFromArgs()
const requests = selection?.length > 0 ? require("../../assets/witnet/requests") : require("../witnet/requests")

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from, ]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = Witnet.Utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  if (!addresses[ecosystem]) addresses[ecosystem] = {}
  if (!addresses[ecosystem][network]) addresses[ecosystem][network] = {}
  if (!addresses[ecosystem][network].requests) addresses[ecosystem][network].requests = {}
  if (!addresses[ecosystem][network].templates) addresses[ecosystem][network].templates = {}

  await deployWitnetRequests(from, isDryRun, ecosystem, network, requests)
}

async function deployWitnetRequests (from, isDryRun, ecosystem, network, requests) {
  for (const key in requests) {
    const request = requests[key]
    if (request?.specs) {
      const targetAddr = addresses[ecosystem][network].requests[key] ?? null
      if (
        (selection.length == 0 && isDryRun)
          || selection.includes(key)
          || targetAddr === "" 
          || (!Witnet.Utils.isNullAddress(targetAddr) && (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const requestAddress = await Witnet.Utils.deployWitnetRequest(
            web3,
            from, 
            await WitnetBytecodes.deployed(), 
            await WitnetRequestFactory.deployed(),
            request,
            WitnetRequestTemplate,
            key
          )
          console.info("  ", `> Request address:   \x1b[1;37m${requestAddress}\x1b[0m`)
          addresses[ecosystem][network].requests[key] = requestAddress
          Witnet.Utils.saveAddresses(addresses)
        } catch (e) {
          Witnet.Utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      } else if (!Witnet.Utils.isNullAddress(targetAddr)) {
        Witnet.Utils.traceHeader(`Skipping '\x1b[1;37m${key}\x1b[0m'`)
        console.info("  ", `> Request address:   \x1b[1;37m${targetAddr}\x1b[0m`)
      }
    } else {
      await deployWitnetRequests(from, isDryRun, ecosystem, network, request)
    }
  }
}

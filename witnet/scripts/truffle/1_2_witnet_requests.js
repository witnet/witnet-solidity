const witnet_require_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH 
  ? `../${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
);
const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet";

const requests = (process.argv.includes("--all") 
  ? require(`${witnet_require_path}/assets`).requests 
  : require(`${witnet_require_path}/assets/requests`)
);
const utils = require("../utils")
const selection = utils.getWitnetArtifactsFromArgs()

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from, ]) {
  const isDryRun = utils.isDryRun(network)
  
  let addresses = (isDryRun ? require(`../../tests/truffle/addresses`) : require(`${witnet_require_path}/addresses`))[network]
  if (!addresses.requests) addresses.requests = {}
  addresses = await deployWitnetRequests(addresses, from, isDryRun, requests)
  addresses.requests = utils.orderObjectKeys(addresses.requests);
  addresses = utils.orderObjectKeys(addresses);
  utils.saveAddresses(
    isDryRun ? `${witnet_module_path}/tests/truffle` : `${witnet_require_path}`,
    addresses, network
  )
}

async function deployWitnetRequests (addresses, from, isDryRun, requests) {
  for (const key in requests) {
    const request = requests[key]
    if (request?.specs) {
      const targetAddr = addresses.requests[key] ?? null
      if (
        (selection.includes(key) || selection.length == 0)
          && (utils.isNullAddress(targetAddr) || (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const requestAddress = await utils.deployWitnetRequest(
            web3, from, 
            await WitnetBytecodes.deployed(), 
            await WitnetRequestFactory.deployed(),
            request, WitnetRequestTemplate, key
          )
          console.info("  ", `> Request address:   \x1b[1;37m${requestAddress}\x1b[0m`)
          addresses.requests[key] = requestAddress

        } catch (e) {
          utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      } else if (!utils.isNullAddress(targetAddr)) {
        utils.traceHeader(`Skipping '\x1b[1;37m${key}\x1b[0m'`)
        console.info("  ", `> Request address:   \x1b[1;37m${targetAddr}\x1b[0m`)
      }
    } else {
      addresses = await deployWitnetRequests(addresses, from, isDryRun, request)
    }
  }
  return addresses
}

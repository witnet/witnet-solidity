const assets_relative_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
  ? `${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
)

const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const requests = (process.argv.includes("--all")
  ? require(`${assets_relative_path}/assets`).requests
  : require(`${assets_relative_path}/assets/requests`)
)
const utils = require("../utils")
const selection = utils.getWitnetArtifactsFromArgs()

const WitnetRequestBytecodes = artifacts.require("WitnetRequestBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from]) {
  const isDryRun = utils.isDryRun(network)

  const addresses = utils.loadAddresses(isDryRun ? `${witnet_module_path}/tests/truffle` : "./witnet")
  if (!addresses[network]) addresses[network] = {}
  if (!addresses[network].requests) addresses[network].requests = {}

  addresses[network] = await deployWitnetRequests(addresses[network], from, isDryRun, requests)

  if (Object.keys(addresses[network].requests).length > 0) {
    addresses[network].requests = utils.orderObjectKeys(addresses[network].requests)
    addresses[network] = utils.orderObjectKeys(addresses[network])
    utils.saveAddresses(
      isDryRun ? `${witnet_module_path}/tests/truffle` : "./witnet",
      addresses
    )
  }
}

async function deployWitnetRequests (addresses, from, isDryRun, requests) {
  for (const key in requests) {
    const request = requests[key]
    if (request?.specs) {
      const targetAddr = addresses.requests[key] ?? null
      if (
        (process.argv.includes("--all") ||
          selection.includes(key) ||
          (selection.length === 0 && isDryRun)
        ) && (
          utils.isNullAddress(targetAddr) ||
          (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const requestAddress = await utils.deployWitnetRequest(
            web3, from,
            await WitnetRequestBytecodes.deployed(),
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

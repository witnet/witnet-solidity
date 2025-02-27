const Witnet = require("witnet-toolkit")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../../witnet/assets"
const MODULE_WITNET_PATH = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const requests = (process.argv.includes("--legacy")
  ? require(`${WITNET_ASSETS_PATH}`).legacy.requests
  : require(`${WITNET_ASSETS_PATH}/requests`)
)
const utils = require("../utils")
const selection = utils.getWitnetArtifactsFromArgs()

const WitOracleRadonRegistry = artifacts.require("WitOracleRadonRegistry")
const WitOracleRequestFactory = artifacts.require("WitOracleRequestFactory")
const WitOracleRequestTemplate = artifacts.require("WitOracleRequestTemplate")

module.exports = async function (_deployer, network, [from]) {
  const isDryRun = utils.isDryRun(network)

  const addresses = utils.loadAddresses(isDryRun ? `${MODULE_WITNET_PATH}/tests/truffle` : "./witnet")
  if (!addresses[network]) addresses[network] = {}
  if (!addresses[network].requests) addresses[network].requests = {}

  addresses[network] = await deployWitOracleRequests(
    addresses[network],
    utils.getFromFromArgs() || from,
    isDryRun,
    requests
  )

  if (Object.keys(addresses[network].requests).length > 0) {
    addresses[network].requests = utils.orderObjectKeys(addresses[network].requests)
    addresses[network] = utils.orderObjectKeys(addresses[network])
    utils.saveAddresses(
      isDryRun ? `${MODULE_WITNET_PATH}/tests/truffle` : "./witnet",
      addresses
    )
  }
}

async function deployWitOracleRequests (addresses, from, isDryRun, requests) {
  for (const key in requests) {
    const request = requests[key]
    if (request instanceof Witnet.RadonRequest) {
      if (
        process.argv.includes("--all") 
        || selection.find(artifact => key.toLowerCase().indexOf(artifact.toLowerCase()) >= 0)
        || (selection.length === 0 && isDryRun)
      ) {
        try {
          const requestAddress = await utils.deployWitOracleRequest(
            web3, from,
            await WitOracleRadonRegistry.deployed(),
            await WitOracleRequestFactory.deployed(),
            request, WitOracleRequestTemplate, key
          )
          console.info("  ", `> Request address:   \x1b[1;37m${requestAddress}\x1b[0m`)
          addresses.requests[key] = requestAddress
        } catch (e) {
          utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      }
    } else {
      addresses = await deployWitOracleRequests(addresses, from, isDryRun, request)
    }
  }
  return addresses
}

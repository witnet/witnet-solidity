const Witnet = require("witnet-toolkit")

const WITNET_ASSETS_PATH = process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || "../../../../../../witnet/assets"
const MODULE_WITNET_PATH = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const templates = (process.argv.includes("--legacy")
  ? require(`${WITNET_ASSETS_PATH}`).legacy.templates
  : require(`${WITNET_ASSETS_PATH}/templates`)
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
  if (!addresses[network].templates) addresses[network].templates = {}

  addresses[network] = await deployWitOracleRequestTemplates(
    addresses[network],
    utils.getFromFromArgs() || from,
    isDryRun,
    templates
  )
  if (Object.keys(addresses[network].templates).length > 0) {
    addresses[network].templates = utils.orderObjectKeys(addresses[network].templates)
    utils.saveAddresses(
      isDryRun ? `${MODULE_WITNET_PATH}/tests/truffle` : "./witnet",
      addresses
    )
  }
}

async function deployWitOracleRequestTemplates (addresses, from, isDryRun, templates) {
  for (const key in templates) {
    const template = templates[key]
    if (template?.specs) {
      if (
        process.argv.includes("--all") 
        || selection.find(artifact => key.toLowerCase().indexOf(artifact.toLowerCase()) >= 0)
        || (selection.length === 0 && isDryRun)
      ) {
        try {
          const templateAddr = await utils.deployWitOracleRequestTemplate(
            web3, from,
            await WitOracleRadonRegistry.deployed(),
            await WitOracleRequestFactory.deployed(),
            template, key,
          )
          const templateContract = await WitOracleRequestTemplate.at(templateAddr)
          console.info("  ", `> Template address:  \x1b[1;37m${templateContract.address}\x1b[0m`)
          console.info("  ", "> Template class:   ", await templateContract.class.call())
          console.info("  ", "> Template version: ", await templateContract.version.call())
          addresses.templates[key] = templateAddr
        } catch (e) {
          utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      }
    } else {
      addresses = await deployWitOracleRequestTemplates(addresses, from, isDryRun, template)
    }
  }
  return addresses
}

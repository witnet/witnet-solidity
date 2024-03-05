const assets_relative_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
  ? `${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
)

const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet"

const templates = (process.argv.includes("--legacy")
  ? require(`${assets_relative_path}/assets`).templates
  : require(`${assets_relative_path}/assets/templates`)
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
  if (!addresses[network].templates) addresses[network].templates = {}

  addresses[network] = await deployWitnetRequestTemplates(addresses[network], from, isDryRun, templates)
  if (Object.keys(addresses[network].templates).length > 0) {
    addresses[network].templates = utils.orderObjectKeys(addresses[network].templates)
    utils.saveAddresses(
      isDryRun ? `${witnet_module_path}/tests/truffle` : "./witnet",
      addresses
    )
  }
}

async function deployWitnetRequestTemplates (addresses, from, isDryRun, templates) {
  for (const key in templates) {
    const template = templates[key]
    if (template?.specs) {
      const targetAddr = addresses?.templates[key] ?? null
      if (
        (process.argv.includes("--all") ||
          selection.includes(key) ||
          (selection.length === 0 && isDryRun)
        ) && (
          utils.isNullAddress(targetAddr) ||
          (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const templateAddr = await utils.deployWitnetRequestTemplate(
            web3, from,
            await WitnetRequestBytecodes.deployed(),
            await WitnetRequestFactory.deployed(),
            template, key,
          )
          const templateContract = await WitnetRequestTemplate.at(templateAddr)
          console.info("  ", "> Template registry:  ", await templateContract.registry.call())
          console.info("  ", `> Template address:    \x1b[1;37m${templateContract.address}\x1b[0m`)
          addresses.templates[key] = templateAddr
        } catch (e) {
          utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      } else if (!utils.isNullAddress(targetAddr)) {
        utils.traceHeader(`Skipping '\x1b[1;37m${key}\x1b[0m'`)
        console.info("  ", `> Template address:  \x1b[1;37m${targetAddr}\x1b[0m`)
      }
    } else {
      addresses = await deployWitnetRequestTemplates(addresses, from, isDryRun, template)
    }
  }
  return addresses
}

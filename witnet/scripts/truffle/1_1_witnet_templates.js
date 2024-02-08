const witnet_require_path = (process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH 
  ? `../${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}`
  : "../../../../../witnet"
);
const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet";

const { templates } = require(`${witnet_require_path}/assets`)
const utils = require("../truffle-utils")
const selection = utils.getWitnetArtifactsFromArgs()

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from, ]) {
  const isDryRun = utils.isDryRun(network)
  let addresses = (isDryRun ? require(`../../tests/truffle/addresses`) : require(`${witnet_require_path}/assets/addresses`))[network]
  if (!addresses.templates) addresses.templates = {}
  addresses = await deployWitnetRequestTemplates(addresses, from, isDryRun, templates) 
  addresses.templates = utils.orderObjectKeys(addresses.templates);
  utils.saveAddresses(
    isDryRun ? `${witnet_module_path}/tests/truffle` : `${witnet_require_path}/assets`,
    { network: addresses }, network
  );
}

async function deployWitnetRequestTemplates (addresses, from, isDryRun, templates) {
  for (const key in templates) {
    const template = templates[key]
    if (template?.specs) {
      const targetAddr = addresses?.templates[key] ?? null
      if (
        (process.argv.includes("--all") || selection.includes(key))
          && (utils.isNullAddress(targetAddr) || (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const templateAddr = await utils.deployWitnetRequestTemplate(
            web3, from,
            await WitnetBytecodes.deployed(),
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
      addresses = await deployWitnetRequestTemplates (addresses, from, isDryRun, template)
    }
  }
  return addresses
}

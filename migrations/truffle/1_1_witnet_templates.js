const utils = require("../../assets/witnet/utils/js")
const witnet = require("../../assets/witnet")

const addresses = require("../witnet/addresses")
const hashes = require("../witnet/hashes")
const templates = require("../witnet/templates")

const selection = utils.getWitnetArtifactsFromArgs()

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from, ]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  if (!addresses[ecosystem]) addresses[ecosystem] = {}
  if (!addresses[ecosystem][network]) addresses[ecosystem][network] = {}
  if (!addresses[ecosystem][network].templates) addresses[ecosystem][network].templates = {}

  if (!hashes.reducers) hashes.reducers = {}
  if (!hashes.retrievals) hashes.retrievals = {}

  await deployWitnetRequestTemplates(from, isDryRun, ecosystem, network, templates) 
}

async function deployWitnetRequestTemplates (from, isDryRun, ecosystem, network, templates) {
  for (const key in templates) {
    const template = templates[key]
    if (template?.retrievals) {
      if (
        addresses[ecosystem][network].templates[key] !== undefined ||
        selection.includes(key) ||
        (selection.length == 0 && isDryRun)        
      ) {
        let templateAddr = utils.findArtifactAddress(addresses[ecosystem][network].templates, key)
        if (
          utils.isNullAddress(templateAddr) ||
          (await web3.eth.getCode(templateAddr)).length <= 3
        ) {
          templateAddr = await utils.buildWitnetRequestTemplate(
            web3,
            from,
            key, 
            template, 
            await WitnetBytecodes.deployed(),
            await WitnetRequestFactory.deployed(),
            witnet?.radons,
            hashes,
          )
          if (utils.isNullAddress(templateAddr)) {
            throw `artifact '${key}' could not get deployed`
          } else {
            const templateContract = await WitnetRequestTemplate.at(templateAddr)
            console.info("  ", `> Template address:  \x1b[1;37m${templateContract.address}\x1b[0m`)
            console.info("  ", "> Template registry:", await templateContract.registry.call())
          }
          addresses[ecosystem][network].templates[key] = templateAddr
          utils.saveAddresses(addresses)
        } else {
          utils.traceHeader(`Skipping '${key}'`)
          console.info("  ", `> Template address:  \x1b[1;37m${templateAddr}\x1b[0m`)
        }
      }
    } else {
      await deployWitnetRequestTemplates (from, isDryRun, ecosystem, network, template)
    }
  }
}

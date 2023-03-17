const utils = require("../../assets/witnet/utils/js")
const witnet = require("../../assets/witnet")

const addresses = require("../witnet/addresses")
const hashes = require("../witnet/hashes")
const requests = require("../witnet/requests")

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
  if (!addresses[ecosystem][network].requests) addresses[ecosystem][network].requests = {}
  if (!addresses[ecosystem][network].templates) addresses[ecosystem][network].templates = {}

  if (!hashes.reducers) hashes.reducers = {}
  if (!hashes.retrievals) hashes.retrievals = {}

  await deployWitnetRequests(from, isDryRun, ecosystem, network, requests)
}

async function deployWitnetRequests (from, isDryRun, ecosystem, network, requests) {
  for (const key in requests) {
    const request = requests[key]
    if (request?.retrievals || request?.template) {
      const targetAddress = addresses[ecosystem][network].requests[key] ?? null
      if (
        targetAddress === "" ||
        (selection.length == 0 & isDryRun) ||
        (selection.length > 0 && selection.includes(key))
      ) {
        let requestAddress
        if (request?.retrievals) {
          try {
            requestAddress = await deployWitnetRequest(from, key, request)
          } catch (e) {
            utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
            process.exit(0)
          }
        } else {
          try {
            let templateAddr = utils.findArtifactAddress(addresses[ecosystem][network], request?.template)
            if (
              utils.isNullAddress(templateAddr) ||
                (await web3.eth.getCode(templateAddr)).length <= 3
            ) {
              const templateArtifact = utils.findTemplateArtifact(witnet.templates, request?.template)
              if (!templateArtifact) {
                throw `artifact '${request?.template}' not found in templates file`
              }
              templateAddr = await utils.buildWitnetRequestTemplate(
                web3,
                from, 
                request?.template, 
                templateArtifact, 
                await WitnetBytecodes.deployed(),
                await WitnetRequestFactory.deployed(),
                witnet?.radons,
                hashes,
              )
              if (utils.isNullAddress(templateAddr)) {
                throw `artifact '${request?.template}' could not get deployed`
              } else {
                const templateContract = await WitnetRequestTemplate.at(templateAddr)
                console.info("  ", `> Template address:  \x1b[1;37m${templateContract.address}\x1b[0m]`)
                console.info("  ", "> Template registry:", await templateContract.registry.call())
              }
              addresses[ecosystem][network].templates[request?.template] = templateAddr
            }
            utils.traceHeader(`Settling '\x1b[1;37m${key}\x1b[0m'...`)
            console.info("  ", "> Template artifact:", request?.template)
            console.info("  ", `> Template address:  \x1b[1;37m${templateAddr}\x1b[0m`)
            const contract = await WitnetRequestTemplate.at(templateAddr)
            const args = request?.args
            args.map((subargs, source) => {
              if (!Array.isArray(subargs)) {
                args[source] = Object.values(subargs)
              }
              console.info("  ", `> Template source #${source + 1} params => \x1b[32m${JSON.stringify(args[source])}\x1b[0m`)
              return subargs
            })
            requestAddress = await utils.buildWitnetRequestFromTemplate(web3, from, contract, request?.args)
          } catch (ex) {
            utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${ex}`)
            process.exit(1)
          }
        }
        console.info("  ", `> Request address:   \x1b[1;37m${requestAddress}\x1b[0m`)
        addresses[ecosystem][network].requests[key] = requestAddress
        utils.saveAddresses(addresses)
      } else if (!utils.isNullAddress(targetAddress)) {
        utils.traceHeader(`Skipping '\x1b[1;37m${key}\x1b[0m'`)
        console.info("  ", `> Request address:   \x1b[1;37m${targetAddress}\x1b[0m`)
      }
    } else {
      await deployWitnetRequests(
        from,
        isDryRun,
        ecosystem,
        network,
        request
      )
    }
  }
}

async function deployWitnetRequest (from, key, request) {
  const registry = await WitnetBytecodes.deployed()
  const aggregator = await utils.verifyWitnetRadonReducerByTag(from, registry, witnet.radons, request.aggregator)
  const tally = await utils.verifyWitnetRadonReducerByTag(from, registry, witnet.radons, request.tally)
  const tags = Object.keys(request?.retrievals)
  const retrievals = []
  for (let i = 0; i < tags?.length; i++) {
    const hash = await utils.verifyWitnetRadonRetrievalByTag(from, registry, witnet.radons, tags[i])
    hashes.retrievals[tags[i]] = hash
    retrievals.push(hash)
  }
  hashes.reducers[request.aggregator] = aggregator
  hashes.reducers[request.tally] = tally
  utils.saveHashes(hashes)
  utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
  const factory = await WitnetRequestFactory.deployed()
  let templateAddr = await factory.buildRequestTemplate.call(
    retrievals,
    aggregator,
    tally,
    request?.resultDataMaxSize || 0,
    { from }
  )
  if (
    utils.isNullAddress(templateAddr) ||
      (await web3.eth.getCode(templateAddr)).length <= 3
  ) {
    const tx = await factory.buildRequestTemplate(
      retrievals,
      aggregator,
      tally,
      request?.resultDataMaxSize || 0,
      { from }
    )
    tx.logs = tx.logs.filter(log => log.event === "WitnetRequestTemplateBuilt")
    utils.traceTx(tx.receipt)
    templateAddr = tx.logs[0].args.template
  }
  console.info("  ", "> Template address: ", templateAddr)
  console.info("  ", "> Template parameters:")
  const args = Object.entries(request?.retrievals).map(entry => {
    let subargs = entry[1]
    if (!Array.isArray(subargs)) {
      subargs = Object.values(subargs)
    }
    console.info("  ", " ", `<${subargs.map(v => `"\x1b[32m${v}\x1b[0m"`)}> => \x1b[1;32m${entry[0]}\x1b[0m`)
    return subargs
  })
  const requestAddr = await utils.buildWitnetRequestFromTemplate(
    web3, 
    from, 
    await WitnetRequestTemplate.at(templateAddr), 
    args
  )
  return requestAddr
}
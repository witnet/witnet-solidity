require("dotenv").config()

const cbor = require('cbor')
const fs = require("fs")
const readline = require("readline")
const web3 = require("web3")
const Witnet = require("witnet-requests");

module.exports = {
  buildWitnetRequestFromTemplate,
  buildWitnetRequestTemplate,
  findArtifactAddress,
  findRadonRetrievalSpecs,
  findTemplateArtifact,
  fromAscii,
  getChainFromProcessArgv,
  getRealmNetworkFromArgs,
  getRealmNetworkFromString,
  getRequestMethodString,
  getRequestResultDataTypeString,
  getWitnetArtifactsFromArgs,
  getWitnetRequestArtifactsFromArgs,
  getWitnetRequestTemplateArtifactsFromArgs,
  isNullAddress,
  padLeft,
  prompt,
  saveAddresses,
  saveHashes,
  splitSelectionFromProcessArgv,
  stringifyWitnetFilterOperator,
  stringifyWitnetReducerOperator,
  stringifyWitnetReducerFilter,
  stringifyWitnetRequestMethod,  
  traceHeader,
  traceTx,
  verifyWitnetRadonReducerByTag,
  verifyWitnetRadonRetrievalByTag,
}

async function buildWitnetRequestFromTemplate(web3, from, template, args) {
  // convert all args values to string
  args = args.map(subargs => subargs.map(v => v.toString()))
  let requestAddr = await template.buildRequest.call(args, { from })
  if ((await web3.eth.getCode(requestAddr)).length <= 3) {
    const tx = await template.buildRequest(args, { from })
    console.info("  ", "> Template settlement hash:", tx.receipt.transactionHash)
    console.info("  ", "> Template settlement gas: ", tx.receipt.gasUsed)
  }
  return requestAddr
}

async function buildWitnetRequestTemplate (web3, from, key, template, registry, factory, radons, hashes) {
  const aggregator = await verifyWitnetRadonReducerByTag(from, registry, radons, template.aggregator)
  const tally = await verifyWitnetRadonReducerByTag(from, registry, radons, template.tally)
  const retrievals = []
  for (let i = 0; i < template.retrievals.length; i++) {
    const tag = template.retrievals[i]
    const hash = await verifyWitnetRadonRetrievalByTag(from, registry, radons, tag)
    hashes.retrievals[tag] = hash
    retrievals.push(hash)
  }
  hashes.reducers[template.aggregator] = aggregator
  hashes.reducers[template.tally] = tally
  saveHashes(hashes)
  traceHeader(`Building '${key}'...`)
  let templateAddr = await factory.buildRequestTemplate.call(
    retrievals,
    aggregator,
    tally,
    template?.resultDataMaxSize || 0,
    { from }
  )
  if (
    isNullAddress(templateAddr) 
      || (await web3.eth.getCode(templateAddr)).length <= 3
  ) {
    const tx = await factory.buildRequestTemplate(
      retrievals,
      aggregator,
      tally,
      template?.resultDataMaxSize || 0,
      { from }
    )
    traceTx(tx.receipt)
    tx.logs = tx.logs.filter(log => log.event === "WitnetRequestTemplateBuilt")
    templateAddr = tx.logs[0].args.template
  }
  return templateAddr
}


function findArtifactAddress (addresses, artifact) {
  if (typeof addresses === "object") {
    for (const key in addresses) {
      if (key === artifact) {
        return addresses[key]
      }
      if (typeof addresses[key] === "object") {
        const address = findArtifactAddress(addresses[key], artifact)
        if (address !== "") return address
      }
    }
  }
  return ""
}

function findRadonRetrievalSpecs(retrievals, tag, headers) {
  if (!headers) headers = []
  for (const key in retrievals) {
    if (typeof retrievals[key] === 'object') {
      var retrieval = retrievals[key]
      if (key === tag || key === retrieval?.alias) {
        if (retrieval.requestMethod) {
          if (retrieval?.requestMethod !== 2) {
            if (!retrieval?.requestAuthority) {
              retrieval.requestAuthority = headers[headers.length - 1]
              if (!retrieval?.requestPath) {
                retrieval.requestPath = tag
              }
            }
          }
        }
        return retrieval
      } else {
        retrieval = findRadonRetrievalSpecs(retrievals[key], tag, [...headers, key])
        if (retrieval) {
          return retrieval
        }
      }
    }
  }
}

function findTemplateArtifact (templates, artifact) {
  if (typeof templates === "object") {
    for (const key in templates) {
      if (key === artifact) {
        return templates[key]
      }
      if (typeof templates[key] === "object") {
        const template = findTemplateArtifact(templates[key], artifact)
        if (template !== "") return template
      }
    }
  }
  return ""
}

function fromAscii(str) {
  const arr1 = []
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16)
    arr1.push(hex)
  }
  return "0x" + arr1.join("")
}

function getChainFromProcessArgv() {
  let network = process.env.WITNET_SIDECHAIN
  process.argv.map((argv, index, args) => {
      if (argv === "--chain") {
          network = args[index + 1]
      }
  })
  if (network) {
    network = network.replaceAll(":", ".")
      return getRealmNetworkFromString(network)
  }
}

function getRealmNetworkFromArgs() {
  let networkString = process.argv.includes("test") ? "test" : "development"
  // If a `--network` argument is provided, use that instead
  const args = process.argv.join("=").split("=")
  const networkIndex = args.indexOf("--network")
  if (networkIndex >= 0) {
    networkString = args[networkIndex + 1]
  }
  return getRealmNetworkFromString(networkString)
}

function getRealmNetworkFromString(network) {
  network = network ? network.toLowerCase() : "development"

  // Try to extract realm/network info from environment
  const envRealm = process.env.WITNET_EVM_REALM
    ? process.env.WITNET_EVM_REALM.toLowerCase()
    : null

  let realm
  if (network.split(".")[1]) {
    realm = network.split(".")[0]
    if (realm === "ethereum") {
      // Realm in "ethereum.*" networks must be set to "default"
      realm = "default"
    }
    if (envRealm && realm !== envRealm) {
      // Check that WITNET_EVM_REALM, if defined, and network's realm actually match
      console.error(
        `\n> Fatal: network "${network}" and WITNET_EVM_REALM value`,
        `("${envRealm.toUpperCase()}") don't match.\n`
      )
      process.exit(1)
    }
  } else {
    realm = envRealm || "default"
    network = `${realm === "default" ? "ethereum" : realm}.${network}`
  }
  if (realm === "default") {
    const subnetwork = network.split(".")[1]
    if (subnetwork === "development" || subnetwork === "test") {
      // In "default" realm, networks "development" and "test" must be returned without a prefix.
      network = subnetwork
    }
  }
  return [realm, network]
}

function getWitnetArtifactsFromArgs() {
  let selection = []
  process.argv.map((argv, index, args) => {
    if (argv === "--artifacts") {
      selection = args[index + 1].split(",")
    }
    return argv
  })
  return selection
}

function getWitnetRequestArtifactsFromArgs() {
  let selection = []
  process.argv.map((argv, index, args) => {
    if (argv === "--requests") {
      selection = args[index + 1].split(",")
    }
    return argv
  })
  return selection
}

function getWitnetRequestTemplateArtifactsFromArgs() {
  let selection = []
  process.argv.map((argv, index, args) => {
    if (argv === "--templates") {
      selection = args[index + 1].split(",")
    }
    return argv
  })
  return selection
}

function getRequestMethodString(method) {
  if (method == 0) {
    return "UNKNOWN"
  } else if (method == 1 || !method) {
    return "HTTP-GET"
  } else if (method == 2) {
    return "RNG"
  } else if (method == 3) {
    return "HTTP-POST"
  } else {
    return method.toString()
  }
}

function getRequestResultDataTypeString(type) {
  if (type == 1) {
    return "Array"
  } else if (type == 2) {
    return "Bool"
  } else if (type == 3) {
    return "Bytes"
  } else if (type == 4) {
    return "Integer"
  } else if (type == 5) {
    return "Float"
  } else if (type == 6) {
    return "Map"
  } else if (type == 7) {
    return "String"
  } else {
    return "(Undetermined)"
  }
}

function isNullAddress(addr) {
  return !addr ||
    addr === "" ||
    addr === "0x0000000000000000000000000000000000000000" ||
    !web3.utils.isAddress(addr)
}

function padLeft(str, char, size) {
  if (str.length < size) {
    return char.repeat((size - str.length) / char.length) + str
  } else {
    return str
  }
}

async function prompt(text) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  let answer
  await new Promise((resolve) => {
    rl.question(
      text,
      function (input) {
        answer = input
        rl.close()
      })
    rl.on("close", function () {
      resolve()
    })
  })
  return answer
}

function saveAddresses(addrs, path) {
  fs.writeFileSync(
    `${path || './migrations/witnet'}/addresses.json`,
    JSON.stringify(addrs, null, 4),
    { flag: 'w+' }
  )
}

function saveHashes(hashes, path) {
  fs.writeFileSync(
    `${path || './migrations/witnet'}/hashes.json`,
    JSON.stringify(hashes, null, 4),
    { flag: 'w+' }
  )
}

function splitSelectionFromProcessArgv(operand) {
  let selection = []
  if (process.argv.includes(operand)) {
      process.argv.map((argv, index, args) => {
          if (argv === operand) {
              if (index < process.argv.length - 1 && !args[index + 1].startsWith("--")) {
                  selection = args[index + 1].replaceAll(":", ".").split(",")
              }
          }
      })
  }
  return selection
}

function stringifyWitnetReducerOperator(opcode) {
  if (opcode === Witnet.Types.REDUCERS.mode) {
      return "Mode"
  } else if (opcode === Witnet.Types.REDUCERS.averageMean) {
      return "MeanAverage"
  } else if (opcode === Witnet.Types.REDUCERS.averageMedian) {
      return "MedianAverage"
  } else if (opcode === Witnet.Types.REDUCERS.deviationStandard) {
      return "StandardDeviation"
  } else if (opcode === Witnet.Types.REDUCERS.concatenateAndHash) {
      return "ConcatHash"
  } else {
      return opcode
  }
}

function stringifyWitnetReducerFilter(filter) {
  return `${stringifyWitnetFilterOperator(filter?.opcode)}${filter?.args ? `( ${cbor.decode(filter.args)} )` : ""}`
}

function stringifyWitnetFilterOperator(opcode) {
  if (opcode === Witnet.Types.FILTERS.mode) {
      return "Mode"
  } else if (opcode === Witnet.Types.FILTERS.deviationStandard) {
      return "StandardDeviation"
  } else {
      return opcode
  }
}

function stringifyWitnetRequestMethod(method) {
  if (method === Witnet.Types.RETRIEVAL_METHODS.HttpGet) {
    return "HTTP/GET"
  } else if (method === Witnet.Types.RETRIEVAL_METHODS.HttpPost) {
    return "HTTP/POST"
  } else if (method === Witnet.Types.RETRIEVAL_METHODS.Rng) {
    return "RNG"
  } else {
    return method
  }

  
}

function traceHeader(header) {
  console.log("")
  console.log("  ", header)
  console.log("  ", `${"-".repeat(header.length)}`)
}

function traceTx (receipt) {
  console.log("  ", "> Transaction block:", receipt.blockNumber)
  console.log("  ", "> Transaction hash: ", receipt.transactionHash)
  console.log("  ", "> Transaction gas:  ", receipt.gasUsed)
}

async function verifyWitnetRadonReducerByTag(from, registry, radons, tag) {
  var reducer = radons?.reducers[tag]
  var hash
  if (reducer) {
    // get actual reducer hash
    hash = await registry.verifyRadonReducer.call([
        reducer.opcode,
        reducer.filters || [],
        reducer.script || "0x"
      ], { from }
    )
    // checks whether hash was already registered
    try {
      await registry.lookupRadonReducer.call(hash, { from })
    } catch {
      // register new reducer, otherwise:
      traceHeader(`Verifying Radon Reducer ['${tag}']...`)
      console.info(`   > Hash:        ${hash}`)
      console.info(`   > Opcode:      ${reducer.opcode}`)
      if (reducer.filters) {
        reducer.filters = reducer.filters.map(filter => [ 
          filter.opcode, 
          "0x" + filter.args.toString("hex")
        ])
      }
      console.info(`   > Filters:     ${reducer.filters?.length > 0 ? JSON.stringify(reducer.filters) : '(no filters)'}`)
      if (reducer.script) {
        console.info(`   > Script:      ${reducer.script}`)
      }
      const tx = await registry.verifyRadonReducer([
          reducer.opcode,
          reducer.filters || [],
          reducer.script || "0x",
        ], { from }
      )
      traceTx(tx.receipt)
    }
  } else {
    throw `Witnet Radon Reducer not found: '${tag}'`
  }
  return hash
}

async function verifyWitnetRadonRetrievalByTag(from, registry, radons, tag) {
  const retrieval = findRadonRetrievalSpecs(radons?.retrievals, tag)
  // get actual hash for this data source
  var hash
  if (retrieval) {
    const requestScriptBytecode = "0x" + retrieval.requestScript?.encode().toString('hex') || "80"
    try {
      hash = await registry.verifyRadonRetrieval.call(
        await retrieval.requestMethod || 1,
        retrieval.requestSchema || "",
        retrieval.requestAuthority || "",
        retrieval.requestPath || "",
        retrieval.requestQuery || "",
        retrieval.requestBody || "",
        retrieval.requestHeaders || [],
        requestScriptBytecode,
        { from }
      )
    } catch (e) {
      throw `Cannot verify radon retrieval: ${e}`
    }
    // checks whether hash is already registered
    try {
      await registry.lookupRadonRetrieval.call(hash, { from })
    } catch (ex) {
      // register new retrieval, otherwise:
      traceHeader(`Verifying Radon Retrieval ['${tag}']...`)
      console.info(`   > Hash:      ${hash}`)
      console.info(`   > Method:    ${getRequestMethodString(await retrieval.requestMethod)}`)
      if (retrieval.requestSchema) {
        console.info(`   > Schema:    ${retrieval.requestSchema}`)
      }
      if (retrieval.requestAuthority) {
        console.info(`   > Authority: ${retrieval.requestAuthority}`)
      }
      if (retrieval.requestPath)  {
        console.info(`   > Path:      ${retrieval.requestPath}`)
      }
      if (retrieval.requestQuery) {
        console.info(`   > Query:     ${retrieval.requestQuery}`)
      }
      if (retrieval.requestBody) {
        console.info(`   > Body:      ${retrieval.requestBody}`)
      }
      if (retrieval.requestHeaders) {
        console.info(`   > Headers:   ${retrieval.requestHeaders}`)
      }
      console.info(`   > Script:    ${requestScriptBytecode}`)
      const tx = await registry.verifyRadonRetrieval(
        retrieval.requestMethod || 1,
        retrieval.requestSchema || "",
        retrieval.requestAuthority || "",
        retrieval.requestPath || "",
        retrieval.requestQuery || "",
        retrieval.requestBody || "",
        retrieval.requestHeaders || [],
        requestScriptBytecode,
        { from }
      )
      traceTx(tx.receipt)
    }
  } else {
    throw `Witnet Radon Retrieval not found: '${tag}`
  }
  return hash
}
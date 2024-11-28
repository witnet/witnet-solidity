const cbor = require("cbor")
const toolkit = require("witnet-toolkit/utils")
const utils = require("witnet-solidity-bridge/utils")
const Witnet = require("witnet-toolkit")

module.exports = {
  deployWitOracleRequest,
  deployWitOracleRequestTemplate,
  dryRunBytecode: toolkit.dryRunBytecode,
  dryRunBytecodeVerbose: toolkit.dryRunBytecodeVerbose,
  flattenWitnetArtifacts,
  getFromFromArgs,
  getRealmNetworkFromArgs: utils.getRealmNetworkFromArgs,
  getWitnetArtifactsFromArgs: utils.getWitnetArtifactsFromArgs,
  getWitOracleRequestMethodString: utils.getWitOracleRequestMethodString,
  isDryRun: utils.isDryRun,
  isNullAddress,
  orderObjectKeys,
  processDryRunJson,
  loadAddresses,
  saveAddresses,
  readJsonFromFile: utils.readJsonFromFile,
  overwriteJsonFile: utils.overwriteJsonFile,
  traceHeader: utils.traceHeader,
  traceTx,
  verifyRadonReducer,
  verifyRadonRetrieval,
}

async function buildWitOracleRequestFromTemplate (web3, from, templateContract, args) {
  // convert all args values to string
  args = args.map(subargs => subargs.map(v => v.toString()))
  const requestAddr = await templateContract.methods['buildWitOracleRequest(string[][])'].call(args, { from })
  if ((await web3.eth.getCode(requestAddr)).length <= 3) {
    const tx = await templateContract.methods['buildWitOracleRequest(string[][])'](args, { from })
    console.info("  ", "> Template settlement hash:", tx.receipt.transactionHash)
    console.info("  ", "> Template settlement gas: ", tx.receipt.gasUsed)
  }
  return requestAddr
}

async function deployWitOracleRequest (web3, from, registry, factory, request, templateArtifact, key) {
  if (request instanceof Witnet.Artifacts.Parameterized) {
    const templateAddr = await deployWitOracleRequestTemplate(web3, from, registry, factory, request)
    if (key) utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
    console.info("  ", "> Template address: ", templateAddr)
    const args = []
    if (request?.args) {
      console.info("  ", "> Instance parameters:")
      request?.args?.forEach((subargs, index) => {
        console.info(
          "     ",
          `Source #${index + 1}: \x1b[1;32m${JSON.stringify(subargs)}\x1b[0m => \x1b[32m${request.specs?.retrieve[index].url} ...\x1b[0m`
        )
        args[index] = subargs
      })
    } else {
      request.specs.retrieve.map(_source => args.push([]))
    }
    return await buildWitOracleRequestFromTemplate(web3, from, await templateArtifact.at(templateAddr), args)
  } else {
    const sources = await verifyRadonRetrievals(from, registry, request.specs.retrieve)
    if (key) utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
    let requestAddr = await factory.buildWitOracleRequest.call(
      sources,
      encodeWitnetRadon(request.specs.aggregate),
      encodeWitnetRadon(request.specs.tally),
      { from }
    )
    if (isNullAddress(requestAddr) || (await web3.eth.getCode(requestAddr)).length <= 3) {
      const tx = await factory.buildWitOracleRequest(
        sources,
        encodeWitnetRadon(request.specs.aggregate),
        encodeWitnetRadon(request.specs.tally),
        { from }
      )
      traceTx(tx.receipt)
      tx.logs = tx.logs.filter(log => log.event === "WitOracleRequestBuilt")
      requestAddr = tx.logs[0].args.request
    }
    return requestAddr
  }
}

async function verifyRadonRetrievals (from, registry, retrievals) {
  const sources = []
  for (let j = 0; j < retrievals.length; j++) {
    sources.push(
      await verifyRadonRetrieval(from, registry, retrievals[j])
    )
  }
  return sources
}

async function deployWitOracleRequestTemplate (web3, from, registry, factory, template, key) {
  const sources = await verifyRadonRetrievals(from, registry, template.specs.retrieve)
  if (key) utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
  let templateAddr = await factory.buildWitOracleRequestTemplate.call(
    sources,
    encodeWitnetRadon(template.specs.aggregate),
    encodeWitnetRadon(template.specs.tally),
    { from }
  )
  if (isNullAddress(templateAddr) || (await web3.eth.getCode(templateAddr)).length <= 3) {
    const tx = await factory.buildWitOracleRequestTemplate(
      sources,
      encodeWitnetRadon(template.specs.aggregate),
      encodeWitnetRadon(template.specs.tally),
      { from }
    )
    traceTx(tx.receipt)
    tx.logs = tx.logs.filter(log => log.event === "WitOracleRequestTemplateBuilt")
    templateAddr = tx.logs[0].args.template
  }
  return templateAddr
};

function encodeWitnetRadon (T) {
  if (T instanceof Witnet.Reducers.Class) {
    return [
      T.opcode,
      T.filters?.map(filter => encodeWitnetRadon(filter)) || [],
    ]
  } else if (T instanceof Witnet.Filters.Class) {
    return [
      T.opcode,
      `0x${T.args ? cbor.encode(T.args).toString("hex") : ""}`,
    ]
  } else if (T instanceof Witnet.Sources.Class) {
    return [
      T.method,
      T.url || "",
      T.body || "",
      T.headers || "",
      encodeWitnetRadon(T.script) || "0x80",
    ]
  } else if (T instanceof Witnet.Types.RadonType) {
    return cbor.encode(T._encodeArray())
  }
  return T
};

function flattenWitnetArtifacts (tree, headers) {
  if (!headers) headers = []
  const matches = []
  for (const key in tree) {
    if (tree[key]?.specs) {
      matches.push({
        key,
        artifact: tree[key],
      })
    } else if (typeof tree[key] === "object") {
      matches.push(...flattenWitnetArtifacts(
        tree[key],
        [...headers, key]
      ))
    }
  }
  return matches
};

function getFromFromArgs () {
  const fromIndex = process.argv.indexOf("--from")
  if (fromIndex >= 0) {
    return process.argv[fromIndex + 1]
  } else {
    return null
  }
};

function isNullAddress (addr) {
  return !addr ||
        addr === "" ||
        addr === "0x0000000000000000000000000000000000000000"
}

function orderObjectKeys (unordered) {
  return Object.keys(unordered).sort().reduce(
    (obj, key) => {
      obj[key] = unordered[key]
      return obj
    }, {}
  )
}

function processDryRunJson (dryrun) {
  let error = ""
  const msecs = []
  dryrun?.retrieve.forEach(retrieve => {
    msecs.push(retrieve?.running_time?.secs * 1000 + retrieve?.running_time?.nanos / 1000000)
  })
  const itWorks = !("RadonError" in dryrun?.aggregate?.result)
  if (!itWorks) {
    error = `Aggregation failed: ${unescape(dryrun?.aggregate?.result?.RadonError)}`
  }
  const nokSources = Object.values(
    dryrun?.retrieve.filter((source, index) => {
      const nok = "RadonError" in source.result
      if (nok && !error) {
        error = `Source #${index + 1}: ${unescape(source.result?.RadonError)}`
      }
      return nok
    })
  ).length
  const totalSources = Object.values(dryrun?.retrieve).length
  const status = itWorks ? (nokSources > 0 ? "WARN" : "OK") : "FAIL"
  return {
    error,
    itWorks,
    nokSources,
    totalSources,
    runningTime: Math.round(msecs.reduce((a, b) => a > b ? a : b)) / 1000,
    status,
    tally: dryrun?.tally.result,
  }
}

async function verifyRadonReducer (from, registry, reducer) {
  let hash
  if (reducer instanceof Witnet.Reducers.Class) {
    hash = await registry.verifyRadonReducer.call(encodeWitnetRadon(reducer), { from })
    try {
      await registry.lookupRadonReducer.call(hash, { from })
    } catch {
      // register new reducer, otherwise:
      utils.traceHeader("Verifying Radon Reducer ...")
      console.info(`   > Hash:        \x1b[35m${hash}\x1b[0m`)
      console.info(`   > Reducer:     \x1b[1;35m${reducer.toString()}\x1b[0m`)
      const tx = await registry.verifyRadonReducer(encodeWitnetRadon(reducer), { from })
      traceTx(tx.receipt)
    }
  } else {
    throw TypeError(`Witnet Radon Reducer: invalid type: '\x1b[1;31m${reducer}\x1b[0m'`)
  }
  return hash
};

async function verifyRadonRetrieval (from, registry, source) {
  // get actual hash for this data source
  let hash
  if (source) {
    try {
      hash = await registry.methods["verifyRadonRetrieval(uint8,string,string,string[2][],bytes)"].call(...encodeWitnetRadon(source), { from })
    } catch (e) {
      throw EvalError(`Cannot check if Witnet Radon Source is already verified: ${e}`)
    }
    // checks whether hash is already registered
    try {
      await registry.lookupRadonRetrieval.call(hash, { from })
    } catch {
      // register new source, otherwise:
      utils.traceHeader("Verifying Radon Source ...")
      console.info(`   > Hash:       \x1b[32m${hash}\x1b[0m`)
      if (source?.url) {
        console.info(`   > URL:        \x1b[1;32m${source.url}\x1b[0m`)
      }
      console.info(`   > Method:     \x1b[1;32m${utils.getWitOracleRequestMethodString(source?.method)}\x1b[0m`)
      if (source?.body) {
        console.info(`   > Body:       \x1b[1;32m${source.body}\x1b[0m`)
      }
      if (source?.headers && source?.headers[0] && source?.headers[0][0] !== "") {
        console.info(`   > Headers:    \x1b[1;32m${source.headers}\x1b[0m`)
      }
      if (source?.script) {
        console.info(`   > Script:     \x1b[1;33m${source.script.toString()}\x1b[0m`)
      }
      if (source?.argsCount) {
        console.info(`   > Total args: \x1b[1;33m${source.argsCount}\x1b[0m`)
      }
      const tx = await registry
        .methods["verifyRadonRetrieval(uint8,string,string,string[2][],bytes)"]
        .sendTransaction(...encodeWitnetRadon(source), { from })
      traceTx(tx.receipt)
    }
  } else {
    throw TypeError(`Witnet Radon Source: invalid type: '\x1b[1;31m${source}\x1b[0m'`)
  }
  return hash
};

function loadAddresses (path) {
  const fs = require("fs")
  const filename = `${path}/addresses.json`
  return JSON.parse(fs.readFileSync(filename))
}

function saveAddresses (path, addrs) {
  const fs = require("fs")
  const filename = `${path}/addresses.json`
  const json = { ...JSON.parse(fs.readFileSync(filename)), ...addrs }
  fs.writeFileSync(filename, JSON.stringify(json, null, 4), { flag: "w+" })
};

function traceTx (receipt) {
  console.log("  ", "> Transaction block:", receipt.blockNumber)
  console.log("  ", "> Transaction hash: ", receipt.transactionHash)
  console.log("  ", "> Transaction gas:  ", receipt.gasUsed)
};

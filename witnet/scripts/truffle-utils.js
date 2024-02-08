const cbor = require("cbor")
const toolkit = require("witnet-toolkit/utils")
const utils = require("witnet-solidity-bridge/utils")
const Witnet = require("../../dist/lib/radon")

module.exports = {
    deployWitnetRequest,
    deployWitnetRequestTemplate,
    dryRunBytecode: toolkit.dryRunBytecode,
    dryRunBytecodeVerbose: toolkit.dryRunBytecodeVerbose,
    flattenWitnetArtifacts,
    getRealmNetworkFromArgs: utils.getRealmNetworkFromArgs,
    getWitnetArtifactsFromArgs: utils.getWitnetArtifactsFromArgs,
    getWitnetRequestMethodString: utils.getWitnetRequestMethodString,
    isDryRun: utils.isDryRun,
    isNullAddress,
    orderObjectKeys,
    processDryRunJson,
    saveAddresses,
    traceHeader: utils.traceHeader,
    verifyWitnetRadonReducer,
    verifyWitnetRadonRetrieval,
};

async function buildWitnetRequestFromTemplate(web3, from, templateContract, args) {
    // convert all args values to string
    args = args.map(subargs => subargs.map(v => v.toString()))
    let requestAddr = await templateContract.buildRequest.call(args, { from })
    if ((await web3.eth.getCode(requestAddr)).length <= 3) {
        const tx = await templateContract.buildRequest(args, { from })
        console.info("  ", "> Template settlement hash:", tx.receipt.transactionHash)
        console.info("  ", "> Template settlement gas: ", tx.receipt.gasUsed)
    }
    return requestAddr
}

async function deployWitnetRequest(web3, from, registry, factory, request, templateArtifact, key) {
    const templateAddr = await deployWitnetRequestTemplate(web3, from, registry, factory, request)
    if (key) utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
    console.info("  ", "> Template address: ", templateAddr)
    const args = []
    if (request?.args) {
      console.info("  ", "> Instance parameters:")
      request?.args?.map((subargs, index) => {
        console.info("  ", " ", `Retrieval #${index}: \x1b[1;32m${JSON.stringify(subargs)}\x1b[0m => \x1b[32m${request.specs?.retrieve[index].url} ...\x1b[0m`)
        args[index] = subargs
      })
    } else {
      request.specs.retrieve.map(retrieval => args.push([]))
    }
    return await buildWitnetRequestFromTemplate(web3, from, await templateArtifact.at(templateAddr), args)
}

async function deployWitnetRequestTemplate (web3, from, registry, factory, template, key) {
    const aggregate = await verifyWitnetRadonReducer(from, registry, template.specs.aggregate)
    const tally = await verifyWitnetRadonReducer(from, registry, template.specs.tally)
    const retrievals = []
    const args = []
    for (var j = 0; j < template?.specs.retrieve.length; j ++) {
      retrievals.push(await verifyWitnetRadonRetrieval(from, registry, template.specs.retrieve[j]))
      args.push([])
    }
    if (key) utils.traceHeader(`Building '\x1b[1;37m${key}\x1b[0m'...`)
    let templateAddr = await factory.buildRequestTemplate.call(
      retrievals, aggregate, tally,
      template?.specs?.maxSize || 32,
      { from }
    )
    if (isNullAddress(templateAddr) || (await web3.eth.getCode(templateAddr)).length <= 3) {
      const tx = await factory.buildRequestTemplate(
        retrievals, aggregate, tally,
        template?.specs?.maxSize || 32,
        { from }
      )
      traceTx(tx.receipt)
      tx.logs = tx.logs.filter(log => log.event === "WitnetRequestTemplateBuilt")
      templateAddr = tx.logs[0].args.template
    }
    return templateAddr
};

function encodeWitnetRadon(T) {
    if (T instanceof Witnet.Reducers.Class) {
        return [
            T.opcode,
            T.filters?.map(filter => encodeWitnetRadon(filter)) || [],
        ];
    } else if (T instanceof Witnet.Filters.Class) {
        return [
            T.opcode,
            `0x${T.args ? cbor.encode(T.args).toString("hex"): ""}`
        ];
    } else if (T instanceof Witnet.Retrievals.Class) {
        return [
            T.method,
            T.url || "",
            T.body || "",
            T.headers || "",
            encodeWitnetRadon(T.script) || "0x80"
        ];
    } else if (T instanceof Witnet.Types.RadonType) {
        return cbor.encode(T._encodeArray())
    }
    return T;
};

function flattenWitnetArtifacts(tree, headers) {
    if (!headers) headers = []
    const matches = []
    for (const key in tree) {
        if (tree[key]?.specs) {
            matches.push({
                key,
                artifact: tree[key]
            });
        } else if (typeof tree[key] === "object") {
            matches.push(...flattenWitnetArtifacts(
                tree[key],
                [...headers, key]
            ));
        }
    }
    return matches
};

function isNullAddress(addr) {
    return !addr ||
        addr === "" ||
        addr === "0x0000000000000000000000000000000000000000"
}

function orderObjectKeys(unordered) {
    return Object.keys(unordered).sort().reduce(
        (obj, key) => {
            obj[key] = unordered[key];
            return obj;
        }, {}
    );
}

function processDryRunJson(dryrun) {
    let error = ""
    let msecs = []
    dryrun?.retrieve.map(retrieve => {
        msecs.push(retrieve?.running_time?.secs * 1000 + retrieve?.running_time?.nanos / 1000000)
    })
    const itWorks = !("RadonError" in dryrun?.aggregate?.result)
    if (!itWorks) {
        error = `Aggregation failed: ${unescape(dryrun?.aggregate?.result?.RadonError)}`
    }
    const nokRetrievals = Object.values(
        dryrun?.retrieve.filter((retrieval, index) => {
            const nok = "RadonError" in retrieval.result
            if (nok && !error) {
                error = `Retrieval #${index + 1}: ${unescape(retrieval.result?.RadonError)}`
            }
            return nok
        })
    ).length;
    const totalRetrievals = Object.values(dryrun?.retrieve).length
    const status = itWorks ? (nokRetrievals > 0 ? "WARN": "OK") : "FAIL"
    return {
        error,
        itWorks: itWorks,
        nokRetrievals,
        totalRetrievals,
        runningTime: Math.round(msecs.reduce((a, b) => a > b ? a : b)) / 1000,
        status,
        tally: dryrun?.tally.result
    }
}

async function verifyWitnetRadonReducer(from, registry, reducer) {
    let hash
    if (reducer instanceof Witnet.Reducers.Class) {
        hash = await registry.verifyRadonReducer.call(encodeWitnetRadon(reducer), { from })
        try {
            await registry.lookupRadonReducer.call(hash, { from })
        } catch {
            // register new reducer, otherwise:
            utils.traceHeader(`Verifying Radon Reducer ...`)
            console.info(`   > Hash:        \x1b[35m${hash}\x1b[0m`)
            console.info(`   > Reducer:     \x1b[1;35m${reducer.toString()}\x1b[0m`)
            const tx = await registry.verifyRadonReducer(encodeWitnetRadon(reducer), { from })
            traceTx(tx.receipt)
        }
    } else {
        throw `Witnet Radon Reducer: invalid type: '\x1b[1;31m${reducer}\x1b[0m'`
    }
    return hash
};
  
async function verifyWitnetRadonRetrieval(from, registry, retrieval) {
    // get actual hash for this data source
    var hash
    if (retrieval) {
        try {
            hash = await registry.methods['verifyRadonRetrieval(uint8,string,string,string[2][],bytes)'].call(...encodeWitnetRadon(retrieval), { from })
        } catch (e) {
            throw `Cannot check if Witnet Radon Retrieval is already verified: ${e}`
        }
        // checks whether hash is already registered
        try {
            await registry.lookupRadonRetrieval.call(hash, { from })
        } catch {
            // register new retrieval, otherwise:
            utils.traceHeader(`Verifying Radon Retrieval ...`)
            console.info(`   > Hash:       \x1b[32m${hash}\x1b[0m`)
            if (retrieval?.url) {
                console.info(`   > URL:        \x1b[1;32m${retrieval.url}\x1b[0m`)
            } 
            console.info(`   > Method:     \x1b[1;32m${utils.getWitnetRequestMethodString(retrieval?.method)}\x1b[0m`)
            if (retrieval?.body) {
                console.info(`   > Body:       \x1b[1;32m${retrieval.body}\x1b[0m`)
            }
            if (retrieval?.headers && retrieval?.headers[0] && retrieval?.headers[0][0] !== "") {
                console.info(`   > Headers:    \x1b[1;32m${retrieval.headers}\x1b[0m`)
            }
            if (retrieval?.script) {
                console.info(`   > Script:     \x1b[1;33m${retrieval.script.toString()}\x1b[0m`)
            }
            if (retrieval?.argsCount) {
                console.info(`   > Total args: \x1b[1;33m${retrieval.argsCount}\x1b[0m`)
            }
            const tx = await registry.methods['verifyRadonRetrieval(uint8,string,string,string[2][],bytes)'].sendTransaction(...encodeWitnetRadon(retrieval), { from })
            traceTx(tx.receipt)
        }
    } else {
        throw `Witnet Radon Retrieval: invalid type: '\x1b[1;31m${retrieval}\x1b[0m'`
    }
    return hash
};

function saveAddresses(path, addrs, network) {
    const fs = require("fs")
    const filename = `${path}/addresses.json`
    const json = JSON.parse(fs.readFileSync(filename))
    json[network] = addrs
    fs.writeFileSync(filename, JSON.stringify(json, null, 4), { flag: "w+" })
};

function traceTx (receipt) {
    console.log("  ", "> Transaction block:", receipt.blockNumber)
    console.log("  ", "> Transaction hash: ", receipt.transactionHash)
    console.log("  ", "> Transaction gas:  ", receipt.gasUsed)
};
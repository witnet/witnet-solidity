const ethers = require("ethers")
const helpers = require("../helpers")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()

const { utils, Witnet } = require("@witnet/sdk")
const { WitOracle, abiEncodeDataPushReport } = require("../../../dist/src/lib")
const { fromHexString } = require("@witnet/sdk/utils")

module.exports = async function (options = {}, args = []) {

    [args] = helpers.deleteExtraFlags(args)
        
    const witOracle = await WitOracle.fromJsonRpcUrl(
        `http://127.0.0.1:${options?.port || 8545}`,
        options?.signer,
    );

    const { address, network } = witOracle
    helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)

    const artifact = await witOracle.getEvmImplClass()
    const version = await witOracle.getEvmImplVersion()
    console.info(`  ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} (${version})`)

    if (options?.report) {
        if (!options?.into) {
            throw new Error(`--into <EVM_ADDRESS> must be specified`)
        }
        const consumer = await witOracle.getWitOracleConsumerAt(options.into)
        
        console.info(helpers.colors.lwhite(`\n  Fetching result to Wit/Oracle query:`))
        const provider = await Witnet.JsonRpcProvider.fromEnv(options?.witnet)
        console.info(`  > Witnet provider:   ${provider.endpoints}`)
        console.info(`  > Witnet network:    ${provider.network.toUpperCase()} (${provider.networkId.toString(16)})`)
        
        const drTxHash = options.report
        const drTx = await provider.getDataRequest(drTxHash, "ethereal", true)
        // console.log(drTx)
        if (drTx?.query) {
            console.info(`  > Witnet DRT hash:   ${drTxHash}`)
            console.info(`  > Witnet RAD hash:   ${drTx.query.rad_hash}`)
            console.info(`  > Witnet DRO hash:   ${drTx.query.dro_hash}`)
            
            let report, message, digest
            if (drTx?.result) {
                console.info(`  > Witnet DRT result: ${utils.cbor.decode(utils.fromHexString(drTx.result.cbor_bytes))}`)
                console.info(`  > Witnet DRT clock:  ${moment.unix(drTx.result.timestamp).fromNow()}`)
                report = {
                    drTxHash: `0x${drTxHash}`,
                    queryParams: {
                        witnesses: drTx.query.witnesses,
                        unitaryReward: Math.floor(Number(drTx.query.collateral) / 125),
                        resultMaxSize: 0,
                    },
                    queryRadHash: `0x${drTx.query.rad_hash}`,
                    resultCborBytes: `0x${drTx.result.cbor_bytes}`,
                    resultTimestamp: drTx.result.timestamp,
                }
                if (!drTx.confirmed) {
                    const user = await prompt([{
                        message: `  > The Wit/Oracle query is not yet finalized. Proceed anyway ?`,
                        name: "continue",
                        type: "confirm",
                        default: true,
                    }])
                    if (!user.continue) {
                        process.exit(0)
                    }
                } 
                message = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["bytes32", "bytes32", "(uint16, uint16, uint64)", "uint64", "bytes"],
                    abiEncodeDataPushReport(report)
                )
                digest = ethers.solidityPackedKeccak256(
                    ["bytes"],
                    [message],
                )
            } else {
                console.info(`  Skipped: the Wit/Oracle query exists but has not yet been solved.`)
            }
            if (message) {
                console.info(`\n  ${helpers.colors.lwhite("WitOracleConsumer")}:   ${helpers.colors.lblue(options.into)}`)
                traceData(`  > Push data report:  `, message.slice(2), 64, "\x1b[90m")
                console.info(`  > Push data digest:  ${digest.slice(2)}`)

                const signingKey = new ethers.SigningKey(process.env.WITNET_REPORTER_PRIVATE_KEY)
                const signature = signingKey.sign(utils.fromHexString(digest))
                const proof = signature.serialized
                console.info(`  > Push data proof:   ${proof.slice(2)}`)
                console.log(fromHexString(message))
                console.log(ethers.verifyMessage(message, signature.serialized))
                const receipt = await consumer.pushDataReport(report, proof, {
                    confirmations: 1,
                    gasLimit: options?.gasLimit,
                    gasPrice: options?.gasPrice,
                    onDataPushReportTransaction: (txHash) => {
                        process.stdout.write(`  > Pushing report  => ${helpers.colors.gray(txHash)} ... `)
                    }
                }).catch(err => {
                    process.stdout.write(`${helpers.colors.mred("FAIL")}\n`)
                    console.error(err)
                })
                process.stdout.write(`${helpers.colors.lwhite("OK")}\n`)
                console.log("  ", receipt)
            }
        } else {
            console.info(`  Skipped: the Wit/Oracle query does not exist.`)
        }
    }
    
    const toBlock = BigInt(options?.toBlock || await witOracle.provider.getBlockNumber())
    const fromBlock = BigInt(options?.fromBlock || toBlock - 1024n)

    const logs = (await witOracle.filterWitOracleReportEvents({
        fromBlock,
        toBlock,
        where: {
            evmOrigin: options?.signer,
            evmConsumer: options['filter-consumer'],
            queryRadHash: options['filter-radHash'],
        },
    })).reverse().slice(0, options?.limit || 64)

    if (logs.length > 0) {
        if (options?.verbose) {
            helpers.traceTable(
                logs.map(log => [ 
                    log.evmBlockNumber,
                    `${log.evmOrigin.slice(0, 7)}..${log.evmOrigin.slice(-5)}`,
                    `${log?.evmConsumer.slice(0, 7)}..${log?.evmConsumer.slice(-5)}`,
                    helpers.colors.mgreen(`${log?.queryRadHash?.slice(2).slice(0, 6)}..${log?.queryRadHash.slice(-6)}`),
                    helpers.colors.green(`[ ${Object.values(log?.queryParams).join(", ")} ]`),
                    utils.cbor.decode(utils.fromHexString(log?.resultCborBytes)),
                    moment.unix(log.resultTimestamp).fromNow(),
                ]), 
                {
                    colors: [ 
                        helpers.colors.lwhite, 
                        helpers.colors.gray,
                        helpers.colors.gray,
                        ,, 
                        helpers.colors.mcyan,
                        helpers.colors.cyan,
                    ],
                    headlines: [ 
                        "EVM BLOCK:", 
                        "EVM PUSHER",
                        "EVM CONSUMER",
                        ":WIT RAD HASH", 
                        "WIT QUERY PARAMS",
                        "WIT QUERY RESULT",
                        "WIT TIMESTAMP",
                    ],
                    humanizers: [ helpers.commas,,,,,, ],
                }
            )
        } else {
            helpers.traceTable(
                logs.map(log => [ 
                    log.evmBlockNumber,
                    log.evmTransactionHash,
                    log.witDrTxHash.slice(2),
                    // log.witDrTxRadHash
                ]), 
                {
                    colors: [ 
                        helpers.colors.lwhite, 
                        helpers.colors.gray,
                        helpers.colors.green,
                        // helpers.colors.mgreen,
                    ],
                    headlines: [ 
                        "EVM BLOCK:", 
                        "EVM DATA PUSH TX HASH",
                        "WIT DATA REQUEST TX HASH",
                        // "WIT RAD HASH",
                    ],
                    humanizers: [ helpers.commas,,,,,, ],
                }
            )
        }
        process.stdout.write(`^ Showing ${logs.length} push data reports`)
    } else {
        process.stdout.write(`\n^ No data reports pushed`)
    }
    process.stdout.write(` between blocks ${helpers.commas(fromBlock)} and ${helpers.commas(toBlock)}.\n`)
}

function traceData (header, data, width, color) {
    process.stdout.write(header)
    if (color) process.stdout.write(color)
    for (let ix = 0; ix < data.length / width; ix++) {
        if (ix > 0) process.stdout.write(" ".repeat(header.length))
        process.stdout.write(data.slice(width * ix, width * (ix + 1)))
        process.stdout.write("\n")
    }
    if (color) process.stdout.write("\x1b[0m")
}
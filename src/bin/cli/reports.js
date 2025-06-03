const helpers = require("../helpers")
const { WitOracle } = require("../../../dist/src/lib")

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
    console.info(`> ${helpers.colors.lwhite(artifact)}: ${helpers.colors.lblue(address)} (${version})`)
    
    const toBlock = BigInt(options?.toBlock || await witOracle.provider.getBlockNumber())
    const fromBlock = BigInt(options?.fromBlock || toBlock - 1024n)

    const logs = await witOracle.filterWitOracleReportEvents({
        fromBlock,
        toBlock,
        where: {
            evmOrigin: options?.signer,
            evmRequester: options['filter-requester'],
            queryRadHash: options['filter-radHash'],
        },
    })

    if (logs.length > 0) {
        helpers.traceTable(
            logs.map((log, index) => [ 
                log.evmBlockNumber,
                log.evmTransactionHash,
                `${log.evmOrigin.slice(0, 7)}..${log.evmOrigin.slice(-5)}`,
                `${log.evmRequester.slice(0, 7)}..${log.evmRequester.slice(-5)}`,
                helpers.colors.mgreen(`${log.witDrTxHash?.slice(2).slice(0, 6)}..${log.witDrTxHash.slice(-6)}`),
                helpers.colors.green(`[ ${Object.values(log.witDrTxParams).join(", ")} ]`),
                log.witResultStatus,
            ]), 
            {
                colors: [ 
                    helpers.colors.lwhite, 
                    helpers.colors.white,
                    helpers.colors.gray,
                    helpers.colors.gray,
                    ,, 
                    helpers.colors.yellow,
                    helpers.colors.myellow,
                    helpers.colors.mcyan,
                ],
                headlines: [ 
                    "EVM BLOCK:", 
                    "EVM TRANSACTION HASH",
                    "EVM TX SIGNER",
                    "EVM REQUESTER",
                    "WIT QUERY RAD HASH", 
                    "WIT QUERY PARAMS",
                    "WIT RESULT STATUS",
                ],
                humanizers: [ helpers.commas,,,,,, ],
            }
        )
        process.stdout.write(`^ Showing ${logs.length} push data reports`)
    } else {
        process.stdout.write(`> No data reports pushed`)
    }
    process.stdout.write(` between blocks ${helpers.commas(fromBlock)} and ${helpers.commas(toBlock)}.\n`)
}

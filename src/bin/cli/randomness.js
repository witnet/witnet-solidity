const ethers = require("ethers")
const helpers = require("../helpers")
const moment = require("moment")
const prompt = require("inquirer").createPromptModule()
const { WitOracle } = require("../../../dist/src/lib")

module.exports = async function (options = {}, args = []) {

    [args, ] = helpers.deleteExtraFlags(args)
        
    const witOracle = await WitOracle.fromJsonRpcUrl(
        `http://127.0.0.1:${options?.port || 8545}`,
        options?.signer,
    );

    const { network } = witOracle
    helpers.traceHeader(`${network.toUpperCase()}`, helpers.colors.lcyan)
    const framework = helpers.getNetworkAddresses(network)

    let target = args[0]
    if (!target) {
        const contracts = Object.fromEntries(Object.entries(framework?.apps).filter(([key]) => key.startsWith(`WitRandomness`)))
        if (Object.keys(contracts).length === 1) {
            target = Object.values(contracts)[0]
        } else {
            const selection = await prompt([{
                choices: Object.values(contracts),
                message: "Select EVM contract address ... ",
                name: "addr",
                type: "rawlist",
            }])
            target = selection.addr
        }
    }
    const randomizer = await witOracle.getWitRandomnessAt(target)
    const artifact = await randomizer.getEvmImplClass()
    const version = await randomizer.getEvmImplVersion()
    const maxWidth = Math.max(18, artifact.length + 2)
    console.info(`> ${helpers.colors.lwhite(artifact)}:${" ".repeat(maxWidth - artifact.length)}${helpers.colors.lblue(target)} (${version})`)
    if (options?.randomize) {
        const receipt = await randomizer.randomize({
            evmConfirmations: options?.confirmations || 1,
            evmGasPrice: options?.gasPrice,
            evmTimeout: options?.timeout,
            witCommitteeSize: options?.witnesses,
            onRandomizeTransaction: (txHash) => {
                console.info(`> EVM signer:${" ".repeat(maxWidth - 10)}${helpers.colors.gray(randomizer.signer.address)}`)
                process.stdout.write(`> EVM transaction:${" ".repeat(maxWidth - 15)}${helpers.colors.gray(txHash)} ... `)        
            },
            onRandomizeTransactionReceipt: () => {
                process.stdout.write(`${helpers.colors.lwhite("OK")}\n`)
            }
        }).catch(err => {
            process.stdout.write(`${helpers.colors.mred("FAIL")}`); 
            console.error(err)
            throw err
        })
        if (receipt) {
            console.info(`> EVM block number:${" ".repeat(maxWidth - 16)}${helpers.colors.lwhite(helpers.commas(receipt?.blockNumber))}`)
            console.info(`> EVM tx gas price:${" ".repeat(maxWidth - 16)}${helpers.colors.lwhite(helpers.commas(receipt?.gasPrice))} weis`)
            console.info(`> EVM tx fee:${" ".repeat(maxWidth - 10)}${helpers.colors.lwhite(ethers.formatEther(receipt.fee))} ETH`);
            console.info(`> EVM randomize fee:${" ".repeat(maxWidth - 17)}${helpers.colors.lwhite(ethers.formatEther((await receipt.getTransaction()).value))} ETH`);
        }
    }

    const history = await randomizer.getRandomizeHistory(options?.depth || 16)
    helpers.traceTable(
        history.map(item => [
            item.evmBlockNumber,
            item.evmRandomizeStatus === "Error" ? helpers.colors.mred("Error") : (
                item.evmRandomizeStatus === "Ready" 
                    ? helpers.colors.green("Ready") 
                    : helpers.colors.yellow(item.evmRandomizeStatus)
                ),
            helpers.colors.mgreen(item?.witResult?.slice(2) || ""),
            item?.witResultDrTxHash ? helpers.colors.cyan(item.witResultDrTxHash.slice(2)) : "",
            item?.witResultTimestamp ? helpers.colors.mcyan(moment.unix(Number(item.witResultTimestamp)).fromNow()) : "",
        ]).reverse(), {
            colors: [ helpers.colors.lwhite, ],
            headlines: [ "EVM BLOCK:", ":STATUS", "RANDOMIZE RESULT", "WIT/RNG TX HASH", "WIT/TIMESTAMP"],
            humanizers: [ helpers.commas,,,, ],
    })
}

import { ContractTransactionReceipt, TransactionReceipt } from "ethers"
import { abiEncodeDataPushReport } from "../utils"
import { DataPushReport } from "../types"
import { WitAppliance } from "./WitAppliance"
import { WitOracle } from "./WitOracle"

export class WitOracleConsumer extends WitAppliance {

    protected constructor (witOracle: WitOracle, target: string) {
        super(witOracle, "WitOracleConsumer", target)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitOracleConsumer> {
        const consumer = new WitOracleConsumer(witOracle, target)
        const consumerWitOracleAddr = await consumer.contract.witOracle.staticCall()
        if (consumerWitOracleAddr !== witOracle.address) {
            throw new Error(`${this.constructor.name} at ${target}: mismatching Wit/Oracle address (${consumerWitOracleAddr})`)
        }
        return consumer
    }

    public async pushDataReport(report: DataPushReport, options?: { 
        confirmations?: number, 
        gasPrice?: bigint,
        gasLimit?: bigint,
        onDataPushReportTransaction?: (txHash: string) => any,
        timeout?: number,
    }): Promise<ContractTransactionReceipt | TransactionReceipt | null> {
        return this.contract
            .pushDataReport
            .populateTransaction(abiEncodeDataPushReport(report), report?.evm_proof)
            .then(tx => {
                tx.gasPrice = options?.gasPrice || tx?.gasPrice 
                tx.gasLimit = options?.gasLimit || tx?.gasLimit
                return this.signer.sendTransaction(tx)
            })
            .then(response => {
                if (options?.onDataPushReportTransaction) options.onDataPushReportTransaction(response.hash);
                return response.wait(options?.confirmations || 1, options?.timeout)
            })
    }
}   


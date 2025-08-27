import { Witnet } from "@witnet/sdk"

export type DataPushReport = Witnet.GetDataRequestEtherealReport & { evm_proof?: Witnet.HexString }

export type PriceFeed = {
    id: string,
    exponent: number,
    symbol: string,
    mapper?: PriceFeedMapper,
    oracle?: PriceFeedOracle,
    updateConditions?: PriceFeedUpdateConditions,
    lastUpdate?: PriceFeedUpdate,
}

export type PriceFeedMapper = {
    algorithm: string,
    description: string,
    dependencies: Array<string>,
}

export type PriceFeedOracle = {
    address: string,
    name: string,
    dataBytecode?: Witnet.HexString,
    dataSources: Witnet.Hash,
    interfaceId: Witnet.HexString,
}

export type PriceFeedUpdate = {
    delta1000?: BigInt,
    exponent?: number,
    timestamp: BigInt,
    trackHash: Witnet.Hash,
    value: number,
}

export type PriceFeedUpdateConditions = {
    computeEMA: boolean,
    cooldownSecs: number,
    heartbeatSecs: number,
    maxDeviation1000: number,
}

export type RandomizeStatus = "Void" | "Awaiting"  | "Finalizing" | "Ready" | "Error"
export { TransactionReceipt } from "ethers"

export type WitOracleQueryParams = {
    /**
     * Maximum expected size of the CBOR-encoded query result, once solved by the Witnet blockchain.
     */
    resultMaxSize?: number,
    /**
     * Mininum reward in $nanoWIT for very validator that positively contributes to get the Wit/Oracle
     * query attended, solved and stored into the Witnet blockchain. 
     */
    unitaryReward: bigint,
    /**
     * Maximum number of witnessing nodes required to participate in solving the oracle query. 
     */
    witnesses: number,
}
export type WitOracleQueryResponse = {
    disputer?: string,
    reporter?: string,
    resultTimestamp?: number,
    resultDrTxHash: Witnet.Hash,
    resultCborBytes: Witnet.HexString,
}

export type WitOracleQueryStatus = "Void" | "Posted" | "Reported" | "Finalized" | "Delayed" | "Expired" | "Disputed";
export type WitOracleResultDataTypes = "any" | "array" | "boolean" | "bytes" | "float" | "integer" | "map" | "string";

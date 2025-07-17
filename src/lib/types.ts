import { Witnet } from "@witnet/sdk"

/**
 * Contains information about the resolution of some Data Request Transaction in the Witnet blockchain.
 */
export type DataPushReport = {
    /**
     * Unique hash of the Data Request Transaction that produced the outcoming result. 
     */
    drTxHash: Witnet.Hash,
    /**
     * RAD hash of the Radon Request being solved.
     */
    queryRadHash: Witnet.Hash,
    /**
     * SLA parameters required to be fulfilled by the Witnet blockchain. 
     */
    queryParams: WitOracleQueryParams,
    /**
     * Timestamp when the data sources where queried and the contained result produced.
     */
    resultTimestamp: number,
    /**
     * CBOR-encoded buffer containing the actual result data to some query as solved by the Witnet blockchain. 
     */
    resultCborBytes: Witnet.HexString,
}

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

export type WitOracleQueryParams = {
    /**
     * Maximum expected size of the CBOR-encoded query result, once solved .
     */
    resultMaxSize?: number,
    /**
     * Mininum reward in $WIT coins to pay to every validator that positively contributed to get the Wit/Oracle
     * query attended, solved and stored into the Witnet blockchain. 
     */
    unitaryReward: Witnet.Coins,
    /**
     * Maximum number of witnessing nodes required to participate in solving the oracle query. 
     */
    witnesses: number,
}

export type WitOracleQueryStatus = "Void" | "Posted" | "Reported" | "Finalized" | "Delayed" | "Expired" | "Disputed";

export type ResultDataTypes = "any" | "array" | "boolean" | "bytes" | "float" | "integer" | "map" | "string";
export type RandomizeStatus = "Void" | "Awaiting"  | "Finalizing" | "Ready" | "Error"

export { TransactionReceipt } from "ethers"

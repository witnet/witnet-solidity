import * as cbor from "cbor"
import { Witnet } from "@witnet/sdk"

import {
    ABIs as _ABIs,
    supportedEcosystems as _supportedEcosystems,
    supportedNetworks as _supportedNetworks,
} from "witnet-solidity-bridge"

import { 
    getNetworkAddresses as _getNetworkAddresses, 
    getNetworkConstructorArgs as _getNetworkConstructorArgs,
} from "../bin/helpers"

import { PushDataReport, QuerySLA, QueryStatus } from "./types"

export const ABIs = _ABIs;

export function getNetworkAddresses(network: string): any {
    return _getNetworkAddresses(network)
}

export function getNetworkByChainId(chainId: number): string | undefined {
    const found = Object.entries(getSupportedNetworks()).find(([, config]) => config.network_id.toString() === chainId.toString())
    if (found) return found[0];
    else return undefined;
}

export function abiDecodeQueryStatus(status: bigint): QueryStatus {
    switch (status) {
        case 1n: return "Posted";
        case 2n: return "Reported";
        case 3n: return "Finalized";
        case 4n: return "Delayed";
        case 5n: return "Expired";
        case 6n: return "Disputed";
        default: return "Void";
    }
}

export function abiDecodePriceFeedMappingAlgorithm(algorithm: bigint): string {
    switch (algorithm) {
        case 1n: return "Fallback";
        case 2n: return "Hottest";
        case 3n: return "Product";
        default: return "None";
    }
}

export function abiEncodeDataPushReport(report: PushDataReport): any {
    return [
        // todo: ...
        report.resultCborBytes,
    ]
}

export function abiEncodeQuerySLA(witQuerySLA: QuerySLA): any {
    return [
        witQuerySLA.witResultMaxSize,
        witQuerySLA.witCommitteeSize,
        witQuerySLA.witInclusionFees,
    ]
}

export function abiEncodeRadonAsset(asset: any): any {    
    if (asset instanceof Witnet.Radon.RadonRetrieval) {
        return [
            asset.method,
            asset.url || "",
            asset.body || "",
            asset?.headers ? Object.entries(asset.headers) : [],
            abiEncodeRadonAsset(asset.script) || "0x80",
        ]
    
    } else if (asset instanceof Witnet.Radon.types.RadonScript) {
        return asset.toBytecode()
    
    } else if (asset instanceof Witnet.Radon.reducers.Class) {
        return [
            asset.opcode,
            asset.filters?.map(filter => abiEncodeRadonAsset(filter)) || [],
        ]
    
    } else if (asset instanceof Witnet.Radon.filters.Class) {
        return [
            asset.opcode,
            `0x${asset.args ? cbor.encode(asset.args).toString("hex"): ""}`
        ]

    } else {
        throw new TypeError(`Not a Radon asset: ${asset}`)
    }
}

export function decodeCborBytes(_cborBytes: Witnet.HexString): any {}

export function getSupportedEcosystems(): string[] {
    return _supportedEcosystems()
}

export function getSupportedNetworks(): Object {
    return _supportedNetworks()
}

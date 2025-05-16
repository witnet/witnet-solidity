import * as cbor from "cbor"
import {
    ABIs as _ABIs,
    supportedEcosystems as _supportedEcosystems,
    supportedNetworks as _supportedNetworks,
    supportsNetwork as _supportsNetwork
} from "witnet-solidity-bridge"

import { Witnet } from "witnet-toolkit"
import { parseRadonScript } from "witnet-toolkit/utils"

export { ABIs } from "witnet-solidity-bridge"
export { getNetworkAddresses, getNetworkConstructorArgs } from "../bin/helpers"

export function getNetworkName(chainId: number): string | undefined {
    const found = Object.entries(supportedNetworks()).find(([, config]) => config.network_id.toString() === chainId.toString())
    if (found) return found[0];
    else return undefined;
}

export function encodeRadonAsset(asset: any): any {    
    if (asset instanceof Witnet.Radon.RadonRetrieval) {
        return [
            asset.method,
            asset.url || "",
            asset.body || "",
            asset.headers || [],
            encodeRadonAsset(asset.script) || "0x80",
        ]
    
    } else if (asset instanceof Witnet.Radon.types.RadonScript) {
        return asset.toBytecode()
    
    } else if (asset instanceof Witnet.Radon.reducers.Class) {
        return [
            asset.opcode,
            asset.filters?.map(filter => encodeRadonAsset(filter)) || [],
        ]
    
    } else if (asset instanceof Witnet.Radon.filters.Class) {
        return [
            asset.opcode,
            `0x${asset.args ? cbor.encode(asset.args).toString("hex"): ""}`
        ]

    } else {
        return null
    }
}

export function supportedEcosystems(): string[] {
    return _supportedEcosystems()
}

export function supportedNetworks(): Object {
    return _supportedNetworks()
}

export function supportsNetwork(network: string): boolean {
    return _supportsNetwork(network)
}

import { Contract, ContractRunner, JsonRpcSigner, Result } from "ethers"
import { getNetworkAddresses } from "../bin/helpers"

export namespace core {
    
    export class WitOracleReporter {
        public static from(network: string, runner: ContractRunner): WitOracleReporter {
            return new WitOracleReporter(network, runner)
        }
        
        public readonly contract: Contract;
        
        constructor (network: string, runner: ContractRunner) {
            const target = getNetworkAddresses(network)
            if (!target) {
                throw new Error(`${this.constructor.name}: not available on EVM network ${network}.`)
            } else {
                this.contract = new Contract(target, _ABIs.WitOracle, runner)
            }
        }
    }
    
    export class WitOracleRadonRegistry {
        public static from(network: string, signer: JsonRpcSigner): WitOracleRadonRegistry {
            return new WitOracleRadonRegistry(network, signer)
        }
        
        public readonly contract: Contract;
        public readonly network: string;

        constructor (network: string, signer: JsonRpcSigner) {
            const target = getNetworkAddresses(network)?.core?.WitOracleRadonRegistry
            if (!target) {
                throw new Error(`${this.constructor.name}: not available on EVM network: ${network}`)
            } else {
                this.contract = new Contract(target, _ABIs.WitOracleRadonRegistry, signer as ContractRunner)
            }
             this.network = network
        }
        
        public async lookupRadonRequest(radHash: string): Promise<Witnet.Radon.RadonRequest> {
            return this.contract
                .getFunction("lookupRadonRequest(bytes32)")
                .staticCall(radHash)
                .then((result: Result) => {
                    const [ retrievals, aggregate, tally ] = result
                    const request = new Witnet.Radon.RadonRequest({
                        sources: retrievals.map((retrieve: any[]) => new Witnet.Radon.RadonRetrieval({
                            method: retrieve[1],
                            url: retrieve[3],
                            body: retrieve[4],
                            headers: Object.fromEntries(retrieve[5]),
                            script: parseRadonScript(retrieve[6])
                        })),
                        sourcesReducer: new Witnet.Radon.reducers.Class(aggregate[0], aggregate[1]?.map(
                            (filter: any[]) => new Witnet.Radon.filters.Class(filter[0], filter[1])
                        )),
                        witnessReducer: new Witnet.Radon.reducers.Class(tally[0], tally[1]?.map(
                            (filter: any[]) => new Witnet.Radon.filters.Class(filter[0], filter[1])
                        )),
                    })
                    return request
                })
        }

        public async lookupRadonRetrieval(hash: string): Promise<Witnet.Radon.RadonRetrieval> {
            return this.contract
                .getFunction("lookupRadonRetrieval(bytes32)")
                .staticCall(hash)
                .then((result: Result) => {
                    return new Witnet.Radon.RadonRetrieval({
                        method: result[1],
                        url: result[3],
                        body: result[4],
                        headers: Object.fromEntries(result[5]),
                        script: parseRadonScript(result[6]),
                    })
                })
        }

        public async lookupRadonRetrievalHash(retrieval: Witnet.Radon.RadonRetrieval): Promise<string> {
            return this.contract
                .getFunction("verifyRadonRetrieval(uint8,string,string,string[2][],bytes)")
                .staticCall(...encodeRadonAsset(retrieval))
        }
        
        public async verifyRadonRequest(request: Witnet.Radon.RadonRequest): Promise<string> {
            const retrievals = await Promise.all(
                request.sources.map(async retrieval => await this.verifyRadonRetrieval(retrieval))
            );
            const radHash = request.radHash
            await this.lookupRadonRequest(radHash)
                .catch(async () => {
                    const aggregate = encodeRadonAsset(request.sourcesReducer)
                    const tally = encodeRadonAsset(request.witnessReducer)
                    this.contract
                        .getFunction("verifyRadonRequest(bytes32[],(uint8,(uint8,bytes)[]),(uint8,(uint8,bytes)[]))")
                        .send(
                            retrievals,
                            aggregate,
                            tally,
                        )
                })
            return radHash
        }
        
        public async verifyRadonRetrieval(retrieval: Witnet.Radon.RadonRetrieval): Promise<string> {
            return this.lookupRadonRetrievalHash(retrieval)
                .then(async hash => {
                    await this.lookupRadonRetrieval(hash)
                        .catch(async () => {
                            this.contract
                                .getFunction("verifyRadonRetrieval(uint8,string,string,string[2][],bytes)")
                                .send(...encodeRadonAsset(retrieval))
                        })
                    return hash
                })
        }
    }
    
    export class WitOracleRequestFactory {
        public static from(network: string, runner: ContractRunner): WitOracleRequestFactory {
            return new WitOracleRequestFactory(network, runner)
        }
        
        public readonly contract: Contract;
        constructor (network: string, runner: ContractRunner) {
            const target = getNetworkAddresses(network)
            if (!target) {
                throw new Error(`${this.constructor.name}: not available on EVM network ${network}.`)
            } else {
                this.contract = new Contract(target, _ABIs.WitOracleRadonRegistry, runner)
            }
        }
    }
}

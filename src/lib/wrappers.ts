import { 
    AbiCoder,
    BlockTag,
    Contract, 
    ContractRunner,
    ContractTransaction, 
    ContractTransactionReceipt, 
    EventLog,
    Interface, 
    InterfaceAbi, 
    JsonRpcApiProvider,
    JsonRpcProvider, 
    JsonRpcSigner,
    Result,
    TransactionReceipt,
} from "ethers"

import { utils, Witnet } from "@witnet/sdk"

import {
    ABIs,
    abiDecodePriceFeedMappingAlgorithm,
    abiDecodeQueryStatus,
    abiEncodeDataPushReport,
    abiEncodeWitOracleQueryParams,
    abiEncodeRadonAsset,
    getEvmNetworkAddresses,
    getEvmNetworkByChainId,
} from "./utils"

import { 
    PriceFeed,
    PriceFeedUpdate,
    DataPushReport, 
    RandomizeStatus,
    WitOracleQuery,
    WitOracleQueryParams, 
    WitOracleQueryResponse,
    WitOracleQueryStatus, 
    WitOracleResultDataTypes 
} from "./types"

abstract class ContractWrapper {

    constructor (signer: JsonRpcSigner, network: string, abi: Interface | InterfaceAbi, target: string) {
        this.address = target
        this.contract = new Contract(target, abi, signer as ContractRunner)
        this.network = network
        this.provider = signer.provider
        this.signer = signer
    }

    /**
     * The address of the underlying Wit/Oracle Framework artifact.
     */
    public readonly address: string;

    /**
     * The underlying Ethers' contract wrapper.
     */
    public readonly contract: Contract;
    
    /**
     * The EVM network currently connected to.
     */
    public readonly network: string;

    /**
     * The ETH/RPC provider used of contract interactions.
     */
    public readonly provider: JsonRpcApiProvider;

    /**
     * The EVM address that will sign contract interaction transactions, when required.
     */
    public readonly signer: JsonRpcSigner;

    /**
     * Name of the underlying logic implementation contract. 
     * @returns Contract name.
     */
    public async getEvmImplClass(): Promise<string> {
        return this.contract
            .getFunction("class()")
            .staticCall()
    }

    /**
     * Get specs identifier of the underlying logic implementation contract.
     * @returns 4-byte hex string. 
     */
    public async getEvmImplSpecs(): Promise<string> {
        return this.contract
            .getFunction("specs()")
            .staticCall()
    }

    /**
     * Version tag of the underlying logic implementation contract. 
     * @returns Version tag. 
     */
    public async getEvmImplVersion(): Promise<string> {
        let version
        try {
            version = await this.provider
                .call({
                    to: this.address,
                    data: "0x54fd4d50", // funcSig for 'version()'
                })
                .then(result => AbiCoder.defaultAbiCoder().decode(["string"], result))
                .then(result => result.toString());
        } catch (_err) {
            return "(immutable)"
        }
        return version
    }
}

abstract class WitArtifactWrapper extends ContractWrapper {

    constructor (signer: JsonRpcSigner, network: string, artifact: string, at?: string) {
        const abis: Record<string, Interface | InterfaceAbi> = ABIs
        const target = at || getEvmNetworkAddresses(network)?.core[artifact]
        if (!abis[artifact] || !target) {
            throw new Error(`EVM network ${network} => artifact is not available: ${artifact}`)
        } else {
            super(signer, network, abis[artifact], target)
        }
    }
}

abstract class WitApplianceWrapper extends ContractWrapper {
    
    public readonly witOracle: WitOracle

    constructor (witOracle: WitOracle, artifact: string, at?: string) {
        const abis: Record<string, Interface | InterfaceAbi> = ABIs
        const addresses = getEvmNetworkAddresses(witOracle.network)
        const target = at || addresses?.core[artifact] || addresses?.apps[artifact]
        if (!abis[artifact] || !target) {
            throw new Error(`EVM network ${witOracle.network} => artifact not available: ${artifact}`)
        } 
        super(witOracle.signer, witOracle.network, abis[artifact], target)
        this.witOracle = witOracle
    }
}

/**
 * Wrapper class for the Wit/Oracle contract as deployed in some specified EVM network.
 * It provides wrappers to other main artifacts of the Wit/Oracle Framework, as well
 * as factory methods for wrapping existing `WitOracleRadonRequestTemplate` and `WitOracleConsumer`
 * compliant contracts, provably bound to the Wit/Oracle core contract. 
 * 
 */
export class WitOracle extends WitArtifactWrapper {
    
    constructor (signer: JsonRpcSigner, network: string) {
        super(signer, network, "WitOracle")
    }

    /**
     * Create a WitOracle attached to the Wit/Oracle main address on the connected EVM network.
     * Fails if the EVM network served at the specified JSON ETH/RPC endpoint, is not currently bridged 
     * to the Witnet blockchain. 
     * @param url ETH/RPC endpoint URL.
     * @param signer Specific signer address, other than default, to use for signing EVM transactions. 
     */
    public static async fromJsonRpcUrl(url: string, signerId?: number | string): Promise<WitOracle> {
        const provider = new JsonRpcProvider(url)
        const signer = await provider.getSigner(signerId)
        const chainId = Number((await provider.getNetwork()).chainId)
        const network = getEvmNetworkByChainId(chainId)
        if (!network) {
            throw new Error(`WitOracle: unsupported chain id: ${chainId}`)
        }
        return new WitOracle(signer, network)
    }

    public async estimateBaseFee(evmGasPrice: bigint): Promise<bigint> {
        return this.contract
            .getFunction("estimateBaseFee(uint256)")
            .staticCall(evmGasPrice)
    }

    public async estimateBaseFeeWithCallback(evmGasPrice: bigint, evmCallbackGas: number): Promise<bigint> {
        return this.contract
            .getFunction("estimateBaseFeeWithCallback(uint256,uint24)")
            .staticCall(evmGasPrice, evmCallbackGas)
    }

    public async estimateExtraFee(evmGasPrice: bigint, evmWitPrice: bigint, queryParams: WitOracleQueryParams): Promise<bigint> {
        return this.contract
            .getFunction("estimateExtraFee(uint256,uint256,(uint16,uint16,uint64)")
            .staticCall(
                evmGasPrice,
                evmWitPrice,
                abiEncodeWitOracleQueryParams(queryParams),
            )
    }
    
    public async filterWitOracleQueryEvents(options: {
        fromBlock: BlockTag,
        toBlock?: BlockTag,
        where?: {
            evmRequester?: string,
            queryRadHash?: Witnet.Hash,
        }
    }): Promise<Array<{
        evmBlockNumber: bigint,
        evmRequester: string,
        evmTransactionHash: string,
        queryId: bigint,
        queryRadHash: Witnet.Hash,
        queryParams: WitOracleQueryParams
    }>> {
        const witOracleQueryEvent = this.contract.filters["WitOracleQuery(address indexed,uint256,uint256,uint64,bytes32,(uint16,uint16,uint64))"](options?.where?.evmRequester)
        return this.contract
            .queryFilter(witOracleQueryEvent, options.fromBlock, options?.toBlock)
            .then(logs => logs.filter(log => 
                !log.removed
                // && (!options?.where?.evmRequester || (log as EventLog).args?.requester === options.where.evmRequester)
                && (!options?.where?.queryRadHash || (log as EventLog).args?.radonHash.indexOf(options.where.queryRadHash) >= 0)
            ))
            .then(logs => logs.map(log => ({
                evmBlockNumber: BigInt(log.blockNumber),
                evmRequester: (log as EventLog).args?.evmRequester as string,
                evmTransactionHash: log.transactionHash,
                queryId: BigInt((log as EventLog).args.queryId),
                queryRadHash: (log as EventLog).args.radonHash as Witnet.Hash,
                queryParams: {
                    witnesses: (log as EventLog).args.radonParams[1] as number,
                    unitaryReward: BigInt((log as EventLog).args.radonParams[2]),
                    resultMaxSize: (log as EventLog).args.radonParams[0] as number,
                } as WitOracleQueryParams,
            })))
    }

    public async filterWitOracleReportEvents(options: {
        fromBlock: BlockTag,
        toBlock?: BlockTag,
        where?: {
            evmOrigin?: string,
            evmConsumer?: string,
            queryRadHash?: Witnet.Hash
        }
    }): Promise<Array<{
        evmBlockNumber: bigint,
        evmOrigin: string,
        evmConsumer: string,
        evmReporter: string,
        evmTransactionHash: string,
        witDrTxHash: Witnet.Hash,
        queryRadHash: Witnet.Hash,
        queryParams: WitOracleQueryParams,
        resultCborBytes: Witnet.HexString,
        resultTimestamp: number,
    }>> {
        const witOracleReportEvent = this.contract.filters.WitOracleReport(
            options?.where?.evmOrigin, 
            options?.where?.evmConsumer,
        );
        return this.contract
            .queryFilter(witOracleReportEvent, options.fromBlock, options?.toBlock)
            .then(logs => logs.filter(log => 
                !log.removed
                && (!options?.where?.queryRadHash || (log as EventLog).args?.queryRadHash.indexOf(options.where.queryRadHash) >= 0)
            ))
            .then(logs => logs.map(log => ({
                evmBlockNumber: BigInt(log.blockNumber),
                evmOrigin: (log as EventLog).args.evmOrigin,
                evmConsumer: (log as EventLog).args.evmConsumer,
                evmReporter: (log as EventLog).args.evmReporter,
                evmTransactionHash: log.transactionHash,
                witDrTxHash: (log as EventLog).args.witDrTxHash,
                queryRadHash: (log as EventLog).args.queryRadHash,
                queryParams: {
                    witnesses: (log as EventLog).args.queryParams[1] as number,
                    unitaryReward: BigInt((log as EventLog).args.queryParams[2]),
                    resultMaxSize: (log as EventLog).args.queryParams[0] as number,
                },
                resultCborBytes: (log as EventLog).args.resultCborBytes,
                resultTimestamp: Number((log as EventLog).args.resultTimestamp),
            })))
    }

    public async getEvmChainId(): Promise<number> {
        return this.provider.getNetwork().then(network => Number(network.chainId))
    }

    public async getEvmChannel(): Promise<Witnet.HexString> {
        return this.contract
            .getFunction("channel()")
            .staticCall()
    }

    public async getNextQueryId(): Promise<bigint> {
        return this.contract
            .getFunction("getNextQueryId()")
            .staticCall()
    }

    public async getQuery(queryId: bigint): Promise<WitOracleQuery> {
        return this.contract
            .getQuery
            .staticCall(queryId)
            .then(result => ({
                checkpoint: BigInt(result[5]),
                hash: result[3],
                params: {
                    resultMaxSize: result[2][0],
                    unitaryReward: result[2][2],
                    witnesses: result[2][1],
                },
                request: {
                    callbackGas: Number(result[0][1]),
                    radonHash: result[0][4],
                    requester: result[0][0],
                },
                response: {
                    disputer: result[1][5],
                    reporter: result[1][0],
                    resultTimestamp: Number(result[1][2].toString()),
                    resultDrTxHash: result[1][3],
                    resultCborBytes: result[1][4],
                },
            }));
    }

    public async getQueryResponse(queryId: bigint): Promise<WitOracleQueryResponse> {
        return this.contract
            .getQueryResponse
            .staticCall(queryId)
            .then(result => ({
                disputer: result[5],
                reporter: result[0],
                resultTimestamp: Number(result[2].toString()),
                resultDrTxHash: result[3],
                resultCborBytes: result[4],
            }));
    }

    public async getQueryResultStatusDescription(queryId: bigint): Promise<string> {
        let reason 
        try {
            try { reason = await this.contract.getQueryResultStatusDescription.staticCall(queryId)
            } catch { 
                const legacy = new Contract(this.address, [
                    "function getQueryResultError(uint256) public view returns ((uint8,string))",
                ], this.signer)
                reason = await legacy.getQueryResultError.staticCall(queryId).then(result => result[1])
            }
        } catch {
            reason = "(unparsable error)"
        }
        return reason
    }

    public async getQueryStatuses(queryIds: bigint[]): Promise<Array<WitOracleQueryStatus>> {
        return this.contract
            .getQueryStatusBatch
            .staticCall(queryIds)
            .then((statuses: Array<bigint>) => statuses.map(value => abiDecodeQueryStatus(value)))
    }

    public async getWitOracleConsumerAt(target: string): Promise<WitOracleConsumer> {
        return WitOracleConsumer.at(this, target)
    }

    /**
     * Wrapper class for the Wit/Oracle Radon Registry core contract as deployed in some supported EVM network.
     * It allows formal verification of Radon Requests and Witnet-compliant data sources into such network, 
     * as to be securely referred on both Wit/Oracle queries pulled from within smart contracts, 
     * or Wit/Oracle query results pushed into smart contracts from offchain workflows.
     */
    public async getWitOracleRadonRegistry(): Promise<WitOracleRadonRegistry> {
        return new WitOracleRadonRegistry(this.signer, this.network)
    }

    /**
     * Wrapper class for the Wit/Oracle Request Factory core contract as deployed in some supported EVM network.
     * It allows construction of `WitOracleRadonRequestTemplate` minimal-proxy contracts out of one ore more
     * parameterized Radon Retievals (Witnet-compliant data sources). Template addresses are counter-factual to
     * the set of data sources they are built on. 
     */
    public async getWitOracleRadonRequestFactory(): Promise<WitOracleRadonRequestFactory> {
        return WitOracleRadonRequestFactory.deployed(this, await this.getWitOracleRadonRegistry())
    }

    /**
     * Wrapper class for Wit/Oracle Radon Template artifacts as deployed in some supported EVM network.
     * `IWitOracleRadonRequestTemplate` contracts enable smart contracts to formally verify Radon Requests 
     * built out out of a set of parameterized Witnet-compliant data sources, on the fly. 
     */
    public async getWitOracleRadonRequestTemplateAt(target: string): Promise<WitOracleRadonRequestTemplate> {
        return WitOracleRadonRequestTemplate.at(this, target)
    }

    /**
     * Wrapper class for Wit/Oracle Radon Modal artifacts as deployed in some supported EVM network.
     * `IWitOracleRadonRequestModal` contracts enable smart contracts to formally verify Radon Requests 
     * built out out of a single Radon Retrieval and multiple data providers, all of them expected to 
     * provided exactly the same data.
     */
    public async getWitOracleRadonRequestModalAt(target: string): Promise<WitOracleRadonRequestModal> {
        return WitOracleRadonRequestModal.arguments(this, target)
    }

    public async getWitPriceFeedsAt(target: string): Promise<WitPriceFeeds> {
        return WitPriceFeeds.at(this, target)
    }

    public async getWitPriceFeedsLegacyAt(target: string): Promise<WitPriceFeedsLegacy> {
        return WitPriceFeedsLegacy.at(this, target)
    }

    public async getWitRandomnessAt(target: string): Promise<WitRandomness> {
        return WitRandomness.at(this, target)
    }
}

class WitOracleConsumer extends WitApplianceWrapper {

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

/**
 * Wrapper class for the Wit/Oracle Radon Registry core contract as deployed in some supported EVM network.
 * It allows formal verification of Radon Requests and Witnet-compliant data sources into such network, 
 * as to be securely referred on both Wit/Oracle queries pulled from within smart contracts, 
 * or Wit/Oracle query results pushed into smart contracts from offchain workflows.
 */
class WitOracleRadonRegistry extends WitArtifactWrapper {

    constructor (signer: JsonRpcSigner, network: string) {
        super(signer, network, "WitOracleRadonRegistry")
    }

    /// ===========================================================================================================
    /// --- IWitOracleRadonRegistry -------------------------------------------------------------------------------

    /**
     * Determines the unique hash that would identify the given Radon Retrieval, if it was
     * formally verified into the connected EVM network. 
     * @param retrieval Instance of a Radon Retrieval object.
     */
    public async determineRadonRetrievalHash(retrieval: Witnet.Radon.RadonRetrieval): Promise<string> {
        return this.contract
            .getFunction("verifyRadonRetrieval(uint8,string,string,string[2][],bytes)")
            .staticCall(...abiEncodeRadonAsset(retrieval))
            .then(hash => {
                return hash.slice(2)
            })
    }
    
    /**
     * Returns information related to some previously verified Radon Request, on the connected EVM network.
     * @param radHash The RAD hash that uniquely identifies the Radon Request.
     */
    public async lookupRadonRequest(radHash: string): Promise<Witnet.Radon.RadonRequest> {
        return this.contract
            .getFunction("lookupRadonRequestBytecode(bytes32)")
            .staticCall(`0x${radHash}`)
            .then(bytecode => Witnet.Radon.RadonRequest.fromBytecode(bytecode))
    }

    /**
     * Returns the bytecode of some previously verified Radon Request, on the connected EVM network.
     * @param radHash The RAD hash that uniquely identifies the Radon Request.
     */
    public async lookupRadonRequestBytecode(radHash: string): Promise<Witnet.HexString> {
        return this.contract
            .getFunction("lookupRadonRequestBytecode(bytes32)")
            .staticCall(`${radHash.startsWith("0x") ? radHash : `0x${radHash}`}`)
    }

    /**
     * Returns information about some previously verified Radon Retrieval on the connected EVM network.
     * This information includes retrieval the method, URL, body, headers and the Radon script in charge 
     * to transform data before delivery, on the connected EVM network.
     * @param radHash The RAD hash that uniquely identifies the Radon Request.
     */
    public async lookupRadonRetrieval(hash: string): Promise<Witnet.Radon.RadonRetrieval> {
        return this.contract
            .getFunction("lookupRadonRetrieval(bytes32)")
            .staticCall(`0x${hash}`)
            .then((result: Result) => {
                return new Witnet.Radon.RadonRetrieval({
                    method: result[1],
                    url: result[3],
                    body: result[4],
                    headers: Object.fromEntries(result[5]),
                      script: utils.parseRadonScript(result[6]),
                })
            })
    }
    
    /**
     * Formally verify the given Radon Request object into the connected EVM network.
     * It also verifies all the Radon Retrieval scripts (i.e. data source) the Request 
     * relies on, if not yet done before. 
     * 
     * Verifying Radon assets modifies the EVM storage and therefore requires
     * spending gas in proportion to the number and complexity of the data sources,
     * and whether these had been previously verified before or not.
     * 
     * If the given Radon Request happened to be already verified, no gas would be actually consumed.
     * 
     * @param request Instance of a Radon Request object.
     * @param options Async EVM transaction handlers.
     * @returns The RAD hash of the Radon Request, as verified on the connected EVM network.
     */
    public async verifyRadonRequest(request: Witnet.Radon.RadonRequest, options?: {
        /**
         * Number of block confirmations to wait for after verifying transaction gets mined (defaults to 1).
         */
        confirmations?: number,
        /**
         * Callback handler called just in case a `verifyRadonRequest` transaction is ultimately required.
         */
        onVerifyRadonRequest: (radHash: string) => any, 
        /**
         * Callback handler called once the `verifyRadonRequest` transaction gets confirmed.
         * @param receipt The `verifyRadonRequest` transaction receipt.
         */
        onVerifyRadonRequestReceipt?: (receipt: ContractTransactionReceipt | null) => any,
        /**
         * Callback handler called for every involved `verifyRadonRetrieval` transaction.
         */
        onVerifyRadonRetrieval?: (hash: string) => any,
        /**
         * Callback handler called after every involved `verifyRadonRetrieval` transaction gets confirmed.
         * @param receipt The `verifyRadonRetrieval` transaction receipt.
         */
        onVerifyRadonRetrievalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
    }): Promise<string> {
        const radHash = request.radHash
        await this.lookupRadonRequest(radHash)
            .catch(async () => {
                const hashes: Array<string> = []
                for (const index in request.sources) {
                    const retrieval = request.sources[index]
                    hashes.push(`0x${await this.verifyRadonRetrieval(retrieval, options)}`)
                }
                const aggregate = abiEncodeRadonAsset(request.sourcesReducer)
                const tally = abiEncodeRadonAsset(request.witnessReducer)
                if (options?.onVerifyRadonRequest) {
                    options.onVerifyRadonRequest(radHash)
                }
                await this.contract
                    .getFunction("verifyRadonRequest(bytes32[],(uint8,(uint8,bytes)[]),(uint8,(uint8,bytes)[]))")
                    .send(hashes, aggregate, tally)
                    .then(async (tx) => {
                        const receipt = await tx.wait(options?.confirmations || 1)
                        if (options?.onVerifyRadonRequestReceipt) {
                            options.onVerifyRadonRequestReceipt(receipt)
                        }
                    })
            })
        return radHash
    }
    
    /**
     * Formally verify the given Radon Retrieval script (i.e. data source), into the connected EVM network.
     * 
     * Verifying Radon assets modifies the EVM storage and therefore requires
     * spending gas in proportion to the size of the data source parameters (e.g. URL, body, headers, or Radon script).
     * 
     * If the given Radon Retrieval object happened to be already verified, no EVM gas would be actually consumed.
     * 
     * @param request Instance of a Radon Retrieval object.
     * @param options Async EVM transaction handlers.
     * @returns The unique hash of the Radon Retrieval object, as verified on the connected EVM network.
     */
    public async verifyRadonRetrieval(retrieval: Witnet.Radon.RadonRetrieval, options?: {
        /**
         * Number of block confirmations to wait for after verifying transaction gets mined (defaults to 1).
         */
        confirmations?: number,
        /**
         * Callback handler called just in case a `verifyRadonRequest` transaction is ultimately required.
         */
        onVerifyRadonRetrieval?: (hash: string) => any,
        /**
         * Callback handler called once the `verifyRadonRetrieval` transaction gets confirmed.
         * @param receipt The `verifyRadonRetrieval` transaction receipt.
         */
        onVerifyRadonRetrievalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
    }): Promise<string> {
        return this.determineRadonRetrievalHash(retrieval)
            .then(async hash => {
                await this.lookupRadonRetrieval(hash)
                    .catch(async () => {
                        if (options?.onVerifyRadonRetrieval) {
                            options.onVerifyRadonRetrieval(hash)
                        }
                        await this.contract
                            .getFunction("verifyRadonRetrieval(uint8,string,string,string[2][],bytes)")
                            .send(...abiEncodeRadonAsset(retrieval))
                            .then(async (tx) => {
                                const receipt = await tx.wait(options?.confirmations || 1)
                                if (options?.onVerifyRadonRetrievalReceipt) {
                                    options.onVerifyRadonRetrievalReceipt(receipt)
                                }
                            })
                    })
                return hash
            })
    }
}

class WitOracleRadonRequestFactory extends WitApplianceWrapper {  

    public readonly registry: WitOracleRadonRegistry
    
    protected constructor (witOracle: WitOracle, registry: WitOracleRadonRegistry, at?: string) {
        super(witOracle, "WitOracleRadonRequestFactory", at)
        this.registry = registry
    }

    static async deployed(witOracle: WitOracle, registry: WitOracleRadonRegistry): Promise<WitOracleRadonRequestFactory> {
        const deployer = new WitOracleRadonRequestFactory(witOracle, registry)
        const witOracleRegistryAddress = await witOracle.contract.registry.staticCall()
        if (registry.address !== witOracleRegistryAddress) {
            throw new Error(`${this.constructor.name} at ${deployer.address}: uncompliant WitOracleRadonRegistry at ${registry.address})`)
        }
        return deployer
    }

    public async deployRadonRequestTemplate(
        template: Witnet.Radon.RadonTemplate,
        options?: {
            confirmations?: number,
            onDeployRadonRequestTemplate?: (address: string) => any,
            onDeployRadonRequestTemplateReceipt?: (receipt: ContractTransactionReceipt | null) => any,
            /**
             * Callback handler called just in case a `verifyRadonRetrieval` transaction is ultimately required.
             */
            onVerifyRadonRetrieval?: (hash: string) => any,
            /**
             * Callback handler called once the `verifyRadonRetrieval` transaction gets confirmed.
             * @param receipt The `verifyRadonRetrieval` transaction receipt.
             * @param hash The unique hash of the Radon Retrieval, as verified on the connected network.
             */
            onVerifyRadonRetrievalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
        },
    ): Promise<WitOracleRadonRequestTemplate> {
        
        const hashes: Array<string> = []
        for (const index in template.sources) {
            const retrieval = template.sources[index]
            const hash = `0x${await this.registry.determineRadonRetrievalHash(retrieval)}`
            await this.registry.verifyRadonRetrieval(retrieval, options)
            hashes.push(hash)
        }
        
        const aggregator = abiEncodeRadonAsset(template.sourcesReducer)
        const tally = abiEncodeRadonAsset(template.witnessReducer)
        const target = await this.contract
            .getFunction("buildRadonRequestTemplate(bytes32[],(uint8,(uint8,bytes)[]),(uint8,(uint8,bytes)[]))")
            .staticCall(hashes, aggregator, tally)
        
        if (options?.onDeployRadonRequestTemplate) options.onDeployRadonRequestTemplate(target);
        await this.contract
            .getFunction("buildRadonRequestTemplate(bytes32[],(uint8,(uint8,bytes)[]),(uint8,(uint8,bytes)[]))")
            .send(hashes, aggregator, tally)
            .then(async (tx) => {
                const receipt = await tx.wait(options?.confirmations || 1)
                if (options?.onDeployRadonRequestTemplateReceipt) {
                    options.onDeployRadonRequestTemplateReceipt(receipt);
                }
            });
        
        return await WitOracleRadonRequestTemplate.at(
            this.witOracle, 
            target
        )
    }

    public async deployRadonRequestModal(
        modal: Witnet.Radon.RadonModal,
        options?: {
            confirmations?: number,
            onDeployRadonRequestModal?: (address: string) => any,
            onDeployRadonRequestModalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
            /**
             * Callback handler called just in case a `verifyRadonRetrieval` transaction is ultimately required.
             */
            onVerifyRadonRetrieval?: (hash: string) => any,
            /**
             * Callback handler called once the `verifyRadonRetrieval` transaction gets confirmed.
             * @param receipt The `verifyRadonRetrieval` transaction receipt.
             * @param hash The unique hash of the Radon Retrieval, as verified on the connected network.
             */
            onVerifyRadonRetrievalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
        },
    ): Promise<WitOracleRadonRequestModal> {

        const retrieval = [
            modal.sources[0].method,
                modal.sources[0].body || "",
                modal.sources[0]?.headers ? Object.entries(modal.sources[0].headers) : [],
                modal.sources[0].script?.toBytecode() || "0x",
        ];
        const tally = abiEncodeRadonAsset(modal.witnessReducer)
        const target = await this.contract
            .buildRadonRequestModal //getFunction("buildRadonRequestModal((uint8,string,string[2][],bytes),(uint8,(uint8,bytes)[]))")
            .staticCall(retrieval, tally)
        
        if (options?.onDeployRadonRequestModal) options.onDeployRadonRequestModal(target);
        await this.contract
            .buildRadonRequestModal
            // .getFunction("buildRadonRequestModal((uint8,string,string[2][],bytes),(uint8,(uint8,bytes)[]))")
            .send(retrieval, tally)
            .then(async (tx) => {
                const receipt = await tx.wait(options?.confirmations || 1)
                if (options?.onDeployRadonRequestModalReceipt) {
                    options.onDeployRadonRequestModalReceipt(receipt);
                }
            });
        
        return await WitOracleRadonRequestModal.at(
            this.witOracle, 
            target
        )
    }

    public async verifyRadonRequest(
        request: Witnet.Radon.RadonRequest,
        _options?: {
            confirmations?: number,
            onVerifyRadonRequest?: (address: string) => any,
            onVerifyRadonRequestReceipt?: (receipt: ContractTransactionReceipt | null) => any,
            /**
             * Callback handler called just in case a `verifyRadonRetrieval` transaction is ultimately required.
             */
            onVerifyRadonRetrieval?: (hash: string) => any,
            /**
             * Callback handler called once the `verifyRadonRetrieval` transaction gets confirmed.
             * @param receipt The `verifyRadonRetrieval` transaction receipt.
             * @param hash The unique hash of the Radon Retrieval, as verified on the connected network.
             */
            onVerifyRadonRetrievalReceipt?: (receipt: ContractTransactionReceipt | null) => any,
        }
    ): Promise<Witnet.Hash> {
        // TODO:
        //
        return request.radHash
    }
}

class WitOracleRadonRequestModal extends WitApplianceWrapper {

    protected constructor (witOracle: WitOracle, at: string) {
        super(witOracle, "WitOracleRadonRequestModal", at)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitOracleRadonRequestModal> {
        const template = new WitOracleRadonRequestModal(witOracle, target)
        const templateWitOracleAddr = await template.contract.witOracle.staticCall()
        if (templateWitOracleAddr !== witOracle.address) {
            throw new Error(`${this.constructor.name} at ${target}: mismatching Wit/Oracle address (${templateWitOracleAddr})`)
        }
        return template
    }

    public async getDataResultType(): Promise<WitOracleResultDataTypes> {
        return this.contract
            .getFunction("getDataResultType()")
            .staticCall()
            .then((result: number) => {
                switch (Number(result)) {
                    case 1: return "array";
                    case 2: return "boolean";
                    case 3: return "bytes";
                    case 4: return "integer";
                    case 5: return "float";
                    case 6: return "map";
                    case 7: return "string";
                    default: 
                        return "any";
                }
            })
    }

    public async getDataSourcesArgsCount(): Promise<number> {
        return this.contract
            .getFunction("getDataSourcesArgsCount()")
            .staticCall()
            .then((argsCount: bigint) => Number(argsCount))
    }

    public async getRadonModalRetrieval(): Promise<Witnet.Radon.RadonRetrieval> {
        return this.contract
            .getFunction("getRadonModalRetrieval()")
            .staticCall()
            .then((result: Result) => {
                return new Witnet.Radon.RadonRetrieval({
                    method: result[1],
                    url: result[3],
                    body: result[4],
                    headers: Object.fromEntries(result[5]),
                    script: utils.parseRadonScript(result[6]),
                })
            })
    }

    public async verifyRadonRequest(
        dataProviders: string[],
        commonRetrievalArgs?: string[],
        options?: {
            confirmations?: number, 
            onVerifyRadonRequest: (radHash: string) => any,
            onVerifyRadonRequestReceipt: (receipt: ContractTransactionReceipt | null) => any,
        },
    ): Promise<Witnet.Hash> {
        const argsCount = await this.getDataSourcesArgsCount()
        if (argsCount != 1 + (commonRetrievalArgs?.length || 0)) {
            throw TypeError(`${this.constructor.name}@${this.address}: unmatching args count != ${argsCount -1 }.`)
        }
        const method = this.contract.getFunction("verifyRadonRequest(string[],string[])")
        const radHash = (await method.staticCall(commonRetrievalArgs || [], dataProviders)).slice(2)
        try {
            await (await this.witOracle.getWitOracleRadonRegistry()).lookupRadonRequestBytecode(radHash)
        } catch {
            if (options?.onVerifyRadonRequest) options.onVerifyRadonRequest(radHash);
            await method
                .send(commonRetrievalArgs || [], dataProviders)
                .then(tx => tx.wait(options?.confirmations || 1))
                .then(receipt => {
                    if (options?.onVerifyRadonRequestReceipt) {
                        options.onVerifyRadonRequestReceipt(receipt)
                    }
                    return radHash
                })
        }
        return radHash
    }

}

class WitOracleRadonRequestTemplate extends WitApplianceWrapper {

    protected constructor (witOracle: WitOracle, at: string) {
        super(witOracle, "WitOracleRadonRequestTemplate", at)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitOracleRadonRequestTemplate> {
        const template = new WitOracleRadonRequestTemplate(witOracle, target)
        const templateWitOracleAddr = await template.contract.witOracle.staticCall()
        if (templateWitOracleAddr !== witOracle.address) {
            throw new Error(`${this.constructor.name} at ${target}: mismatching Wit/Oracle address (${templateWitOracleAddr})`)
        }
        return template
    }

    public async getDataResultType(): Promise<WitOracleResultDataTypes> {
        return this.contract
            .getFunction("getDataResultType()")
            .staticCall()
            .then((result: number) => {
                switch (Number(result)) {
                    case 1: return "array";
                    case 2: return "boolean";
                    case 3: return "bytes";
                    case 4: return "integer";
                    case 5: return "float";
                    case 6: return "map";
                    case 7: return "string";
                    default: 
                        return "any";
                }
            })
    }

    public async getDataSources(): Promise<Array<Witnet.Radon.RadonRetrieval>> {
        return this.contract
            .getFunction("getDataSources()")
            .staticCall()
            .then((results: Array<Result>) => {
                return results.map(result => new Witnet.Radon.RadonRetrieval({
                    method: result[1],
                    url: result[3],
                    body: result[4],
                    headers: Object.fromEntries(result[5]),
                    script: utils.parseRadonScript(result[6]),
                }))
            })
    }

    public async getDataSourcesArgsCount(): Promise<Array<number>> {
        return this.contract
            .getFunction("getDataSourcesArgsCount()")
            .staticCall()
            .then((dims: Array<bigint>) => dims.map(dim => Number(dim)))
    }

    public async verifyRadonRequest(
        args: string | string[] | Array<string[]>,
        options?: {
            confirmations?: number, 
            onVerifyRadonRequest: (radHash: string) => any,
            onVerifyRadonRequestReceipt: (receipt: ContractTransactionReceipt | null) => any,
        },
    ): Promise<Witnet.HexString> {
        const argsCount = await this.getDataSourcesArgsCount()
        let encodedArgs: Array<string[]> = []
        if (typeof args === 'string') {
            if (argsCount.length === 1 && argsCount[0] === 1) {
                encodedArgs = [ [ args as string ]]
            }
        } else if (Array.isArray(args)) {
            if (Array.isArray(args[0])) {
                if (
                    argsCount.length === args.length
                        && !args.find((subargs, index) => subargs.length !== argsCount[index])
                ) {
                    encodedArgs = args as Array<string[]>
                }
            } else if (
                args.length === argsCount[0]
                    && !args.find(arg => typeof arg !== 'string')
            ) {
                encodedArgs = [ args as string[] ]
            }
        }
        if (encodedArgs.length === 0) {
            throw TypeError(`${this.constructor.name}@${this.address}: unmatching args count != [${argsCount}, ].`)
        }
        const method = this.contract.getFunction("verifyRadonRequest(string[][])")
        const radHash = (await method.staticCall(encodedArgs)).slice(2)
        try {
            await (await this.witOracle.getWitOracleRadonRegistry()).lookupRadonRequestBytecode(radHash)
        } catch {
            if (options?.onVerifyRadonRequest) options.onVerifyRadonRequest(radHash);
            await method
                .send(encodedArgs)
                .then(tx => tx.wait(options?.confirmations || 1))
                .then(receipt => {
                    if (options?.onVerifyRadonRequestReceipt) {
                        options.onVerifyRadonRequestReceipt(receipt)
                    }
                    return radHash
                })
        }
        return radHash
    }
}

class WitPriceFeeds extends WitApplianceWrapper {
    
    protected constructor (witOracle: WitOracle, at: string) {
        super(witOracle, "WitPriceFeeds", at)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitPriceFeeds> {
        const priceFeeds = new WitPriceFeeds(witOracle, target)
        const oracleAddr = await priceFeeds.contract.witOracle.staticCall()
        if (oracleAddr !== witOracle.address) {
            throw new Error(`${this.constructor.name} at ${target}: mismatching Wit/Oracle address (${oracleAddr})`)
        }
        return priceFeeds
    }

    public async createChainlinkAggregator(id4: Witnet.HexString, options?: {
        evmConfirmations?: number,
        evmGasPrice?: bigint,
        evmTimeout?: number,
        onCreateChainlinkAggregatorTransaction?: (txHash: Witnet.Hash) => any,
        onCreateChainlinkAggregatorTransactionReceipt?: (receipt: TransactionReceipt | null) => any,
    }): Promise<ContractTransactionReceipt | TransactionReceipt | null> {
        const evmTransaction: ContractTransaction = await this.contract
            .createChainlinkAggregator
            .populateTransaction(id4)
        evmTransaction.gasPrice = options?.evmGasPrice || evmTransaction?.gasPrice
        return this.signer
            .sendTransaction(evmTransaction)
            .then(response => {
                if (options?.onCreateChainlinkAggregatorTransaction) {
                    options.onCreateChainlinkAggregatorTransaction(response.hash);
                }
                return response.wait(options?.evmConfirmations || 1, options?.evmTimeout)
            })
            .then(receipt => {
                if (options?.onCreateChainlinkAggregatorTransactionReceipt) {
                    options.onCreateChainlinkAggregatorTransactionReceipt(receipt);
                }
                return receipt
            })
    }

    public async determineChainlinkAggregatorAddress(id4: Witnet.HexString): Promise<string> {
        return this.contract
            .createChainlinkAggregator
            .staticCall(id4)
    }

    public async getEvmFootprint(): Promise<string> {
        return this.contract
            .footprint
            .staticCall()
    }

    public async getPrice(id4: Witnet.HexString, ema = false): Promise<PriceFeedUpdate> {
        return this.contract
            .getPrice
            .staticCall(id4, ema)
            .then((result: any) => ({
                delta1000: BigInt(result.conf),
                exponent: Number(result.expo),
                timestamp: BigInt(result.publishTime),
                trackHash: result.track,
                value: Number(result.price) / 10 ** Number(result.expo),
            }))
    }

    public async getPriceNotOlderThan(id4: Witnet.HexString, age: number, ema = false): Promise<PriceFeedUpdate> {
        return this.contract
            .getPriceNotOlderThan
            .staticCall(id4, ema, age)
            .then((result: any) => ({
                delta1000: BigInt(result.conf),
                exponent: Number(result.expo),
                timestamp: BigInt(result.publishTime),
                trackHash: result.track,
                value: Number(result.price) / 10 ** Number(result.expo),
            }))
    }

    public async getPriceUnsafe(id4: Witnet.HexString, ema = false): Promise<PriceFeedUpdate> {
        return this.contract
            .getPriceUnsafe
            .staticCall(id4, ema)
            .then((result: any) => ({
                delta1000: BigInt(result.conf),
                exponent: Number(result.expo),
                timestamp: BigInt(result.publishTime),
                trackHash: result.track,
                value: Number(result.price) / 10 ** Number(result.expo),
            }))
    }

    public async isCaptionSupported(caption: string): Promise<boolean> {
        return this.contract
            .supportsCaption
            .staticCall(caption)
    }

    public async lookupPriceFeed(id4: Witnet.HexString): Promise<PriceFeed> {
        return this.contract
            .lookupPriceFeed
            .staticCall(id4)
            .then((result: any) => ({
                id: result.id,
                exponent: Number(result.exponent),
                symbol: result.symbol,
                mapper: {
                    algorithm: abiDecodePriceFeedMappingAlgorithm(result.mapper.algo),
                    description: result.mapper.desc,
                    dependencies: result.mapper.deps,
                },
                oracle: {
                    address: result.oracle.addr,
                    name: result.oracle.name,
                    dataBytecode: result.oracle.dataBytecode,
                    dataSources: result.oracle.dataSources,
                    interfaceId: result.oracle.interfaceId,
                },
                updateConditions: {
                    computeEMA: result.computeEma,
                    cooldownSecs: result.cooldownSecs,
                    heartbeatSecs: result.heartbeatSecs,
                    maxDeviation1000: result.maxDeviation100,
                },
                lastUpdate: {
                    delta1000: BigInt(result.conf),
                    exponent: Number(result.expo),
                    timestamp: BigInt(result.publishTime),
                    trackHash: result.track,
                    value: Number(result.price) / 10 ** Number(result.expo),
                },
            }))
    }

    public async lookupPriceFeedCaption(id4: Witnet.HexString): Promise<string> {
        return this.contract
            .lookupSymbol
            .staticCall(id4)
    }

    public async lookupPriceFeedExponent(id4: Witnet.HexString): Promise<number> {
        return this.contract
            .lookupPriceFeedExponent
            .staticCall(id4)
            .then(result => Number(result))
    }

    public async lookupPriceFeedID(id4: Witnet.HexString): Promise<Witnet.Hash> {
        return this.contract
            .lookupPriceFeedID
            .staticCall(id4)
    }

    public async lookupPriceFeeds(): Promise<Array<PriceFeed>> {
        return this.contract
            .lookupPriceFeeds
            .staticCall()
            .then(results => results.map((result: any) => ({
                id: result.id,
                exponent: Number(result.exponent),
                symbol: result.symbol,
                mapper: {
                    algorithm: "", // todo: PriceFeedMappers[result.mapper.algo],
                    description: result.mapper.desc,
                    dependencies: result.mapper.deps,
                },
                oracle: {
                    address: result.oracle.addr,
                    name: result.oracle.name,
                    dataBytecode: result.oracle.dataBytecode,
                    dataSources: result.oracle.dataSources,
                    interfaceId: result.oracle.interfaceId,
                },
                updateConditions: {
                    computeEMA: result.computeEma,
                    cooldownSecs: result.cooldownSecs,
                    heartbeatSecs: result.heartbeatSecs,
                    maxDeviation1000: result.maxDeviation100,
                },
                lastUpdate: {
                    delta1000: BigInt(result.conf),
                    exponent: Number(result.expo),
                    timestamp: BigInt(result.publishTime),
                    trackHash: result.track,
                    value: BigInt(result.price),
                },
            })))
    }

}

class WitPriceFeedsLegacy extends WitApplianceWrapper {
    
    protected constructor (witOracle: WitOracle, at: string) {
        super(witOracle, "WitPriceFeedsLegacy", at)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitPriceFeedsLegacy> {
        const priceFeeds = new WitPriceFeedsLegacy(witOracle, target)
        const oracleAddr = await priceFeeds.contract.witnet.staticCall()
        if (oracleAddr !== witOracle.address) {
            throw new Error(`WitPriceFeedsLegacy at ${target}: mismatching Wit/Oracle address (${oracleAddr})`)
        }
        return priceFeeds
    }

    public async getEvmFootprint(): Promise<string> {
        return this.contract
            .footprint
            .staticCall()
    }

    // public async getPrice(id4: Witnet.HexString): Promise<PriceFeedUpdate> {
    //     return this.contract
    //         .latestPrice
    //         .staticCall(id4)
    //         .then((result: any) => ({
    //             timestamp: BigInt(result?.timestamp),
    //             trackHash: result?.drTxHash,
    //             value: Number(result?.value) / 10 ** exponent,
    //         }))
    // }

    public async isCaptionSupported(caption: string): Promise<boolean> {
        return this.contract
            .supportsCaption
            .staticCall(caption)
    }

    // public async lookupPriceFeed(id4: Witnet.HexString): Promise<PriceFeed> {
    //     return this.contract
    //         .lookupPriceFeed
    //         .staticCall(id4)
    //         .then((result: any) => ({
    //             id: result.id,
    //             exponent: Number(result.exponent),
    //             symbol: result.symbol,
    //             mapper: {
    //                 algorithm: abiDecodePriceFeedMappingAlgorithm(result.mapper.algo),
    //                 description: result.mapper.desc,
    //                 dependencies: result.mapper.deps,
    //             },
    //             oracle: {
    //                 address: result.oracle.addr,
    //                 name: result.oracle.name,
    //                 dataSources: result.oracle.dataSources,
    //                 interfaceId: result.oracle.interfaceId,
    //             },
    //             updateConditions: {
    //                 computeEMA: result.computeEma,
    //                 cooldownSecs: result.cooldownSecs,
    //                 heartbeatSecs: result.heartbeatSecs,
    //                 maxDeviation1000: result.maxDeviation100,
    //             },
    //             lastUpdate: {
    //                 delta1000: BigInt(result.conf),
    //                 exponent: Number(result.expo),
    //                 timestamp: BigInt(result.publishTime),
    //                 trackHash: result.track,
    //                 value: BigInt(result.price),
    //             },
    //         }))
    // }

    public async lookupPriceFeedCaption(id4: Witnet.HexString): Promise<string> {
        return this.contract
            .lookupCaption
            .staticCall(id4)
    }

    public async lookupPriceFeedExponent(id4: Witnet.HexString): Promise<number> {
        return this.contract
            .lookupDecimals
            .staticCall(id4)
            .then(result => Number(result))
    }

    public async lookupPriceFeeds(): Promise<Array<PriceFeed>> {
        const interfaceId = await this.witOracle.getEvmImplSpecs()
        let priceFeeds: Array<PriceFeed> = await this.contract
            .supportedFeeds
            .staticCall()
            .then(results => {
                const [ id4s, captions, dataSources ] = results
                return id4s.map((id4: string, index: number) => ({
                    id: id4,
                    exponent: Number(captions[index].split('-').slice(-1)[0]),
                    symbol: captions[index], //.split('-').slice(1, -1).join('-'),
                    oracle: {
                        address: this.witOracle.address,
                        name: "WitOracle",
                        dataSources: dataSources[index],
                        interfaceId,
                    }
                }))
            })
        
        let latestPrices = await this.contract
            .latestPrices
            .staticCall(priceFeeds.map(pf => pf.id))
        
        return priceFeeds.map((pf, index) => ({
            ...pf,
            lastUpdate: {
                timestamp: latestPrices[index].timestamp,
                trackHash: latestPrices[index].drTxHash,
                value: Number(latestPrices[index].value) / 10 ** pf.exponent
            }
        }))
    }

}

class WitRandomness extends WitApplianceWrapper {

    protected _legacy: Contract;

    protected constructor (witOracle: WitOracle, at: string) {
        super(witOracle, "WitRandomness", at)
        this._legacy = new Contract(at, ABIs["WitRandomnessLegacy"], this.signer)
    }

    static async at(witOracle: WitOracle, target: string): Promise<WitRandomness> {
        const randomizer = new WitRandomness(witOracle, target)
        try {
            let oracleAddr
            try {
                oracleAddr = await randomizer.contract.witOracle.staticCall()
            } catch {
                const abi = [ "function witnet() public view returns (address)", ]
                const contract = new Contract(target, abi, randomizer.signer)
                oracleAddr = await contract.witnet.staticCall()
            }
            if (oracleAddr !== witOracle.address) {
                throw new Error(`WitRandomness at ${target}: mismatching Wit/Oracle address (${oracleAddr})`)
            }
        } catch (error: any) {
            throw new Error(`WitRandomness at ${target}: cannot fetch Wit/Oracle address\n${
                error?.stack?.split('\n')[0] || error
            }`)
        }
        return randomizer
    }

    public async class(): Promise<string> {
        return this.contract.class.staticCall()
    }

    public async estimateRandomizeFee(evmGasPrice: bigint): Promise<bigint> {
        return this.contract
            .getFunction("estimateRandomizeFee(uint256)")
            .staticCall(evmGasPrice)
    }

    public async fetchRandomnessAfter(evmBlockNumber: bigint): Promise<Witnet.HexString | undefined> {
        return this
            .isRandomized(evmBlockNumber)
            .then(isRandomized => {
                return (isRandomized
                    ? this.contract.fetchRandomnessAfter.staticCall(evmBlockNumber)
                    : undefined
                )
            })
    }

    public async fetchRandomnessAfterProof(evmBlockNumber: bigint): Promise<{
        finality: bigint,
        timestamp: number, 
        trail: Witnet.Hash, 
        uuid: Witnet.Hash, 
    }> {
        return this
            .contract
            .fetchRandomnessAfterProof
            .staticCall(evmBlockNumber)
            .then(result => ({
                finality: BigInt(result[3]),
                timestamp: Number(result[1]),
                trail: result[2],
                uuid: result[0],
            }))
    }

    public async filterEvents(options: {
        fromBlock: BlockTag,
        toBlock?: BlockTag,
    }): Promise<Array<{
        blockNumber: bigint,
        queryId: bigint,
        requester?: string,
        transactionHash: string,
    }>> {
        let logs = await this._legacy.queryFilter("Randomizing", options.fromBlock, options?.toBlock)
        if (logs && logs.length > 0) {
            return logs.filter(log => !log.removed).map(log => ({
                blockNumber: BigInt(log.blockNumber),
                queryId: (log as EventLog)?.args[3],
                transactionHash: log.transactionHash,
            }))
        } else {
            return this.contract.queryFilter("Randomizing", options.fromBlock, options?.toBlock)
                .then(logs => logs.filter(log => !log.removed))
                .then(logs => logs.map(log => ({
                    blockNumber: BigInt(log.blockNumber),
                    queryId: (log as EventLog)?.args[1],
                    requester: (log as EventLog)?.args[0],
                    transactionHash: log.transactionHash,
                })))
        }
    }

    public async getLastRandomizeBlock(): Promise<bigint> {
        return this.contract
            .getFunction("getLastRandomizeBlock()")
            .staticCall()
    }

    public async getRandomizeStatus(evmBlockNumber: bigint): Promise<RandomizeStatus> {
        return this
            .contract
            .getRandomizeStatus
            .staticCall(evmBlockNumber)
            .then(result => {
                switch(Number(result)) {
                    case 1: return "Awaiting";
                    case 2: return "Ready";
                    case 3: return "Error";
                    case 4: return "Finalizing";
                }
                return "Void";
            })
    }

    public async isRandomized(evmBlockNumber: bigint): Promise<boolean> {
        return this
            .contract
            .isRandomized
            .staticCall(evmBlockNumber)
    }

    public async randomize(options?: {
        evmConfirmations?: number,
        evmGasPrice?: bigint,
        evmTimeout?: number,
        onRandomizeTransaction?: (txHash: Witnet.Hash) => any, 
        onRandomizeTransactionReceipt?: (receipt: TransactionReceipt | null) => any,
    }): Promise<ContractTransactionReceipt | TransactionReceipt | null> {
        const evmGasPrice = options?.evmGasPrice || (await this.provider.getFeeData()).gasPrice || 0n
        const evmRandomizeFee = await this.estimateRandomizeFee(evmGasPrice)
        const evmTransaction: ContractTransaction = await this.contract
            .getFunction("randomize()")
            .populateTransaction()
        evmTransaction.gasPrice = evmGasPrice || evmTransaction?.gasPrice
        evmTransaction.value = evmRandomizeFee
        return this.signer
            .sendTransaction(evmTransaction)
            .then(response => {
                if (options?.onRandomizeTransaction) options.onRandomizeTransaction(response.hash);
                return response.wait(options?.evmConfirmations || 1, options?.evmTimeout)
            })
            .then(receipt => {
                if (options?.onRandomizeTransactionReceipt) options.onRandomizeTransactionReceipt(receipt);
                return receipt
            })
    }
}

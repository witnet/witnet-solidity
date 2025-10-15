import { Interface, InterfaceAbi } from "ethers"
import { ABIs, getEvmNetworkAddresses } from "../utils"
import { ContractWrapper } from "./ContractWrapper"
import { WitOracle } from "./WitOracle"

export abstract class WitAppliance extends ContractWrapper {
    
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
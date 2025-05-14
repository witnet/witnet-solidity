import {
    supportedEcosystems as _supportedEcosystems,
    supportedNetworks as _supportedNetworks,
    supportsNetwork as _supportsNetwork
} from "witnet-solidity-bridge"

export { getNetworkAddresses, getNetworkConstructorArgs } from "../bin/helpers"

export function supportedEcosystems(): string[] {
    return _supportedEcosystems()
}

export function supportedNetworks(): Object {
    return _supportedNetworks()
}

export function supportsNetwork(network: string): boolean {
    return _supportsNetwork(network)
}

export { ABIs } from "witnet-solidity-bridge"

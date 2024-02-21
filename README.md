# Witnet Solidity 

Imports all required dependencies for any project to start interacting with any of the Witnet Solidity artifacts, as well as tailoring parameterized data requests to be solved by the Witnet Oracle layer-1 side-chain in a fully trustless and decentralized manner.

The import of the following Solidity source files would enable your smart-contracts to:

- **`witnet-solidity-bridge/contracts/WitnetOracle.sol`**:
  - Estimate the reward in EVM-coins required for solving some given data request and SLA parameters.
  - Query the Witnet Oracle layer-1 side-chain to asynchronously provide unmalleable up-to-date data points of some given data request.
  - Check the current status of some previously posted data request.
  - Read either a successfull result or possible resolution errors from some previously posted data request, as provided by the Witnet Oracle side-chain. 

- **`witnet-solidity-bridge/contracts/requests/WitnetRequest.sol`**:
  - Refer `WitnetRequest` instances embedding Witnet-compliant RAD Requests payload. 
  - Introspect metadata of the embedded Witnet-compliant Data Request.

- **`witnet-solidity-bridge/contracts/requests/WitnetRequestTemplate.sol`**:
  - Refer `WitnetRequestTemplate` pre-deployed instances.
  - Introspect metadata of some given `WitnetRequestTemplate` address.
  - Build counter-factual parameterized `WitnetRequest` instances by fulfilling required parameters.

- **`witnet-solidity-bridge/contracts/WitnetRequestFactory.sol`**: 
  - Programmatically create your own parameterized `WitnetRequestTemplate` instances.


- **WitnetPriceFeeds**:

## Harness the power of the Witnet Decentralized Oracle

If you want to start interacting with Witnet from your Solidity-based smart-contracts project, you can simply add the `witnet-solidity` package as a dependency and run the following command:

```console
$ npm install --save-dev witnet-solidity
$ npx witnet init
```

After initializing the `witnet-solidity` package, several files and directories will be added to your project root folder, should they not yet exist:
- `.env_witnet`
- `assets/witnet/**`
- `contracts/WitnetMigrations.sol`
- `migrations/truffle/*`
- `migrations/witnet/**`
- `test/witnet**.spec.js`
- `truffle-config.js`

Also, these two command-line utility tools will be ready just right out of the box for you to:
- **`npx w3gw`**:
  - Run a pre-configured ETH/RPC gateway to any of the EVM-chains supported by the Witnet Oracle Layer-1 sidechain.
  - Usage: `$ npx w3gw [<ecosystem>[:<network>] [custom-rpc-provider-url]]`
- **`npx witnet`**:
  - Introspect available Witnet assets and artifacts available within your project, either inherited from the `witnet-solidity` package, or explicitly added to any of the resource files within `migrations/witnet/**` folder.
  - Check the correctness and referential integrity of such assets and artifacts.
  - Fully test the EVM deployment of the Witnet pre-compiled data requests or templates within your project, while simulating the actual Retrieve/Aggregate/Tally stages that would take place in the context of the Witnet Oracle layer-1 side-chain when processing the data requests being tested.
  - Deploy some given selection of `WitnetRequest` and `WitnetRequestTemplate` artifacts into any of the EVM-chains supported by the Witnet Oracle.
  - Usage: `$ npx witnet [<command>] [--<modifier> [<modifier-argument>], ...]`

> On how to build your own data sources, parameterized data request templates, or pre-compiled requests, please refer to the [Witnet Docs Site][docs]. On how to operate with the **`npx witnet`** command, please keep reading.

## Usage examples

- **`npx witnet`**
```console
    init                 => Initialize Witnet artifact, folders and scripts.
    avail                => List available resources from Witnet.
    check                => Check that all Witnet assets within this project are properly declared.
    console              => Open Truffle console as to interact with Witnet deployed artifacts.
    deploy               => Deploy Witnet requests and templates defined within the ./migrations/witnet/ folder.
    test                 => Dry-run requests and templates defined within the ./migrations/witnet/ folder.
    version              => Shows version.
```

- **`npx witnet avail`**
```console
    --chains [<optional-list>]        => List supported sidechains and already deployed Witnet artifact addresses within those.
    --requests [<optional-list>]      => Show details of Witnet request artifacts currently available for deployment.
    --templates [<optional-list>]     => Show details of Witnet template artifacts currently available for deployment.
    --sources [<optional-list>]    => Show details of Witnet data retriving scripts referable from other Witnet artifacts.
```
    - List ecosystems supported by Witnet:
        ```console
        $ npx witnet avail --chains

        WITNET SUPPORTED ECOSYSTEMS
        ---------------------------
        ETHEREUM
        ARBITRUM
        AVALANCHE
        BOBA
        CELO
        CONFLUX
        CRONOS
        CUBE
        DOGECHAIN
        ELASTOS
        FUSE
        GNOSIS
        KAVA
        KCC
        KLAYTN
        METER
        METIS
        MOONBEAM
        OKXCHAIN
        OPTIMISM
        POLYGON
        REEF
        SCROLL
        SYSCOIN
        ULTRON

        To get Witnet-supported chains within a list of ecosystems:

        $ npx witnet avail --chains <comma-separated-witnet-supported-ecosystems>

        Note: the --chains operand can be omitted if the WITNET_SOLIDITY_DEFAULT_CHAIN environment variable is set.
        ```
    - Show details of Witnet request artifacts:
        `$ npx witnet avail --requests [<comma-separated-request-artifact-names>]`
    - Show details of Witnet remplate artifacts:
        `$ npx witnet avail --templates [<comma-separated-template-artifact-names>]`
    - Show details of Witnet data retriving scripts:
        ```console
        $ npx witnet avail --sources 
        ...

        To delimit tree breakdown, or show the specs of a group of leafs:

        $ npx witnet avail --sources <comma-separated-unique-resource-names>
        ```

- **`npx witnet test`**
    - All request and template artifacts will be tested if not otherwise specified.
    - Artifacts to be tested and be specified, though:
        `$ npx witnet --artifacts <comma-separated-artifact-names`
    - Detailed trace of data request resolutions being simulated can also be specified:
        `$ npx witnet [--artifacts <comma-separated-artifact-names] --verbose`

- **`npx witnet deploy`**
    - Target EVM-chain must be specified:
        `$ npx witnet deploy <ecosystem:network>`
    - Artifacts to be deployed can be specified:
        `$ npx witnet deploy <ecosystem:network> [--comma-separated-artifact-names]`
    - If no artifacts are specified, only those explicitly refered in `./migrations/witnet/addresses.json` with an empty address (i.e. `""`) for the targeted chain will be actually deployed. 

## License

`witnet-solidity` is published under the [MIT license][license].

[license]: https://github.com/witnet/witnet-solidity/blob/master/LICENSE
[docs]: https://docs.witnet.io/smart-contracts/witnet-web-oracle
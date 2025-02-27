const utils = require("../../scripts/utils")
const WitOracleRequest = artifacts.require("WitOracleRequest")

contract("witnet-solidity/requests", async () => {
  const [, network] = utils.getRealmNetworkFromArgs()
  const addresses = require("./addresses")[network]
  const selection = utils.getWitnetArtifactsFromArgs()
  const requests = (process.argv.includes("--legacy")
    ? require(
      `${process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || process.env.WITNET_SOLIDITY_ASSETS_PATH || "../../../../../witnet/assets"}`
    ).legacy.requests
    : require(
      `${process.env.WITNET_SOLIDITY_ASSETS_RELATIVE_PATH || process.env.WITNET_SOLIDITY_ASSETS_PATH || "../../../../../witnet/assets"}/requests`
    )
  )
  describe("Radon Requests", async () => {
    if (addresses?.requests) {
      const crafts = utils.flattenRadonAssets(requests)
      crafts.forEach(async (craft) => {
        const requestAddress = addresses?.requests[craft?.key] || ""
        if (
          requestAddress !== "" &&
            (
              selection.length === 0 
              || selection.find(artifact => craft?.key.toLowerCase().indexOf(artifact.toLowerCase()) >= 0)
            )
        ) {
          await describe(`\x1b[1;98m${craft.key}\x1b[0m`, async () => {
            let bytecode, radHash
            const radon = craft.artifact
            it("validate rad hash", async () => {
              const deployed = await WitOracleRequest.at(requestAddress)
              radHash = await deployed.radHash.call()
              assert.equal(radHash.slice(2), radon.radHash(), "Deployed RAD hash mistmatch")
            })
            it("validate bytecode", async () => {
              const deployed = await WitOracleRequest.at(requestAddress)
              bytecode = await deployed.bytecode.call()
              assert.equal(bytecode, radon.toBytecode(), "Deployed bytecode mismatch")
            })
          })
        }
      })
    }
  })
})

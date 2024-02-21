const utils = require("../../scripts/utils")

const WitnetRequest = artifacts.require("WitnetRequest")
const WitnetRequestBytecodes = artifacts.require("WitnetRequestBytecodes")

contract("witnet-solidity/requests", async () => {

  const [, network] = utils.getRealmNetworkFromArgs();
  const addresses = require("./addresses")[network]
  const selection = utils.getWitnetArtifactsFromArgs()
  const requests = (process.argv.includes("--all")
    ? require(`${process.env.WITNET_SOLIDITY_REQUIRE_PATH || process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH || "../../../../witnet"}/assets`).requests
    : require(`${process.env.WITNET_SOLIDITY_REQUIRE_PATH || process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH || "../../../../witnet"}/assets/requests`)
  );

  let summary = []
  
  describe("My Witnet Requests...", async () => {
    if (addresses?.requests) {
      const crafts = utils.flattenWitnetArtifacts(requests)
      crafts.forEach(async (craft) => {
        const requestAddress = addresses?.requests[craft?.key] || ""
        if (
          requestAddress !== "" &&
            (selection.length == 0 || selection.includes(craft?.key))
        ) {
          await describe(`${craft.key}`, async () => {
            let bytecode, radHash
            it("request was actually deployed", async () => {
              const request = await WitnetRequest.at(requestAddress)
              radHash = await request.radHash.call()
            })
            it("request dryruns successfully", async () => {
              const request = await WitnetRequest.at(requestAddress)
              const registry = await WitnetRequestBytecodes.at(await request.registry.call())
              bytecode = (await registry.bytecodeOf.call(await request.radHash.call())).slice(2)
              const output = await utils.dryRunBytecode(bytecode)
              let json
              try {
                json = JSON.parse(output)
              } catch {
                assert(false, "Invalid JSON: " + output)
              }
              const result = utils.processDryRunJson(json)
              summary.push({
                "Artifact": craft.key,
                "RAD hash": radHash.slice(2),
                "Status": result.status,
                "✓ Sources": result.totalSources - result.nokSources,
                "∑ Sources": result.totalSources,
                "Time (secs)": result.runningTime,
                "Result": !("RadonError" in result.tally) ? result.tally : "(Failed)"
              })
              if (result.status !== "OK") {
                throw Error(result?.error || "Dry-run failed!")
              }
            })
            after(async () => {
              if (process.argv.includes("--verbose")) {
                const output = await utils.dryRunBytecodeVerbose(bytecode)
                console.info(output.split("\n").slice(0, -1).join("\n"))
                console.info("-".repeat(120))
              }
            })
          })
        }
      });
    }

    after(async () => {
      if (summary.length > 0) {
        console.info(`\n${"=".repeat(148)}\n> REQUEST DRY-RUNS:`)
        console.table(summary)
      }
    })
  })
})

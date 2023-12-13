const Witnet = require("witnet-utils");
const selection = Witnet.Utils.getWitnetArtifactsFromArgs()

const addresses = require("./addresses")
const requests = require(`${process.env.WITNET_SOLIDITY_REQUIRE_PATH || "../../../../witnet"}/assets`).requests

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequest = artifacts.require("WitnetRequest")

contract("migrations/witnet/requests", async () => {
  let summary = []
  describe("My Witnet Requests...", async () => {
    const crafts = findWitnetRequestCrafts(requests)
    crafts.forEach(async (craft) => {
      if (
        craft.address !== "" &&
          (
            process.argv.includes("--all") ||
              selection.includes(craft.artifact)
          )
      ) {
        describe(`${craft.artifact}`, async () => {
          let bytecode, radHash
          it("request was actually deployed", async () => {
            const request = await WitnetRequest.at(craft.address)
            radHash = await request.radHash.call()
          })
          it("request dryruns successfully", async () => {
            const request = await WitnetRequest.at(craft.address)
            const registry = await WitnetBytecodes.at(await request.registry.call())
            bytecode = (await registry.bytecodeOf.call(await request.radHash.call())).slice(2)
            const output = await Witnet.Utils.dryRunBytecode(bytecode)
            let json
            try {
              json = JSON.parse(output)
            } catch {
              assert(false, "Invalid JSON: " + output)
            }
            const result = Witnet.Utils.processDryRunJson(json)
            summary.push({
              "Artifact": craft.artifact,
              "RAD hash": radHash.slice(2),
              "Status": result.status,
              "✓ Sources": result.totalRetrievals - result.nokRetrievals,
              "∑ Sources": result.totalRetrievals,
              "Time (secs)": result.runningTime,
              "Result": !("RadonError" in result.tally) ? result.tally : "(Failed)"
            })
            if (result.status !== "OK") {
              throw Error(result?.error || "Dry-run failed!")
            }
          })
          after(async () => {
            if (process.argv.includes("--verbose")) {
              const output = await Witnet.Utils.dryRunBytecodeVerbose(bytecode)
              console.info(output.split("\n").slice(0, -1).join("\n"))
              console.info("-".repeat(120))
            }
          })
        })
      }
    })
    after(async () => {
      if (summary.length > 0) {
        console.info(`\n${"=".repeat(148)}\n> DRY-RUN DATA REQUESTS:`)
        console.table(summary)
      }
    })
  })

  function findWitnetRequestCrafts (tree, headers) {
    if (!headers) headers = []
    const matches = []
    for (const key in tree) {
      if (tree[key]?.specs) {
        matches.push({
          artifact: key,
          address: findWitnetRequestAddress(key),
        })
      } else if (typeof tree[key] === "object") {
        matches.push(
          ...findWitnetRequestCrafts(
            tree[key],
            [...headers, key]
          )
        )
      }
    }
    return matches
  }

  function findWitnetRequestAddress (target) {
    const addrs = addresses.default?.test.requests
    for (const key in addrs) {
      if (key === target) {
        return addrs[key]
      }
    }
    return ""
  }

})

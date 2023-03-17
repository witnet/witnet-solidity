const { execSync } = require("child_process")
const utils = require("../assets/witnet/utils/js")

const addresses = require("../migrations/witnet/addresses")
const requests = require("../migrations/witnet/requests")

const selection = utils.getWitnetArtifactsFromArgs()

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequest = artifacts.require("WitnetRequest")

contract("migrations/witnet/requests", async () => {
  describe("My Witnet Requests...", async () => {
    const crafts = findWitnetRequestCrafts(requests)
    crafts.forEach(async (craft) => {
      if (
        craft.address !== "" &&
          (
            selection.length === 0 ||
              selection.includes(craft.artifact)
          )
      ) {
        describe(`${craft.artifact}`, async () => {
          let output
          it("request was actually deployed", async () => {
            const request = await WitnetRequest.at(craft.address)
            await request.radHash.call()
          })
          it("request dryruns successfully", async () => {
            const request = await WitnetRequest.at(craft.address)
            const registry = await WitnetBytecodes.at(await request.registry.call())
            const bytecode = await registry.bytecodeOf.call(await request.radHash.call())
            output = await dryRunBytecode(bytecode)
          })
          after(async () => {
            if (process.argv.includes("--verbose")) {
              console.info(output.split("\n").slice(0, -1).join("\n"))
              console.info("-".repeat(120))
            }
          })
        })
      }
    })
  })

  async function dryRunBytecode (bytecode) {
    return (await execSync(`npx witnet-toolkit try-query --hex ${bytecode}`)).toString()
  }

  function findWitnetRequestCrafts (tree, headers) {
    if (!headers) headers = []
    const matches = []
    for (const key in tree) {
      if (tree[key]?.retrievals || tree[key]?.template) {
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

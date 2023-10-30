const Witnet = require("witnet-utils")
const selection = Witnet.Utils.getWitnetArtifactsFromArgs()

const addresses = require("./addresses")
const templates = require("../assets").templates

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequest = artifacts.require("WitnetRequest")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

contract("migrations/witnet/templates", async () => {
  let summary = []
  describe("My Witnet Request Templates...", async () => {
    const crafts = findWitnetRequestTemplateCrafts(templates)
    await crafts.forEach(async (craft) => {
      if (
        craft.address !== "" &&
          (
            process.argv.includes("--all")
              || selection.includes(craft.key)
          )
      ) {
        describe(`${craft.key}`, async () => {
          for (const test in craft.artifact?.tests) {
            describe(`${test}`, async () => {
              const args = craft.artifact.tests[test]
              let bytecode
              it("parameterized request gets built", async () => {
                const template = await WitnetRequestTemplate.at(craft.address)
                await template.verifyRadonRequest(args)
              })
              it("parameterized request dryruns successfully", async () => {
                const template = await WitnetRequestTemplate.at(craft.address)
                const tx = await template.buildRequest(args)
                const events = tx.logs.filter(log => log.event === "WitnetRequestBuilt")
                assert(events.length > 0, "No WitnetRequest contract was built!")
                const request = await WitnetRequest.at(events[0].args.request)
                const radHash = await request.radHash.call()
                const registry = await WitnetBytecodes.at(await request.registry.call())
                bytecode = (await registry.bytecodeOf.call(radHash)).slice(2)
                const output = await Witnet.Utils.dryRunBytecode(bytecode)
                let json
                try {
                  json = JSON.parse(output)
                } catch {
                  assert(false, "Invalid JSON: " + output)
                }
                const result = Witnet.Utils.processDryRunJson(JSON.parse(output))
                summary.push({
                  "Artifact": craft.key,
                  "Test": test,
                  "Status": result.status,
                  "✓ Sources": result.totalRetrievals - result.nokRetrievals,
                  "∑ Sources": result.totalRetrievals,
                  "Time (ms)": result.runningTime,
                  "Result": !("RadonError" in result.tally) ? result.tally : "(Failed)"
                })
                if (result.status !== "OK") {
                  throw Error(result?.error || "Dry-run-failed!")
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
      }
    })
    after(async () => {
      if (summary.length > 0) {
        console.log(`\n${"=".repeat(148)}\n> DRY-RUN DATA REQUEST TEMPLATES:`)
        console.table(summary)
      }
    })
  })

  function findWitnetRequestTemplateCrafts (tree, headers) {
    if (!headers) headers = []
    const matches = []
    for (const key in tree) {
      if (tree[key]?.specs) {
        matches.push({
          key,
          artifact: tree[key],
          address: findWitnetRequestTemplateAddress(key),
        })
      } else if (typeof tree[key] === "object") {
        matches.push(
          ...findWitnetRequestTemplateCrafts(
            tree[key],
            [...headers, key]
          )
        )
      }
    }
    return matches
  }

  function findWitnetRequestTemplateAddress (target) {
    const addrs = addresses.default?.test.templates
    for (const key in addrs) {
      if (key === target) {
        return addrs[key]
      }
    }
    return ""
  }
})

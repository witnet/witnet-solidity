const utils = require("../../scripts/utils")

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequest = artifacts.require("WitnetRequest")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

contract("witnet-solidity/templates", async () => {

  const [, network] = utils.getRealmNetworkFromArgs();
  const addresses = require("./addresses")[network]
  const selection = utils.getWitnetArtifactsFromArgs()
  
  let summary = []
  
  describe("My Witnet Request Templates...", async () => {
    const crafts = utils.flattenWitnetArtifacts(witnet.templates)
    crafts.forEach(async (craft) => {
      const templateAddress = addresses.templates[craft?.key] || ""
      if (
        templateAddress !== "" &&
          (process.argv.includes("--all") || selection.includes(craft?.key))
      ) {
        describe(`${craft.key}`, async () => {
          for (const test in craft.artifact?.tests) {
            describe(`${test}`, async () => {
              const args = craft.artifact.tests[test]
              let bytecode
              it("parameterized request gets built", async () => {        
                const template = await WitnetRequestTemplate.at(templateAddress)
                await template.verifyRadonRequest(args)
              })
              it("parameterized request dryruns successfully", async () => {
                const template = await WitnetRequestTemplate.at(templateAddress)
                const tx = await template.buildRequest(args)
                const events = tx.logs.filter(log => log.event === "WitnetRequestBuilt")
                assert(events.length > 0, "No WitnetRequest contract was built!")
                const request = await WitnetRequest.at(events[0].args.request)
                const radHash = await request.radHash.call()
                const registry = await WitnetBytecodes.at(await request.registry.call())
                bytecode = (await registry.bytecodeOf.call(radHash)).slice(2)
                const output = await utils.dryRunBytecode(bytecode)
                let json
                try {
                  json = JSON.parse(output)
                } catch {
                  assert(false, "Invalid JSON: " + output)
                }
                const result = utils.processDryRunJson(JSON.parse(output))
                summary.push({
                  "Artifact": craft.key,
                  "Test": test,
                  "Status": result.status,
                  "✓ Sources": result.totalSources - result.nokSources,
                  "∑ Sources": result.totalSources,
                  "Time (secs)": result.runningTime,
                  "Result": !("RadonError" in result.tally) ? result.tally : "(Failed)"
                })
                if (result.status !== "OK") {
                  throw Error(result?.error || "Dry-run-failed!")
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
        })
      }
    })
    after(async () => {
      if (summary.length > 0) {
        console.info(`\n${"=".repeat(148)}\n> TEMPLATE DRY-RUNS:`)
        console.table(summary)
      }
    })
  })

  // function findWitnetRequestTemplateCrafts (tree, headers) {
  //   if (!headers) headers = []
  //   const matches = []
  //   for (const key in tree) {
  //     if (tree[key]?.specs) {
  //       matches.push({
  //         key,
  //         artifact: tree[key],
  //         address: findWitnetRequestTemplateAddress(key),
  //       })
  //     } else if (typeof tree[key] === "object") {
  //       matches.push(
  //         ...findWitnetRequestTemplateCrafts(
  //           tree[key],
  //           [...headers, key]
  //         )
  //       )
  //     }
  //   }
  //   return matches
  // }

  // function findWitnetRequestTemplateAddress (target) {
  //   const addrs = addresses.default?.test.templates
  //   for (const key in addrs) {
  //     if (key === target) {
  //       return addrs[key]
  //     }
  //   }
  //   return ""
  // }
})

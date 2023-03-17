const exec = require("child_process").execSync
const utils = require("../assets/witnet/utils/js")

const Witnet = require("witnet-requests")
const WitnetBytecodes = artifacts.require("WitnetBytecodes")

const hashes = require("../migrations/witnet/hashes")
const radons = require("../migrations/witnet/radons")

describe("migrations/witnet/hashes", async () => {
  let registry
  let modeNoFilters
  before(async () => {
    registry = await WitnetBytecodes.deployed()
    modeNoFilters = await registry.verifyRadonReducer.call([
      Witnet.Types.REDUCERS.mode,
      [],
      "0x",
    ])
    try {
      await registry.lookupRadonReducer.call(modeNoFilters)
    } catch {
      await registry.verifyRadonReducer([
        Witnet.Types.REDUCERS.mode,
        [],
        "0x",
      ])
    }
  })

  context("My Witnet Radon Reducers...", async () => {
    describe("Verified?", async () => {
      lookupReducers(hashes?.reducers)
    })
  })

  context("My Witnet Radon Retrievals...", async () => {
    describe("Verified?", async () => {
      lookupRetrievals(hashes?.retrievals)
    })
    describe("Responsive?", async () => {
      dryRunRetrievals(hashes?.retrievals)
    })
  })

  function dryRunRetrievals (hashes) {
    for (const tag in hashes) {
      const retrieval = utils.findRadonRetrievalSpecs(radons?.retrievals, tag)
      it(`['${tag}']`, async () => {
        assert(retrieval, "Witnet Radon Retrieval not found")
        const args = typeof retrieval.templateValues === "object"
          ? Object.values(retrieval.templateValues).map(samples => samples[0])
          : retrieval.templateValues.map(samples => samples[0])
        const hash = hashes[tag]
        const tx = await registry.verifyRadonRequest(
          [hash],
          modeNoFilters,
          modeNoFilters,
          0,
          [args]
        )
        const logs = tx.logs.filter(log => log.event === "NewRadHash")
        let radHash
        if (logs.length === 1) {
          radHash = logs[0].args.hash
        } else {
          radHash = await registry.verifyRadonRequest.call(
            [hash],
            modeNoFilters,
            modeNoFilters,
            0,
            [args]
          )
        }
        const bytecode = await registry.methods["bytecodeOf(bytes32)"].call(radHash)
        const errors = exec(
          `npx witnet-toolkit try-query --hex ${
            bytecode
          } | grep Error | wc -l`
        ).toString().split("\n")[0]
        if (errors !== "0") {
          throw exec(
            `npx witnet-toolkit try-query --hex ${
              bytecode
            } | grep Error`
          ).toString()
        }
      })
    }
  }

  function lookupReducers (tree, path) {
    for (const branch in tree) {
      const subpath = path ? `${path}['${branch}']` : `['${branch}']`
      if (typeof tree[branch] === "object") {
        lookupReducers(tree[branch], subpath)
      } else {
        it(`${subpath}`, async () => {
          const hash = tree[branch]
          await registry.lookupRadonReducer.call(hash, { from: null })
        })
      }
    }
  }

  function lookupRetrievals (tree, path) {
    for (const branch in tree) {
      const subpath = path ? `${path}['${branch}']` : `['${branch}']`
      if (typeof tree[branch] === "object") {
        lookupRetrievals(tree[branch], subpath)
      } else {
        it(`${subpath}`, async () => {
          const hash = tree[branch]
          await registry.lookupRadonRetrieval.call(hash, { from: null })
        })
      }
    }
  }
})

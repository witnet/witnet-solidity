#!/usr/bin/env node

const execSync = require('child_process').execSync;
const fs = require("fs");
const Witnet = require("witnet-utils")

if (process.argv.length >= 3) {
    const command = process.argv[2]
    if (command === "init") {
        init();
    } else if (command === "avail") {
        avail();
    } else if (command === "test") {
        test();
    } else if (command === "compile") {
        compile();
    } else if (command === "console") {
        truffleConsole();
    } else if (command === "deploy") {
        deploy();
    } else if (command === "version") {
        version();
    } else {
        showMainUsage()
    }
} else {
    showMainUsage()
}

function showMainUsage() {
    console.info(process.argv[1], "usage:")
    console.info()
    console.info("  ", "init", "\t\t=>", "Initialize Witnet artifact, folders and scripts.")
    console.info("  ", "avail", "\t\t=>", "List available resources from Witnet.")
    console.info("  ", "compile", "\t\t=>", "Check that all Witnet assets within this project are properly declared.")
    console.info("  ", "console", "\t\t=>", "Open Truffle console as to interact with Witnet deployed artifacts.")
    console.info("  ", "deploy", "\t\t=>", "Deploy Witnet requests and templates defined within the ./migrations/witnet/ folder.")
    console.info("  ", "test", "\t\t=>", "Dry-run requests and templates defined within the ./migrations/witnet/ folder.")
    console.info("  ", "version", "\t\t=>", "Shows version.")
}

function showAvailUsage() {
    console.info("Usage:")
    console.info()
    console.info("  ", "$ npx witnet avail")
    console.info("  ", "  ", "--chains [<optional-list>]", "\t=>", "List supported sidechains and main Witnet artifact addresses.")
    console.info("  ", "  ", "--requests [<optional-list>]", "\t=>", "List of deployed WitnetRequest addresses within given chain.")
    console.info("  ", "  ", "--templates [<optional-list>]", "\t=>", "List of deployed WitnetRequestTemplate addresses within given chain.")
    console.info("  ", "  ", "--retrievals [<optional-list>]", "\t=>", "Structured breakdown of known Witnet Radon Retrievals.")
}

function init() {
    if (!fs.existsSync("./assets/witnet/abis")) {
        fs.mkdirSync("./assets/witnet/abis", { recursive: true })
    }    
    if (!fs.existsSync("./contracts")) {
        fs.mkdirSync("./contracts", { recursive: true })
    }
    if (!fs.existsSync("./migrations/truffle")) {
        fs.mkdirSync("./migrations/truffle", { recursive: true })
    }    
    if (!fs.existsSync("./migrations/witnet")) {
        fs.mkdirSync("./migrations/witnet", { recursive: true })
    }    
    if (!fs.existsSync("./test")) {
        fs.mkdirSync("./test", { recursive: true })
    }    
    if (!fs.existsSync(".env_witnet")) {
        fs.cpSync("node_modules/witnet-solidity/.env_witnet", ".env_witnet")
    }    
    fs.cpSync(
        "node_modules/witnet-solidity/assets/witnet/index.js",
        "./assets/witnet/index.js",
    )
    fs.cpSync(
        "node_modules/witnet-solidity/contracts/WitnetMigrations.sol",
        "./contracts/WitnetMigrations.sol",
    )
    fs.cpSync(
        "node_modules/witnet-solidity/migrations/truffle",
        "./migrations/truffle",
        { recursive: true, force: true, }
    )
    fs.cpSync(
        "node_modules/witnet-solidity/migrations/witnet/truffle-config.js",
        "./migrations/witnet/truffle-config.js",
        { force: true, }
    )
    fs.cpSync(
        "node_modules/witnet-solidity/test/witnet.requests.spec.js",
        "./test/witnet.requests.spec.js",
        { recursive: true, force: true, }
    )
    fs.cpSync(
        "node_modules/witnet-solidity/test/witnet.templates.spec.js",
        "./test/witnet.templates.spec.js",
        { recursive: true, force: true, }
    )
    let empty_json = `{}`
    if (!fs.existsSync("./migrations/witnet/addresses.json")) {
        fs.writeFileSync("./migrations/witnet/addresses.json", empty_json)
    }
    let assets_witnet_addresses = `
module.exports = {
    ...require("witnet-solidity/assets/witnet/addresses"),
    ...require("../../migrations/witnet/addresses"),
};
`
    if (!fs.existsSync("./assets/witnet/addresses.js")) {
        fs.writeFileSync("./assets/witnet/addresses.js", assets_witnet_addresses)
    }
    let assets_witnet_requests = `
module.exports = {
    ...require("witnet-solidity/migrations/witnet/requests"),
    ...require("../../migrations/witnet/requests"),
};
`
    if (!fs.existsSync("./assets/witnet/requests.js")) {
        fs.writeFileSync("./assets/witnet/requests.js", assets_witnet_requests)
    }
    let assets_witnet_retrievals = `
module.exports = {
    ...require("witnet-solidity/migrations/witnet/retrievals"),
    ...require("../../migrations/witnet/retrievals"),
};
`
    if (!fs.existsSync("./assets/witnet/retrievals.js")) {
        fs.writeFileSync("./assets/witnet/retrievals.js", assets_witnet_retrievals)
    }
    let assets_witnet_tempales = `
module.exports = {
    ...require("witnet-solidity/migrations/witnet/templates"),
    ...require("../../migrations/witnet/templates"),
};
`
    if (!fs.existsSync("./assets/witnet/templates.js")) {
        fs.writeFileSync("./assets/witnet/templates.js", assets_witnet_templates)
    }
    let migrations_witnet_requests = `
const Witnet = require("witnet-utils")

const retrievals = require('../../assets/witnet').retrievals
const templates = require('../../assets/witnet').templates

module.exports = {
    /////// STATIC REQUESTS /////////////////////////////////////////////////////////
    // path: { ... path: {
    //      WitnetRequestXXX: Witnet.StaticRequest({ 
    //          retrieve: [ Witnet.Retrievals.., ..., retrievals['retrieval-artifact-name-x'], ... ],
    //          aggregate?: Witnet.Reducers..,
    //          tally?: Witnet.Reducers..,
    //      }),
    ////// REQUESTS FROM TEMPLATE ///////////////////////////////////////////////////
    //      WitnetRequestYYY: Witnet.RequestFromTemplate(
    //          templates['template-artifact-name'], 
    //          [ [ .. ], .. ], // args: string[][]
    //      ),
    ////// REQUESTS FROM RETRIEVALS DICTIONARY //////////////////////////////////////
    //      WitnetRequestZZZ: Witnet.RequestFromDictionary({
    //          retrieve: {
    //              dict: retrievals,
    //              tags: { 
    //                  'retrieval-artifact-name-1': [ [ .. ], .. ], // args: string[][]
    //                  ...
    //              },
    //          },
    //          aggregate?: Witnet.Reducers.., // aggregate
    //          tally?: Witnet.Reducers.., // tally     
    //      }),
    // }, ... }, 
};     
`
    if (!fs.existsSync("./migrations/witnet/requests.js")) {
        fs.writeFileSync("./migrations/witnet/requests.js", migrations_witnet_requests)
    }
    let migrations_witnet_templates = `
const Witnet = require("witnet-utils")
const retrievals = require('../../assets/witnet').retrievals

module.exports = {
    /////// REQUEST TEMPLATES ///////////////////////////////////////////////////////
    // path: { ... path: {
    //      WitnetRequestTemplateXXX: Witnet.RequestTemplate({
    //          specs: {
    //              retrieve: [ retrievals['retrieval-artifact-name-x'], ... ],
    //              aggregate?: Witnet.Reducers..,
    //              tally?: Witnet.Reducers..,
    //          },
    //          tests?: {
    //              "test-description-1": [
    //                  [ "..", ... ], // retrieval #0 args (string[])
    //                  ...
    //              ],
    //              ...
    //          }
    //      },
    //      ...
    // }, ... },
};    
`
    if (!fs.existsSync("./migrations/witnet/templates.js")) {
        fs.writeFileSync("./migrations/witnet/templates.js", migrations_witnet_templates)
    }
    let migrations_witnet_retrievals = `
const Witnet = require("witnet-utils")
    
module.exports = {
    // path: { ... path: {
    /////// HTTP-GET RETRIEVALS /////////////////////////////////////////////////////
    //      'retrieval-unique-resource-name-x': Witnet.Retrievals.HttpGet(
    //          url: "http-or-https://authority/path?query",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    /////// HTTP-POST RETRIEVALS ////////////////////////////////////////////////////
    //      'retrieval-unique-resource-name-y': Witnet.Retrievals.HttpPut(
    //          url: "http-or-https://authority/path?query",
    //          body?: "...",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    /////// GRAPH-QL QUERIES ////////////////////////////////////////////////////////
    //      'retrieval-unique-resource-name-z': Witnet.Retrievals.GraphQL(
    //          url: "http-or-https://authority/path?query",
    //          query: "...",
    //          headers?: {
    //              "http-header-tag": "http-header-value",
    //              ...,
    //          },
    //          script?: Witnet.Script..,
    //      }),
    // }, ... }, 
);
`
    if (!fs.existsSync("./migrations/witnet/retrievals.js")) {
        fs.writeFileSync("./migrations/witnet/retrievals.js", migrations_witnet_retrievals)
    }
    version()
}

function avail() {
    if (process.argv.includes("--chains")) {
        const addresses = require("../../../../assets/witnet")?.addresses
        let selection = Witnet.Utils.splitSelectionFromProcessArgv("--chains").map(value => {
            return value.toLowerCase() === "ethereum" ? "default" : value.toLowerCase()
        })
        if (process.env.WITNET_SIDECHAIN) {
            // add `WITNET_SIDECHAIN` to selection, should no --chains list be provided from CLI
            selection = [ process.env.WITNET_SIDECHAIN.toLowerCase().trim().replaceAll(":", ".") ]
        }
        if (!selection || selection.length == 0) {
            // if no chains list was specified, just list Witnet supported "ecosystems"
            Witnet.Utils.traceHeader("WITNET SUPPORTED ECOSYSTEMS")
            for (let ecosystem in addresses) {
                if (ecosystem === "default") ecosystem = "ethereum"
                console.info("  ", ecosystem.toUpperCase())
            }
            console.info()
            console.info("To get Witnet-supported chains within a list of ecosystems:")
            console.info()
            console.info("  ", "$ npx witnet avail --chains <comma-separated-witnet-supported-ecosystems>")
            console.info()
            console.info("Note: the --chains operand can be omitted if the WITNET_SIDECHAIN environment variable is set.")
            console.info()
            process.exit(0)
        }
        let found = 0
        for (let ecosystem in addresses) {
            if (selection.includes(ecosystem)) {
                found ++
                // if ecosystem matches any of selection items, 
                // print Witnet supported "chains" within it
                const caption = ecosystem === "default" ? "ETHEREUM" : ecosystem.toUpperCase()
                Witnet.Utils.traceHeader(`WITNET SUPPORTED CHAINS ON '${caption}' ECOSYSTEM`)
                for (const network in addresses[ecosystem]) {
                    console.info("  ", network.replaceAll(".", ":"))
                }
                console.info()
                console.info("To get Witnet artifact addresses within one or more chains:")
                console.info()
                console.info("  ", "$ npx witnet avail --chains <comma-separated-witnet-supported-chains> [--artifacts <comma-separated-witnet-artifact-names>]")
                console.info()
                console.info("Principal Witnet artifact addresses will be shown if no artifact name list is specified.")
                console.info()
            } else {
                // otherwise, search for selection matches with any chain within this ecosystem
                for (let network in addresses[ecosystem]) {
                    if (selection.length == 0 || selection.includes(network)) {
                        found ++
                        Witnet.Utils.traceHeader(`WITNET ARTIFACTS ON '${network.replaceAll(".", ":").toUpperCase()}'`)
                        if (traceWitnetAddresses(addresses[ecosystem][network], Witnet.Utils.getWitnetArtifactsFromArgs()) == 0) {
                            console.info("  ", "Unavailable.")
                        }
                    }
                }   
            }
        }
        if (!found) {
            console.info()
            console.info("Sorry, no entries found for chains: ", selection)
        }
    } else if (process.argv.includes("--requests")) {
        const requests = require("../../../../assets/witnet")?.requests
        const selection = Witnet.Utils.splitSelectionFromProcessArgv("--requests")
        if (!traceWitnetRequestCrafts(requests, selection)) {
            if (selection.length > 0) {
                console.info()
                console.info("Sorry, no WitnetRequest artifacts were found by given names:", selection)
            } else {
                console.info()
                console.info("Sorry, no WitnetRequest artifacts have yet been declared within this project.")
            }
            process.exit(0)
        }
    } else if (process.argv.includes("--templates")) {
        const templates = require("../../../../assets/witnet")?.templates
        const selection = Witnet.Utils.splitSelectionFromProcessArgv("--templates")   
        if (!traceWitnetRequestTemplateCrafts(templates, selection)) {
            if (selection.length > 0) {
                console.info()
                console.info("Sorry, no WitnetRequestTemplate artifacts were found by given names:", selection)
            } else {
                console.info()
                console.info("Sorry, no WitnetRequestTemplate artifacts have yet been declared within this project.")
            }
            process.exit(0)
        }
    } else if (process.argv.includes("--retrievals")) {
        const retrievals = require("../../../../assets/witnet")?.retrievals
        const selection = Witnet.Utils.splitSelectionFromProcessArgv("--retrievals")
        if (selection.length == 0) {
            Witnet.Utils.traceHeader("WITNET RETRIEVALS")
            traceWitnetRetrievalsBreakdown(retrievals)
            console.info()
            console.info("To delimit tree breakdown, or show the specs of a group of leafs:")
            console.info()
            console.info("  ", "$ npx witnet avail --retrievals <comma-separated-unique-resource-names>")
            console.info()
        } else {
            for (const index in selection) {
                const key = selection[index]
                Witnet.Utils.traceHeader(key)
                try { 
                    const specs = Witnet.Utils.findRadonRetrievalSpecs(retrievals, key)
                    if (specs?.requestMethod) {
                        traceWitnetRetrievalSpecs(specs)
                    } else {
                        traceWitnetRetrievalsBreakdown(specs)
                    }
                } catch (ex) {
                    console.info("  ", "> Error:", ex)
                }
            }
        }
    } else {
        showAvailUsage();
    }
}

function compile() {
    Witnet.Utils.traceHeader("Compiling your Witnet assets...")
    console.info("  ", "> Retrievals:", Witnet.countLeaves(Witnet.Retrievals.Class, require("../../assets/witnet/retrievals")));
    console.info("  ", "> Templates: ", Witnet.countLeaves(Witnet.Artifacts.Template, require("../../assets/witnet/templates")));
    console.info("  ", "> Requests:  ", Witnet.countLeaves(Witnet.Artifacts.Class, require("../../assets/witnet/requests")));    
    console.info("\nAll assets compiled successfully!")
}

function test() {
    let oIndex = -1
    process.argv.map((value, index) => {
        if (value.startsWith("--") && oIndex === -1) {
            oIndex = index
        }
    })
    const args = (oIndex >= 0) ? process.argv.slice(oIndex).join(" ") : ""
    try {
        execSync(`truffle test --config migrations/witnet/truffle-config.js --migrations_directory migrations/truffle test/witnet.templates.spec.js test/witnet.requests.spec.js ${args}`, { stdio: 'inherit' })
    } catch {}
    if (!process.argv.includes("--artifacts")) {
        console.info("Notes")
        console.info("=====")
        console.info("> You may restrict list of templates and/or requests to be tested:")
        console.info()
        console.info("  $ npx witnet test --artifacts <comma-separated-artifact-names> [--verbose]")
        console.info()
    }
}

function truffleConsole() {
    let chain
    if (process.argv.length > 3 && !process.argv[3].startsWith("-")) {
        chain = Witnet.Utils.getRealmNetworkFromString(process.argv[3].toLowerCase().trim().replaceAll(":", "."))
    } else if (process.env.WITNET_SIDECHAIN) {
        chain = Witnet.Utils.getRealmNetworkFromString(process.env.WITNET_SIDECHAIN.toLowerCase().trim().replaceAll(":", "."))
    } else {
        console.info()
        console.info("Usage:")
        console.info()
        console.info("  $ npx witnet console <witnet-supported-chain>")
        console.info()
        console.info("To get a list of <witnet-supported-chain>:")
        console.info()
        console.info("  $ npx witnet avail --chains")
        console.info()
        console.info("No need to specify <witnet-supported-chain> if WITNET_SIDECHAIN environment variable is set, though.")
        console.info("However, if <witnet-supported-chain> is specified, that will always prevail upon the value of WITNET_SIDECHAIN.")
        process.exit(0)
    }
    const addresses = require("../../../../assets/witnet")?.addresses[chain[0]][chain[1]]
    Witnet.Utils.traceHeader(`WITNET ARTIFACTS ON '${chain[1].replaceAll(".", ":").toUpperCase()}'`)
    if (traceWitnetAddresses(addresses, []) == 0) {
        console.info("  ", "None available.")
    }
    try {
        execSync(`truffle console --config migrations/witnet/truffle-config.js --migrations_directory migrations/truffle --network ${chain[1]}`, { stdio: 'inherit' })
    } catch {}
}

function deploy() {
    let chain
    if (process.argv.length > 3 && !process.argv[3].startsWith("-")) {
        chain = Witnet.Utils.getRealmNetworkFromString(process.argv[3].toLowerCase().trim().replaceAll(":", "."))
    } else if (process.env.WITNET_SIDECHAIN) {
        chain = Witnet.Utils.getRealmNetworkFromString(process.env.WITNET_SIDECHAIN.toLowerCase().trim().replaceAll(":", "."))
    } else {
        console.info()
        console.info("Usage:")
        console.info()
        console.info("  $ npx witnet deploy <witnet-supported-chain> --artifacts <comma-separated-artifacts-to-be-deployed>")
        console.info()
        console.info("To get a list of <witnet-supported-chain>:")
        console.info()
        console.info("  $ npx witnet avail --chains")
        console.info()
        console.info("No need to specify <witnet-supported-chain> if WITNET_SIDECHAIN environment variable is set, though.")
        console.info("However, if <witnet-supported-chain> is specified, that will always prevail upon the value of WITNET_SIDECHAIN.")
        process.exit(0)
    }   
    let oIndex = -1
    process.argv.map((value, index) => {
        if (value.startsWith("--") && oIndex === -1) {
            oIndex = index
        }
    })
    const args = (oIndex >= 0) ? process.argv.slice(oIndex).join(" ") : ""
    try {
        execSync(`truffle migrate --config migrations/witnet/truffle-config.js --migrations_directory migrations/truffle --network ${chain[1]} ${args}`, { stdio: 'inherit' })
    } catch {}    
    if (!process.argv.includes("--artifacts")) {
        console.info("Notes")
        console.info("=====")
        console.info("> Depending on the contents of your migrations/witnet/addresses.json file,")
        console.info("> you may need to specify a list of templates and/or requests to be deployed:")
        console.info()
        console.info("    $ npx witnet deploy [<witnet-supported-chain>] --artifacts <comma-separated-artifact-names>")
        console.info()
      }
}

function version() {
    console.info()
    console.info(`Witnet Solidity utility command v${require("../../package.json").version}`)
    console.info()
    showMainUsage();
}

/// ---- internal functions -------------------------------------------------------------------------------------------

function orderKeys(obj) {
    var keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
        if (k1 < k2) return -1;
        else if (k1 > k2) return +1;
        else return 0;
    });
    var i, after = {};
    for (i = 0; i < keys.length; i++) {
      after[keys[i]] = obj[keys[i]];
      delete obj[keys[i]];
    }
    for (i = 0; i < keys.length; i++) {
      obj[keys[i]] = after[keys[i]];
    }
    return obj;
  }

function traceWitnetAddresses(addresses, selection, level) {
    let found = 0
    for (const key in orderKeys(addresses)) {
        if (typeof addresses[key] === "object") {
            found += traceWitnetAddresses(addresses[key], selection, (level || 0) + 1)
        } else {
            if (
                (selection.length === 0
                    && key !== "Create2Factory"
                    && !key.endsWith("Implementation")
                    && !key.endsWith("Lib")
                    && !key.endsWith("Proxy")
                ) || selection.includes(key)
            ) {
                found ++
                if (level) {
                    console.info("  ", `\x1b[33m${addresses[key]}\x1b[0m`, "\t<=", `\x1b[37m${key}\x1b[0m`);
                } else {
                    console.info("  ", `\x1b[1;33m${addresses[key]}\x1b[0m`, "\t<=", `\x1b[1;37m${key}\x1b[0m`);
                }
            }
        }
    }
    return found
}

function traceWitnetRequestCrafts(crafts, selection) {
    const templates = require("../../../../assets/witnet")?.templates
    let found  = 0
    for (const key in crafts) {
        const craft = crafts[key]
        if (craft?.retrievals) {
            if (selection.length > 0 && !selection.includes(key)) continue;
            found ++
            Witnet.Utils.traceHeader(key)
            console.info("  ", "> Data sources:")
            const urns = Object.keys(craft.retrievals)
            for (let j = 0; j < urns.length; j ++) {
                const tabs = urns[j].length > 14 ? "\t": "\t\t"
                console.info("  ", " ", `[${j + 1}] ${urns[j]}${tabs}=>`, craft.retrievals[urns[j]]);
            }
            if (craft?.aggregator) {
                console.info("  ", "> Aggregator:\t", craft.aggregator)
            }
            if (craft?.tally) {
                console.info("  ", "> Witness tally:\t", craft.tally)
            }
        } else if (craft?.template) {
            if (selection.length > 0 && !selection.includes(key)) continue;
            found ++
            Witnet.Utils.traceHeader(key)
            console.info("  ", "> Template artifact:  ", craft.template)
            const template = Witnet.Utils.findTemplateArtifact(templates, craft.template)
            if (!template) {
                console.info("  ", "> Unavailable!.")
            } else {
                if (template?.retrievals && template?.retrievals.length > 0) {
                    if (craft?.args && craft.args.length >= template.retrievals.length) {
                      console.info("  ", "> Request parameters:");
                      for (let j = 0; j < template.retrievals.length; j++) {
                        const args = Array.isArray(craft.args[j])
                          ? craft.args[j]
                          : Object.keys(craft.args[j]).map(key => craft.args[j][key])
                        console.info("  ", " ", `[${j + 1}] ${template.retrievals[j]}`, "=>", args);
                      }
                    } else {
                      console.info("  ", "> Request parameters not properly set!.");
                    }
                }
            }
        } else if (!craft?.args && !craft?.aggregator && !craft?.tally) {
            found += traceWitnetRequestCrafts(craft, selection)
        }
    }
    return found
}

function traceWitnetRequestTemplateCrafts(crafts, selection) {
    let found = 0 
    for (const key in crafts) {
        const craft = crafts[key]
        if (craft?.retrievals) {
            if (selection.length > 0 && !selection.includes(key)) continue;
            found ++
            Witnet.Utils.traceHeader(key)
            if (craft.retrievals.length === 1) {
                console.info("  ", "> Data source:\t", craft.retrievals[0])
            } else {
                console.info("  ", "> Data sources:\t")
                for (let j = 0; j < craft.retrievals.length; j ++) {
                    console.info("  ", " ", `[${j + 1}]`, craft.retrievals[j])
                } 
            }
            if (craft?.aggregator) {
                console.info("  ", "> Aggregator:\t", craft.aggregator)
            }
            if (craft?.tally) {
                console.info("  ", "> Witness tally:\t", craft.tally)
            }
        } else {
            found += traceWitnetRequestTemplateCrafts(craft, selection)
        }
    }
    return found
}

function traceWitnetReducerCrafts(reducers, selection, level) {
    if (selection.length == 0) {
        for (const key in reducers) {
            console.info(" ", " ".repeat(3 * (level || 0)), key)
            if (!reducers[key]?.opcode && reducers[key].opcode !== undefined) {
                traceWitnetReducerCrafts(reducers[key], selection, level ? level + 1 : 1)
            }
        }
    } else {
        for (const key in reducers) {
            if (reducers[key]?.opcode) {
                if (selection.includes(key)) {
                    traceWitnetReducerCraft(key, reducers[key])
                }
            } else {
                traceWitnetReducerCrafts(reducers[key], selection)
            }
        }
    }
}

function traceWitnetReducerCraft(key, craft) {
    Witnet.Utils.traceHeader(key)
    if (craft?.opcode) {
        console.info("  ", "> Operator:\t", Witnet.Utils.stringifyWitnetReducerOperator(craft.opcode))
    }
    if (craft?.filters && craft.filters.length > 0) {
        if (craft.filters.length == 1) {
            console.info("  ", "> Filter:\t", Witnet.Utils.stringifyWitnetReducerFilter(craft.filters[0]))
        } else {
            console.info("  ", "> Filters:")
            for (let j = 0; j < craft.filters.length; j ++) {
                console.info("    ", `#${j + 1} =>`, Witnet.Utils.stringifyWitnetReducerFilter(craft.filters[j]))
            }
        }
    }
}

function traceWitnetRetrievalsBreakdown(retrievals, level) {
    if (retrievals?.requestMethod) return;    
    for (const key in retrievals) {
        console.info(" ", " ".repeat(3 * (level || 0)), key)
        traceWitnetRetrievalsBreakdown(retrievals[key], level ? level + 1 : 1)
    }
}

function traceWitnetRetrievalSpecs(specs) {
    if (specs?.requestMethod) {
        console.info("  ", "> Request method: ", Witnet.Utils.stringifyWitnetRequestMethod(specs.requestMethod))
        if (specs.requestMethod !== Witnet.Types.RETRIEVAL_METHODS.Rng) {
            const requestPath = `${specs?.requestSchema}${specs?.requestAuthority}/${specs?.requestPath}${specs?.requestQuery ? `?${specs.requestQuery}` : ""}`
            console.info("  ", "> Request URL:    ", requestPath)
        }
        if (specs?.requestHeaders && specs.requestHeaders.length > 0) {
            console.info("  ", "> Request headers:", specs.requestHeaders)
        }
        if (specs?.requestBody) {
            console.info("  ", "> Request body:   ", specs.requestBody)
        }
        if (specs?.requestScript) {
            console.info("  ", "> Witnet script:  ", JSON.stringify(specs.requestScript.script))
        }
        if (specs?.templateValues) {
            console.info("  ", "> Customization samples:")
            if (Array.isArray(specs.templateValues)) {
                for (var j = 0; j < specs.templateValues.length; j ++) {
                    console.info("  ", " ", `#${j + 1} =>`, JSON.stringify(specs.templateValues[j]))
                }
            } else if (typeof specs.templateValues === "object") {
                const keys = Object.keys(specs.templateValues)
                keys.map(key => { 
                    console.info("  ", " ", key, "=>", JSON.stringify(specs.templateValues[key]))
                })
            }
        }
    }
}
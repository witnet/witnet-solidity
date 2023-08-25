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
    } else if (command === "check") {
        check();
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
    console.info("  ", "check", "\t\t=>", "Check that all Witnet assets within this project are properly declared.")
    console.info("  ", "console", "\t\t=>", "Open Truffle console as to interact with Witnet deployed artifacts.")
    console.info("  ", "deploy", "\t\t=>", "Deploy Witnet requests and templates defined within the ./migrations/witnet/ folder.")
    console.info("  ", "test", "\t\t=>", "Dry-run requests and templates defined within the ./migrations/witnet/ folder.")
    console.info("  ", "version", "\t\t=>", "Shows version.")
}

function showAvailUsage() {
    console.info("Usage:")
    console.info()
    console.info("  ", "$ npx witnet avail")
    console.info("  ", "  ", "--chains [<optional-list>]", "\t=>", "List supported sidechains and deployed Witnet artifact addresses within those.")
    console.info("  ", "  ", "--requests [<optional-list>]", "\t=>", "Show details of all Witnet request artifacts currently available for deployment.")
    console.info("  ", "  ", "--templates [<optional-list>]", "\t=>", "Show details of all Witnet template artifacts currently available for deployment.")
    console.info("  ", "  ", "--retrievals [<optional-list>]", "\t=>", "Show details of Witnet data retriving scripts referable from other Witnet artifacts.")
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
    // if (!fs.existsSync("truffle-config.js")) {
    //     fs.cpSync("node_modules/witnet-solidity/truffle-config.js", "truffle-config.js")
    // }
    fs.cpSync(
        "node_modules/witnet-solidity/assets/witnet/abis/",
        "./assets/witnet/abis/",
        { recursive: true, force: true, }
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
    let assets_witnet_addresses = 
`module.exports = {
    ...require("witnet-solidity/assets/witnet/addresses"),
    ...require("../../migrations/witnet/addresses"),
};
`
    if (!fs.existsSync("./assets/witnet/addresses.js")) {
        fs.writeFileSync("./assets/witnet/addresses.js", assets_witnet_addresses)
    }
    let assets_witnet_requests = 
`module.exports = {
    ...require("witnet-solidity/migrations/witnet/requests"),
    ...require("../../migrations/witnet/requests"),
};
`
    if (!fs.existsSync("./assets/witnet/requests.js")) {
        fs.writeFileSync("./assets/witnet/requests.js", assets_witnet_requests)
    }
    let assets_witnet_retrievals = 
`module.exports = {
    ...require("witnet-solidity/migrations/witnet/retrievals"),
    ...require("../../migrations/witnet/retrievals"),
};
`
    if (!fs.existsSync("./assets/witnet/retrievals.js")) {
        fs.writeFileSync("./assets/witnet/retrievals.js", assets_witnet_retrievals)
    }
    let assets_witnet_templates = 
`module.exports = {
    ...require("witnet-solidity/migrations/witnet/templates"),
    ...require("../../migrations/witnet/templates"),
};
`
    if (!fs.existsSync("./assets/witnet/templates.js")) {
        fs.writeFileSync("./assets/witnet/templates.js", assets_witnet_templates)
    }
    let migrations_witnet_requests = 
`const Witnet = require("witnet-utils")
const retrievals = new Witnet.Dictionary(Witnet.Retrievals.Class, require("../../assets/witnet/retrievals"))
const templates = new Witnet.Dictionary(Witnet.Artifacts.Template, require("../../assets/witnet/templates"))

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
    let migrations_witnet_templates = 
`const Witnet = require("witnet-utils")
const retrievals = new Witnet.Dictionary(Witnet.Retrievals.Class, require("../../assets/witnet/retrievals"))

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
    let migrations_witnet_retrievals = 
`const Witnet = require("witnet-utils")

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
};
`
    if (!fs.existsSync("./migrations/witnet/retrievals.js")) {
        fs.writeFileSync("./migrations/witnet/retrievals.js", migrations_witnet_retrievals)
    }
    version()
}

function avail() {
    
    const addresses = require("../../../../assets/witnet/addresses");
    const requests = require("../../../../assets/witnet/requests");
    const retrievals = require("../../../../assets/witnet/retrievals");
    const templates = require("../../../../assets/witnet/templates");

    if (process.argv.includes("--chains")) {
        let selection = Witnet.Utils.splitSelectionFromProcessArgv("--chains").map(value => {
            return value.toLowerCase() === "ethereum" ? "default" : value.toLowerCase()
        })
        // add `WITNET_SIDECHAIN` to selection, should no chains list be provided from CLI
        if ((!selection || selection.length == 0) && process.env.WITNET_SIDECHAIN) {
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
        const selection = Witnet.Utils.splitSelectionFromProcessArgv("--requests")
        if (!traceWitnetArtifacts(requests, selection)) {
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
        const selection = Witnet.Utils.splitSelectionFromProcessArgv("--templates")   
        if (!traceWitnetArtifacts(templates, selection)) {
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
            const dict = Witnet.Dictionary(Object, retrievals)
            for (const index in selection) {
                const key = selection[index]
                try {
                    const retrieval = dict[key]
                    if (retrieval?.method) {
                        console.info("\n  ", `\x1b[1;37m${key}\x1b[0m`)
                        console.info("  ", "=".repeat(key.length))
                        traceWitnetRetrieval(retrieval)
                    } else {
                        console.info("\n  ", `\x1b[1;37m${key}\x1b[0m`)
                        console.info("  ", "=".repeat(key.length))
                        traceWitnetRetrievalsBreakdown(retrieval)
                    }
                } catch (ex) {
                    console.info("\n  ", `\x1b[1;31m${key}\x1b[0m`)
                    console.info("  ", "=".repeat(key.length))
                    console.info("  ", ">", ex.toString().split('\n')[0])
                }
            }
        }
    } else {
        showAvailUsage();
    }
}

function check() {
    Witnet.Utils.traceHeader(`Checking your Witnet assets...`)
    console.info("  ", "> Requests:  ", Witnet.countLeaves(Witnet.Artifacts.Class, require("../../../../assets/witnet/requests")));
    console.info("  ", "> Templates: ", Witnet.countLeaves(Witnet.Artifacts.Template, require("../../../../assets/witnet/templates")));
    console.info("  ", "> Retrievals:", Witnet.countLeaves(Witnet.Retrievals.Class, require("../../../../assets/witnet/retrievals")));    
    console.info("\nAll assets checked successfully!")
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
    const addresses = require("../../../../assets/witnet/addresses")[chain[0]][chain[1]]
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

function traceWitnetArtifacts(crafts, selection) {
    let found = 0 
    for (const key in orderKeys(crafts)) {
        const craft = crafts[key]
        const specs = craft?.specs
        if (specs) {
            const args = crafts[key]?.args
            if (selection.length > 0 && !selection.includes(key)) continue;
            found ++
            console.info(`\n   \x1b[1;37m${key}\x1b[0m`)
            console.info("  ", "=".repeat(key.length))
            if (specs?.retrieve.length == 1) {
                if (specs.retrieve[0]?.argsCount) {
                    if (!args || args.length == 0) {
                        console.info("  ", `[1] RETRIEVE:\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(specs.retrieve[0].method)}(\x1b[0;32m<${specs.retrieve[0].argsCount} args>\x1b[1;32m)\x1b[0m`)
                    } else {
                        console.info("  ", `[1] RETRIEVE:\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(specs.retrieve[0].method)}(\x1b[0;32m${JSON.stringify(args[0])}\x1b[1;32m\x1b[0m`)
                    }
                } else {
                    console.info("  ", `[1] RETRIEVE:\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(specs.retrieve[0].method)}()\x1b[0m`)
                }
            } else {
                console.info("  ", `[1] RETRIEVE:`)
            }
            specs?.retrieve.map((value, index) => {
                if (specs?.retrieve.length > 1) {
                    if (value?.argsCount) {
                        if (!args[index] || args[index].length == 0) {
                            console.info("  ", `    [#${index}]\t\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(value.method)}(\x1b[0;32m<${value.argsCount} args>\x1b[1;32m)\x1b[0m`)
                        } else {
                            console.info("  ", `    [#${index}]\t\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(value.method)}(\x1b[0;32m${JSON.stringify(args[index])}\x1b[1;32m)\x1b[0m`)
                        }
                    } else {
                        console.info("  ", `    [#${index}]\t\t\x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(value.method)}()\x1b[0m`)
                    }
                }
                traceWitnetArtifactRetrieval(value)
            })
            if (specs?.aggregate) {
                console.info("  ", `[2] AGGREGATE:\t\x1b[1;35m${specs.aggregate.toString()}\x1b[0m`)
            }
            if (specs?.tally) {
                console.info("  ", `[3] TALLY:    \t\x1b[1;35m${specs.tally.toString()}\x1b[0m`)
            }
        } else {
            found += traceWitnetArtifacts(craft, selection)
        }
    }
    return found


function traceWitnetArtifactRetrieval(specs) {
    if (specs?.url) {
        console.info("  ", `    > URL:     \t\x1b[32m${specs.url}\x1b[0m`)
    }
    if (specs?.body) {
        console.info("  ", `    > Body:    \t\x1b[32m${specs.body}\x1b[0m`)
    }
    if (
        specs?.headers && !Array.isArray(specs?.headers) 
            || (Array.isArray(specs?.headers) && specs?.headers.length > 0)
    ) {
        console.info("  ", `   > Headers: \t\x1b[32m${JSON.stringify(specs.headers)}\x1b[0m`)
    }
    if (specs?.script) {
        console.info("  ", `    > Script:  \t\x1b[33m${specs?.script.toString()}\x1b[0m`)
    }
}}

function traceWitnetRetrievalsBreakdown(retrievals, level) {
    if (retrievals?.method) return;    
    for (const key in orderKeys(retrievals)) {
        console.info(" ", " ".repeat(4 * (level || 0)), (retrievals[key]?.method ? `\x1b[32m${key}\x1b[0m` : `\x1b[1;37m${key}\x1b[0m`))
        traceWitnetRetrievalsBreakdown(retrievals[key], level ? level + 1 : 1)
    }
}

function traceWitnetRetrieval(value) {
    if (value?.method) {
        if (value?.argsCount) {
            console.info("  ", `> Method:    \x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(value.method)}(\x1b[0;32m<${value.argsCount} args>\x1b[1;32m)\x1b[0m`)
        } else {
            console.info("  ", `> Method:    \x1b[1;32m${Witnet.Utils.stringifyWitnetRequestMethod(value.method)}()\x1b[0m`)
        }
        if (value?.url) {
            console.info("  ", `> URL:       \x1b[32m${value.url}\x1b[0m`)
        }
        if (value?.body) {
            console.info("  ", `> Body:      \x1b[32m${value.body}\x1b[0m`)
        }
        if (value?.headers && !Array.isArray(value?.headers) || (Array.isArray(value?.headers) && value?.headers.length > 0)) {
            console.info("  ", `> Headers:   \x1b[32m${JSON.stringify(value.headers)}\x1b[0m`)
        }
        if (value?.script) {
            console.info("  ", `> Script:    \x1b[33m${value?.script.toString()}\x1b[0m`)
        }
        if (value?.tuples) {
            console.info("  ", "> Pre-set tuples:")
            const keys = Object.keys(value.tuples)
            keys.map(key => { 
                console.info("  ", `  "${key}" =>`, JSON.stringify(value.tuples[key]))
            })
        }
    }
}
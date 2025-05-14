#!/usr/bin/env node

const exec = require("child_process").exec
const fs = require("fs")

if (!fs.existsSync(".no-postinstall")) {
    // initialize Witnet Radon workspace, relying on @witnet/sdk-solidity instead of @witnet/sdk
    exec(`npx witnet-solidity install --version`)
}

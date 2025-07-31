#!/usr/bin/env node

const exec = require("child_process").execSync
const fs = require("fs")

if (!fs.existsSync(".no-postinstall")) {
  // initialize Witnet Radon workspace relying on @witnet/solidity instead of @witnet/sdk
  exec("node ./src/bin/solidity.js install --version")
}

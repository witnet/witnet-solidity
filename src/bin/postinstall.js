#!/usr/bin/env node

const exec = require("child_process").execSync
const fs = require("fs")

if (!fs.existsSync(".no-postinstall") && !fs.existsSync(".env_witnet")) {
  fs.cpSync("node_modules/@witnet/ethers/.env_witnet", ".env_witnet")
}


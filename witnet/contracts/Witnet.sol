// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Witnet Requests deployment dependencies:
import "witnet-solidity-bridge/contracts/apps/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/WitnetPriceFeeds.sol";

// Witnet mocking contracts (only for local/unitary testing):
import "witnet-solidity-bridge/contracts/mocks/WitnetMockedOracle.sol";
import "witnet-solidity-bridge/contracts/mocks/WitnetMockedPriceFeeds.sol";
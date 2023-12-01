// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Witnet Requests deployment dependencies:
import "witnet-solidity-bridge/contracts/apps/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/apps/WitnetPriceFeeds.sol";

// Witnet mocking contracts (only for unitary testing, not testnets):
import "witnet-solidity-bridge/contracts/mocks/WitnetMockedRequestBoard.sol";
import "witnet-solidity-bridge/contracts/mocks/WitnetMockedPriceFeeds.sol";
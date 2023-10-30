// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Witnet Requests deployment dependencies:
import "witnet-solidity-bridge/contracts/WitnetBytecodes.sol";
import "witnet-solidity-bridge/contracts/WitnetRandomness.sol";
import "witnet-solidity-bridge/contracts/WitnetRequestBoard.sol";
import "witnet-solidity-bridge/contracts/WitnetRequestFactory.sol";
import "witnet-solidity-bridge/contracts/WitnetPriceFeeds.sol";


// Witnet Requests testing dependencies:
import "witnet-solidity-bridge/contracts/impls/apps/WitnetPriceFeedsUpgradable.sol";
import "witnet-solidity-bridge/contracts/impls/apps/WitnetRandomnessProxiable.sol";
import "witnet-solidity-bridge/contracts/impls/core/WitnetBytecodesDefault.sol";
import "witnet-solidity-bridge/contracts/impls/core/WitnetRequestBoardTrustableDefault.sol";
import "witnet-solidity-bridge/contracts/impls/core/WitnetRequestFactoryDefault.sol";
import "witnet-solidity-bridge/contracts/libs/WitnetEncodingLib.sol";
import "witnet-solidity-bridge/contracts/libs/WitnetErrorsLib.sol";
import "witnet-solidity-bridge/contracts/libs/WitnetPriceFeedsLib.sol";
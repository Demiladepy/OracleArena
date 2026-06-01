// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILiFiRouter} from "../../src/interfaces/ILiFiRouter.sol";

/// @notice Reverts on bridge calls for LiFiAdapter failure tests
contract RevertingLiFiRouter {
    function startBridgeTokensViaBridge(ILiFiRouter.BridgeData calldata, bytes calldata) external payable {
        revert("bridge boom");
    }
}

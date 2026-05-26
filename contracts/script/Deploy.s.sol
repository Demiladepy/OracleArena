// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

/// @title Deploy
/// @notice Deployment script skeleton — wire contract deployments in Phase 1
contract Deploy is Script {
    function run() external {
        // TODO: deploy BountyBoard, ResolverRegistry, ConsensusEngine, Settlement, LiFiAdapter, StreamPublisher
        // TODO: deploy two ResolverAgent instances with distinct configs
        // TODO: register agents with bonds and type tags
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";

/// @title RegisterResolverAgent
/// @notice Register a deployed ResolverAgent with ResolverRegistry (testnet)
contract RegisterResolverAgent is Script {
    function run() external {
        address registryAddress = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        address agentAddress = vm.envAddress("RESOLVER_AGENT_ADDRESS");
        ResolverRegistry registry = ResolverRegistry(payable(registryAddress));

        bytes32 urlResolvableFact = keccak256("URL_RESOLVABLE_FACT");
        bytes32[] memory tags = new bytes32[](1);
        tags[0] = urlResolvableFact;

        uint256 bond = registry.MIN_BOND();
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        console2.log("Registry:", registryAddress);
        console2.log("Agent:", agentAddress);
        console2.log("Bond (wei):", bond);

        vm.startBroadcast(deployerKey);
        registry.registerAgent{value: bond}(agentAddress, tags);
        vm.stopBroadcast();

        console2.log("Registered. isActive:", registry.isActive(agentAddress));
    }
}

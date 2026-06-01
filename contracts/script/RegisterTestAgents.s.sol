// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";

/// @title RegisterTestAgents
/// @notice Register two placeholder agent addresses on deployed ResolverRegistry (testnet smoke test)
/// @dev Call runAgentA() and runAgentB() in separate forge invocations for full gas budget per tx
contract RegisterTestAgents is Script {
    address internal constant PLACEHOLDER_AGENT_A = 0x1111111111111111111111111111111111111111;
    address internal constant PLACEHOLDER_AGENT_B = 0x2222222222222222222222222222222222222222;

    function run() external {
        _register(PLACEHOLDER_AGENT_A);
        _register(PLACEHOLDER_AGENT_B);
    }

    function runAgentA() external {
        _register(PLACEHOLDER_AGENT_A);
    }

    function runAgentB() external {
        _register(PLACEHOLDER_AGENT_B);
    }

    function _register(address agent) internal {
        address registryAddress = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        ResolverRegistry registry = ResolverRegistry(payable(registryAddress));

        bytes32[] memory tags = new bytes32[](1);
        tags[0] = keccak256("URL_RESOLVABLE_FACT");

        uint256 bond = registry.MIN_BOND();
        console2.log("Registry:", registryAddress);
        console2.log("Agent:", agent);
        console2.log("Bond (wei):", bond);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        registry.registerAgent{value: bond}(agent, tags);
        vm.stopBroadcast();

        console2.log("isActive:", registry.isActive(agent));
    }
}

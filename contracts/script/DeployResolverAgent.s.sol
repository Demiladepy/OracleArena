// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";

/// @title DeployResolverAgent
/// @notice Deploy a single ResolverAgent smoke-test instance on Somnia testnet
contract DeployResolverAgent is Script {
    address internal constant DEFAULT_PLATFORM = 0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3;
    address internal constant DEFAULT_BOUNTY_BOARD = 0xcf812e4735CeA2a5d966ad2999e982b2ED623092;

    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address platform = vm.envOr("PLATFORM_ADDRESS", DEFAULT_PLATFORM);
        address bountyBoard = vm.envOr("BOUNTY_BOARD_ADDRESS", DEFAULT_BOUNTY_BOARD);
        address registry = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE_ADDRESS");
        address operator = vm.envOr("AGENT_OPERATOR", deployer);
        uint256 initialFunding = vm.envOr("AGENT_INITIAL_FUNDING_WEI", uint256(1 ether));

        string memory systemPrompt =
            "You are an Oracle Arena resolver agent. Evaluate URL-resolvable factual claims using the provided evidence sources. When confident, call submitVerdict with a normalized verdict hash, confidence score 0-10000, and evidence URI.";

        bytes32 urlResolvableFact = keccak256("URL_RESOLVABLE_FACT");
        bytes32[] memory supportedTypes = new bytes32[](1);
        supportedTypes[0] = urlResolvableFact;

        console2.log("Deployer:", deployer);
        console2.log("Platform:", platform);
        console2.log("BountyBoard:", bountyBoard);
        console2.log("Registry:", registry);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("Operator:", operator);
        console2.log("Initial funding (wei):", initialFunding);

        vm.startBroadcast(deployer);

        ResolverAgent agent = new ResolverAgent{value: initialFunding}(
            platform, bountyBoard, registry, consensusEngine, operator, systemPrompt, supportedTypes
        );
        console2.log("ResolverAgent deployed at:", address(agent));

        vm.stopBroadcast();
    }
}

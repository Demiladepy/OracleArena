// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";

/// @title DeployCommunityResolverAgent
/// @notice Deploy an unregistered ResolverAgent for open registration via /register
/// @dev Set AGENT_OPERATOR to the wallet that will call evaluateBounty after registration.
contract DeployCommunityResolverAgent is Script {
    address internal constant DEFAULT_PLATFORM = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;
    address internal constant DEFAULT_BOUNTY_BOARD = 0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290;
    address internal constant DEFAULT_REGISTRY = 0x0AcEF373884b7843592904e74F87ABD46ca035CF;
    address internal constant DEFAULT_CONSENSUS = 0xB2495D336d59D193Fa2463b95248dE240aBfe6df;

    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address platform = vm.envOr("PLATFORM_ADDRESS", DEFAULT_PLATFORM);
        address bountyBoard = vm.envOr("BOUNTY_BOARD_ADDRESS", DEFAULT_BOUNTY_BOARD);
        address registry = vm.envOr("RESOLVER_REGISTRY_ADDRESS", DEFAULT_REGISTRY);
        address consensusEngine = vm.envOr("CONSENSUS_ENGINE_ADDRESS", DEFAULT_CONSENSUS);
        address operator = vm.envOr("AGENT_OPERATOR", deployer);
        uint256 initialFunding = vm.envOr("AGENT_INITIAL_FUNDING_WEI", uint256(1 ether));

        string memory systemPrompt = vm.envOr(
            "AGENT_SYSTEM_PROMPT",
            string(
                "You are an Oracle Arena resolver agent. Evaluate URL-resolvable factual claims using the provided evidence sources. When confident, call submitVerdict with verdict hash 0x7be3379c8e9f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a for true claims or 0x8c2e48ad9f0b2c3d4e5f60718293b4c5d6e7f8091a2b3c4d5e6f708192a3 for false claims, confidence 0-10000, and an https evidence URI."
            )
        );

        bytes32 urlResolvableFact = keccak256("URL_RESOLVABLE_FACT");
        bytes32[] memory supportedTypes = new bytes32[](1);
        supportedTypes[0] = urlResolvableFact;

        console2.log("Deployer:", deployer);
        console2.log("Platform:", platform);
        console2.log("BountyBoard:", bountyBoard);
        console2.log("Registry:", registry);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("Operator (must match evaluateBounty caller):", operator);
        console2.log("Initial funding (wei):", initialFunding);

        vm.startBroadcast(deployer);

        ResolverAgent agent = new ResolverAgent{value: initialFunding}(
            platform, bountyBoard, registry, consensusEngine, operator, systemPrompt, supportedTypes
        );

        console2.log("Community ResolverAgent (unregistered):", address(agent));
        console2.log("Next: register at /register with bond + URL_RESOLVABLE_FACT tag");

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {IResolverPayoutPrefs} from "../src/interfaces/IResolverPayoutPrefs.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title DeployFullDemoAgent
/// @notice Deploy ResolverAgent v2, register on v4, set CrossChain pref, post canonical demo bounty
contract DeployFullDemoAgent is Script {
    address internal constant DEFAULT_PLATFORM = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;

    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address platform = vm.envOr("PLATFORM_ADDRESS", DEFAULT_PLATFORM);
        address bountyBoard = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        address registry = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE_ADDRESS");
        address payoutPrefs = vm.envAddress("PAYOUT_PREFS_ADDRESS");
        address operator = vm.envOr("AGENT_OPERATOR", deployer);
        uint256 initialFunding = vm.envOr("AGENT_INITIAL_FUNDING_WEI", uint256(1 ether));
        uint256 bond = ResolverRegistry(payable(registry)).MIN_BOND();

        string memory systemPrompt = vm.envOr(
            "AGENT_SYSTEM_PROMPT",
            string(
                "You are an Oracle Arena resolver agent. Evaluate URL-resolvable factual claims using the provided evidence sources. When confident, call submitVerdict with a normalized verdict hash, confidence score 0-10000, and evidence URI."
            )
        );
        bool skipPayoutPref = vm.envOr("SKIP_PAYOUT_PREF", false);

        bytes32 urlResolvableFact = keccak256("URL_RESOLVABLE_FACT");
        bytes32[] memory supportedTypes = new bytes32[](1);
        supportedTypes[0] = urlResolvableFact;

        console2.log("Deployer:", deployer);
        console2.log("BountyBoard:", bountyBoard);
        console2.log("Registry:", registry);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("PayoutPrefs:", payoutPrefs);

        vm.startBroadcast(deployer);

        ResolverAgent agent = new ResolverAgent{value: initialFunding}(
            platform, bountyBoard, registry, consensusEngine, operator, systemPrompt, supportedTypes
        );
        console2.log("ResolverAgent v3:", address(agent));

        ResolverRegistry(payable(registry)).registerAgent{value: bond}(address(agent), supportedTypes);
        console2.log("Registered on registry v4");

        if (!skipPayoutPref) {
            IResolverPayoutPrefs.PayoutPref memory pref = IResolverPayoutPrefs.PayoutPref({
                mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
                destinationChain: 8453,
                destinationAsset: address(0),
                destinationRecipient: deployer
            });
            ResolverPayoutPrefs(payoutPrefs).setPreference(address(agent), pref);
            console2.log("CrossChain payout pref set (Base 8453)");
        } else {
            console2.log("SKIP_PAYOUT_PREF=true - default SomniaNative payout");
        }

        if (!vm.envOr("SKIP_DEMO_BOUNTY_POST", false)) {
            string[] memory sources = new string[](1);
            sources[0] = "https://www.bbc.com/sport/football/teams/manchester-city";
            uint64 deadline = uint64(block.timestamp + 6 days);
            uint256 payout = 0.2 ether;

            uint256 bountyId = BountyBoard(payable(bountyBoard)).postBounty{value: payout}(
                "Did Manchester City beat Arsenal in their most recent Premier League fixture?",
                sources,
                BountyBoard(payable(bountyBoard)).URL_RESOLVABLE_FACT(),
                deadline
            );

            console2.log("Demo bountyId:", bountyId);
            console2.log("deadline:", deadline);
            console2.log("payout wei:", payout);
        } else {
            console2.log("SKIP_DEMO_BOUNTY_POST=true - agent deploy only");
        }

        vm.stopBroadcast();
    }
}

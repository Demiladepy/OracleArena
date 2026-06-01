// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";

/// @title EvaluateDemoBounty
/// @notice Call evaluateBounty on the live ResolverAgent for the canonical demo bounty
contract EvaluateDemoBounty is Script {
    function run() external {
        string memory rpcUrl = vm.envOr("SOMNIA_RPC_URL", string("https://api.infra.testnet.somnia.network"));
        vm.createSelectFork(rpcUrl);

        address agentAddress = vm.envAddress("RESOLVER_AGENT_ADDRESS");
        uint256 bountyId = vm.envUint("DEMO_BOUNTY_ID");
        ResolverAgent agent = ResolverAgent(payable(agentAddress));

        console2.log("Agent:", agentAddress);
        console2.log("BountyId:", bountyId);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        try agent.evaluateBounty(bountyId) returns (uint256 requestId) {
            console2.log("evaluateBounty succeeded, requestId:", requestId);
        } catch {
            console2.log("evaluateBounty reverted (expected if subcommittee offline)");
        }
        vm.stopBroadcast();
    }
}

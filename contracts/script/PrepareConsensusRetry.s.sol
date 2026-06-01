// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @notice Align both demo agents on canonical verdict hashes, then post consensus retry bounty
contract PrepareConsensusRetry is Script {
    function run() external {
        address payable agentA = payable(vm.envAddress("RESOLVER_AGENT_A"));
        address payable agentB = payable(vm.envAddress("RESOLVER_AGENT_B"));
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");

        string memory strictPrompt = "You are an Oracle Arena resolver. Evaluate URL-resolvable factual claims. "
            "When calling submitVerdict you MUST use these exact verdictHash bytes32 values copied verbatim: "
            "TRUE/YES claims -> 0x6273151f959616268004b58dbb21e5c851b7b8d04498b4aabee12291d22fc034. "
            "FALSE/NO claims -> 0xba9154e0baa69c78e0ca563b867df81bae9d177c4ea1452c35c84386a70f0f7a. "
            "Use confidence 9000 or higher. Be decisive.";

        string[] memory sources = new string[](1);
        sources[0] = "https://en.wikipedia.org/wiki/Water";

        uint64 deadline = uint64(block.timestamp + 6 days);
        uint256 payout = 0.2 ether;

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        ResolverAgent(agentA).setSystemPrompt(strictPrompt);
        ResolverAgent(agentB).setSystemPrompt(strictPrompt);
        console2.log("Synced system prompts on Agent A and Agent B");

        uint256 bountyId = BountyBoard(payable(boardAddress)).postBounty{value: payout}(
            "Is the chemical formula for water H2O?",
            sources,
            BountyBoard(payable(boardAddress)).URL_RESOLVABLE_FACT(),
            deadline
        );

        vm.stopBroadcast();

        console2.log("Consensus retry bountyId:", bountyId);
    }
}

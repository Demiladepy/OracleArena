// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";
import {Settlement} from "../src/Settlement.sol";

/// @notice Smoke test: queue 0.05 STT via CE.smokeQueuePayout then forwardPayout to MockRouter
contract SettlementSmokeTest is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address engine = vm.envAddress("CONSENSUS_ENGINE_ADDRESS");
        address settlement = vm.envAddress("SETTLEMENT_ADDRESS");
        address resolver = vm.envAddress("RESOLVER_AGENT_ADDRESS");
        uint256 amount = vm.envOr("SMOKE_AMOUNT_WEI", uint256(0.05 ether));
        uint256 bountyId = vm.envOr("SMOKE_BOUNTY_ID", uint256(999));

        vm.startBroadcast(deployer);

        ConsensusEngine(engine).smokeQueuePayout{value: amount}(bountyId, resolver);
        console2.log("queuePayout sent:", amount);

        Settlement(payable(settlement)).forwardPayout(bountyId, resolver);
        console2.log("forwardPayout complete");

        vm.stopBroadcast();
    }
}

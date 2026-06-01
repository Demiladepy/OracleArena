// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";

/// @title DeployConsensusEngine
/// @notice Superseded by DeploySettlementPhase — kept for reference; requires full env wiring
contract DeployConsensusEngine is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address bountyBoard = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        address registry = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        address settlement = vm.envAddress("SETTLEMENT_ADDRESS");
        address payoutPrefs = vm.envAddress("PAYOUT_PREFS_ADDRESS");

        console2.log("Deployer:", deployer);
        console2.log("BountyBoard:", bountyBoard);
        console2.log("Registry:", registry);
        console2.log("Settlement:", settlement);
        console2.log("PayoutPrefs:", payoutPrefs);

        vm.startBroadcast(deployer);
        ConsensusEngine engine = new ConsensusEngine(bountyBoard, registry, settlement, payoutPrefs, deployer);
        console2.log("ConsensusEngine deployed at:", address(engine));
        vm.stopBroadcast();
    }
}

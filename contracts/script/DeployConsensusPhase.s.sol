// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";

/// @title DeployConsensusPhase
/// @notice Superseded by DeploySettlementPhase.s.sol — v1 CE deploy without Settlement wiring
/// @dev Compiles with placeholder settlement/prefs; use DeploySettlementPhase for current stack
contract DeployConsensusPhase is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address treasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        uint256 minBond = vm.envOr("MIN_BOND_WEI", uint256(1 ether));
        address settlement = vm.envOr("SETTLEMENT_ADDRESS", deployer);
        address payoutPrefs = vm.envOr("PAYOUT_PREFS_ADDRESS", deployer);

        uint256 nonce = vm.getNonce(deployer);
        address predictedBoard = vm.computeCreateAddress(deployer, nonce);
        address predictedRegistry = vm.computeCreateAddress(deployer, nonce + 1);
        address predictedEngine = vm.computeCreateAddress(deployer, nonce + 2);

        console2.log("Deployer:", deployer);
        console2.log("Predicted BountyBoard:", predictedBoard);
        console2.log("Predicted ResolverRegistry:", predictedRegistry);
        console2.log("Predicted ConsensusEngine:", predictedEngine);
        console2.log("MIN_BOND (wei):", minBond);
        console2.log("NOTE: superseded - run DeploySettlementPhase for Settlement + CE v2");

        vm.startBroadcast(deployer);

        BountyBoard board = new BountyBoard(treasury, predictedEngine);
        ResolverRegistry registry = new ResolverRegistry(predictedEngine, deployer, minBond);
        ConsensusEngine engine =
            new ConsensusEngine(predictedBoard, predictedRegistry, settlement, payoutPrefs, deployer);

        vm.stopBroadcast();

        require(address(board) == predictedBoard, "board address mismatch");
        require(address(registry) == predictedRegistry, "registry address mismatch");
        require(address(engine) == predictedEngine, "engine address mismatch");

        console2.log("BountyBoard v2:", address(board));
        console2.log("ResolverRegistry v3:", address(registry));
        console2.log("ConsensusEngine:", address(engine));
    }
}

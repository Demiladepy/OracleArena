// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {Settlement} from "../src/Settlement.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title DeploySettlementPhase
/// @notice Atomic deploy: MockRouter + LiFiAdapter + Registry v4 + PayoutPrefs + Settlement + CE v2 + Board v3
/// @dev CREATE nonce prediction — deploy order fixed (7 contracts, nonces n..n+6)
contract DeploySettlementPhase is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address treasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        uint256 minBond = vm.envOr("MIN_BOND_WEI", uint256(1 ether));

        uint256 nonce = vm.getNonce(deployer);
        address predictedRouter = vm.computeCreateAddress(deployer, nonce);
        address predictedAdapter = vm.computeCreateAddress(deployer, nonce + 1);
        address predictedRegistry = vm.computeCreateAddress(deployer, nonce + 2);
        address predictedPrefs = vm.computeCreateAddress(deployer, nonce + 3);
        address predictedSettlement = vm.computeCreateAddress(deployer, nonce + 4);
        address predictedEngine = vm.computeCreateAddress(deployer, nonce + 5);
        address predictedBoard = vm.computeCreateAddress(deployer, nonce + 6);

        console2.log("Deployer:", deployer);
        console2.log("Predicted MockLiFiRouter:", predictedRouter);
        console2.log("Predicted LiFiAdapter:", predictedAdapter);
        console2.log("Predicted ResolverRegistry v4:", predictedRegistry);
        console2.log("Predicted ResolverPayoutPrefs:", predictedPrefs);
        console2.log("Predicted Settlement:", predictedSettlement);
        console2.log("Predicted ConsensusEngine v2:", predictedEngine);
        console2.log("Predicted BountyBoard v3:", predictedBoard);

        vm.startBroadcast(deployer);

        MockLiFiRouter router = new MockLiFiRouter();
        LiFiAdapter adapter = new LiFiAdapter(address(router));
        ResolverRegistry registry = new ResolverRegistry(predictedEngine, deployer, minBond);
        ResolverPayoutPrefs prefs = new ResolverPayoutPrefs(address(registry));
        Settlement settlement =
            new Settlement(predictedBoard, predictedEngine, address(prefs), address(adapter));
        ConsensusEngine engine = new ConsensusEngine(
            predictedBoard, address(registry), address(settlement), address(prefs), deployer
        );
        BountyBoard board = new BountyBoard(treasury, address(engine));

        vm.stopBroadcast();

        require(address(router) == predictedRouter, "router mismatch");
        require(address(adapter) == predictedAdapter, "adapter mismatch");
        require(address(registry) == predictedRegistry, "registry mismatch");
        require(address(prefs) == predictedPrefs, "prefs mismatch");
        require(address(settlement) == predictedSettlement, "settlement mismatch");
        require(address(engine) == predictedEngine, "engine mismatch");
        require(address(board) == predictedBoard, "board mismatch");

        console2.log("MockLiFiRouter:", address(router));
        console2.log("LiFiAdapter:", address(adapter));
        console2.log("ResolverRegistry v4:", address(registry));
        console2.log("ResolverPayoutPrefs:", address(prefs));
        console2.log("Settlement:", address(settlement));
        console2.log("ConsensusEngine v2:", address(engine));
        console2.log("BountyBoard v3:", address(board));
        console2.log("board.consensusEngine():", board.consensusEngine());
        console2.log("registry.consensusEngine():", registry.consensusEngine());
        console2.log("settlement.consensusEngine():", settlement.consensusEngine());
    }
}

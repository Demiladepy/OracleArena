// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title RedeployBountyBoard
/// @notice Deploy BountyBoard v2 wired to the real ConsensusEngine (Option A redeploy)
/// @dev CONSENSUS_ENGINE env required — must be deployed ConsensusEngine address, not placeholder
contract RedeployBountyBoard is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address protocolTreasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE");

        console2.log("Deployer:", deployer);
        console2.log("ProtocolTreasury:", protocolTreasury);
        console2.log("ConsensusEngine:", consensusEngine);

        vm.startBroadcast(deployer);
        BountyBoard board = new BountyBoard(protocolTreasury, consensusEngine);
        console2.log("BountyBoard v2 deployed at:", address(board));
        vm.stopBroadcast();
    }
}

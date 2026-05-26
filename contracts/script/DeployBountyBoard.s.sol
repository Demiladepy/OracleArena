// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title DeployBountyBoard
/// @notice Deploy BountyBoard to Somnia testnet
contract DeployBountyBoard is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address protocolTreasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        address consensusEngine = vm.envOr("CONSENSUS_ENGINE", deployer);

        if (protocolTreasury == deployer) {
            console2.log(
                "WARNING: PROTOCOL_TREASURY is the deployer address. Update once ProtocolTreasury is deployed."
            );
        }
        if (consensusEngine == deployer) {
            console2.log("WARNING: CONSENSUS_ENGINE is the deployer address. Update once ConsensusEngine is deployed.");
        }

        console2.log("Deployer:", deployer);
        console2.log("ProtocolTreasury:", protocolTreasury);
        console2.log("ConsensusEngine:", consensusEngine);

        vm.startBroadcast(deployer);

        BountyBoard board = new BountyBoard(protocolTreasury, consensusEngine);
        console2.log("BountyBoard deployed at:", address(board));

        vm.stopBroadcast();
    }
}

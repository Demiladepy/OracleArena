// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Settlement} from "../src/Settlement.sol";

contract DeploySettlement is Script {
    function run() external returns (address settlement) {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address bountyBoard = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE_ADDRESS");
        address payoutPrefs = vm.envAddress("PAYOUT_PREFS_ADDRESS");
        address lifiAdapter = vm.envAddress("LIFI_ADAPTER_ADDRESS");

        vm.startBroadcast(deployer);
        settlement = address(new Settlement(bountyBoard, consensusEngine, payoutPrefs, lifiAdapter));
        vm.stopBroadcast();
        console2.log("Settlement:", settlement);
    }
}

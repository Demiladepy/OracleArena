// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";

contract DeployLiFiAdapter is Script {
    function run() external returns (address adapter) {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address router = vm.envAddress("LIFI_ROUTER_ADDRESS");

        vm.startBroadcast(deployer);
        adapter = address(new LiFiAdapter(router));
        vm.stopBroadcast();
        console2.log("LiFiAdapter:", adapter);
        console2.log("Router:", router);
    }
}

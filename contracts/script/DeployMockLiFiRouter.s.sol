// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";

contract DeployMockLiFiRouter is Script {
    function run() external returns (address router) {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        vm.startBroadcast(deployer);
        router = address(new MockLiFiRouter());
        vm.stopBroadcast();
        console2.log("MockLiFiRouter:", router);
    }
}

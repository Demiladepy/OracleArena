// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ToolsChatProbe} from "../src/probes/ToolsChatProbe.sol";

/// @title DeployToolsChatProbe
/// @notice Deploy ToolsChatProbe to Somnia testnet (invoke separately)
contract DeployToolsChatProbe is Script {
    address internal constant DEFAULT_PLATFORM = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address platform = vm.envOr("PLATFORM_ADDRESS", DEFAULT_PLATFORM);

        vm.startBroadcast(deployerKey);

        ToolsChatProbe probe = new ToolsChatProbe(platform);
        console2.log("ToolsChatProbe deployed at:", address(probe));

        vm.stopBroadcast();
    }
}

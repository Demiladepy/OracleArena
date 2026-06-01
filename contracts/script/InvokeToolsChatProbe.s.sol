// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ToolsChatProbe} from "../src/probes/ToolsChatProbe.sol";

/// @title InvokeToolsChatProbe
/// @notice Invoke probe() on a deployed ToolsChatProbe
contract InvokeToolsChatProbe is Script {
    string public constant SYSTEM_PROMPT =
        "You are a probe agent. When asked, choose to call the setNumber tool with the integer you receive.";

    string public constant USER_MESSAGE = "Please call setNumber with the integer 42.";

    function run() external {
        address payable probeAddress = payable(vm.envAddress("PROBE_ADDRESS"));
        ToolsChatProbe probe = ToolsChatProbe(probeAddress);

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        uint256 floor = probe.platform().getRequestDeposit();
        uint256 reward = 0.07 ether * 3;
        uint256 deposit = ((floor + reward) * 120) / 100;
        console2.log("Probe deposit (wei):", deposit);

        vm.startBroadcast(deployerKey);

        uint256 requestId = probe.probe{value: deposit}(SYSTEM_PROMPT, USER_MESSAGE);
        console2.log("Request ID:", requestId);

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ToolsChatProbe} from "../src/probes/ToolsChatProbe.sol";

/// @title ProbeInferToolsChat
/// @notice Deploy ToolsChatProbe and invoke probe() on Somnia testnet
contract ProbeInferToolsChat is Script {
    // README platform address; docs also list 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776
    address public constant PLATFORM = 0x7407cb35a17D511D1Bd32dD726ADb8D5344ECbE3;

    string public constant SYSTEM_PROMPT =
        "You are a probe agent. When asked, choose to call the setNumber tool with the integer you receive.";

    string public constant USER_MESSAGE = "Please call setNumber with the integer 42.";

    function run() external {
        vm.createSelectFork("https://api.infra.testnet.somnia.network");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        ToolsChatProbe probe = new ToolsChatProbe(PLATFORM);
        console2.log("ToolsChatProbe deployed at:", address(probe));

        // Inline deposit: floor (0.03 STT) + reward (0.07 * 3 STT) + 20% buffer — matches requiredProbeDeposit()
        uint256 floor = 0.03 ether;
        uint256 reward = 0.07 ether * 3;
        uint256 deposit = ((floor + reward) * 120) / 100;
        console2.log("Probe deposit (wei):", deposit);

        uint256 requestId = probe.probe{value: deposit}(SYSTEM_PROMPT, USER_MESSAGE);
        console2.log("Request ID:", requestId);
        console2.log("Wait 30-60s then run ReadProbeResult.s.sol against:", address(probe));

        vm.stopBroadcast();
    }
}

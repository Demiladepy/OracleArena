// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ToolsChatProbe} from "../src/probes/ToolsChatProbe.sol";
import {ResponseStatus} from "../src/interfaces/IAgentRequester.sol";

/// @title ReadProbeResult
/// @notice Read callback state from a deployed ToolsChatProbe
/// @dev Usage: PROBE_ADDRESS=0x... forge script script/ReadProbeResult.s.sol --rpc-url $SOMNIA_RPC_URL
contract ReadProbeResult is Script {
    function run() external view {
        address payable probeAddress = payable(vm.envAddress("PROBE_ADDRESS"));
        ToolsChatProbe probe = ToolsChatProbe(probeAddress);

        console2.log("Probe address:", probeAddress);
        console2.log("lastRequestId:", probe.lastRequestId());
        console2.log("callbackReceived:", probe.callbackReceived());
        console2.log("lastResponseCount:", probe.lastResponseCount());
        console2.log("lastNumber (if tool executed):", probe.lastNumber());

        ResponseStatus status = probe.lastStatus();
        console2.log("lastStatus (enum value):", uint256(status));

        bytes memory raw = probe.lastRawResponse();
        console2.log("lastRawResponse length:", raw.length);
        console2.logBytes(raw);
    }
}

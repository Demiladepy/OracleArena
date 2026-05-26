// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";

/// @title DecodeProbeResponseTest
/// @notice Decode captured inferToolsChat raw bytes from testnet probe run
/// @dev After testnet run: paste hex from ReadProbeResult into CAPTURED_RAW_HEX below
contract DecodeProbeResponseTest is Test {
    /// @dev Populated after successful testnet probe — empty until first live run
    bytes internal constant CAPTURED_RAW_HEX = hex"";

    function test_decodeOfficialInferToolsChatTuple() public {
        if (CAPTURED_RAW_HEX.length == 0) return;

        (
            string memory finishReason,
            string memory response,
            string[] memory updatedRoles,
            string[] memory updatedMessages,
            string[] memory pendingToolCallIds,
            bytes[] memory pendingToolCalls
        ) = abi.decode(CAPTURED_RAW_HEX, (string, string, string[], string[], string[], bytes[]));

        assertTrue(bytes(finishReason).length > 0);
        assertTrue(updatedRoles.length == updatedMessages.length);
        assertTrue(pendingToolCallIds.length == pendingToolCalls.length);
    }

    function test_decodeHypothesisA_structuredToolCall() public {
        if (CAPTURED_RAW_HEX.length == 0) return;
        vm.expectRevert();
        abi.decode(CAPTURED_RAW_HEX, (string, uint256, bytes));
    }

    function test_decodeHypothesisC_rawJsonString() public {
        if (CAPTURED_RAW_HEX.length == 0) return;
        // May succeed for some payloads — log only when capture exists
        string memory json = abi.decode(CAPTURED_RAW_HEX, (string));
        assertTrue(bytes(json).length > 0);
    }

    /// @notice Run with forge test --match-test test_logCapturedDecode -vv after populating CAPTURED_RAW_HEX
    function test_logCapturedDecode() public {
        if (CAPTURED_RAW_HEX.length == 0) return;

        (
            string memory finishReason,
            string memory response,
            string[] memory updatedRoles,
            string[] memory updatedMessages,
            string[] memory pendingToolCallIds,
            bytes[] memory pendingToolCalls
        ) = abi.decode(CAPTURED_RAW_HEX, (string, string, string[], string[], string[], bytes[]));

        console2.log("finishReason:", finishReason);
        console2.log("response:", response);
        console2.log("updatedRoles length:", updatedRoles.length);
        console2.log("updatedMessages length:", updatedMessages.length);
        console2.log("pendingToolCallIds length:", pendingToolCallIds.length);
        console2.log("pendingToolCalls length:", pendingToolCalls.length);

        for (uint256 i = 0; i < pendingToolCalls.length; i++) {
            console2.log("pendingToolCalls[i] length:", pendingToolCalls[i].length);
            console2.logBytes(pendingToolCalls[i]);
        }
    }
}

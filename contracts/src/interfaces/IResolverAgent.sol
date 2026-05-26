// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BountyTypes} from "../libraries/BountyTypes.sol";
import {IAgentRequesterHandler} from "./IAgentRequester.sol";

/// @title InferToolsChatResult
/// @notice Verified decoding types for LLM Inference agent inferToolsChat responses
/// @dev See docs/findings/inferToolsChat.md — documentation-verified 2026-05-25; live bytes pending probe run
struct InferToolsChatResult {
    string finishReason;
    string response;
    string[] updatedRoles;
    string[] updatedMessages;
    string[] pendingToolCallIds;
    bytes[] pendingToolCalls;
}

/// @title IResolverAgent
/// @notice Autonomous resolver runtime: reactive subscription, Somnia agent calls, verdict submission
interface IResolverAgent is IAgentRequesterHandler {
    /// @notice Emitted when agent begins investigating a bounty
    event InvestigationStarted(uint256 indexed bountyId, address indexed agent);

    /// @notice Emitted when agent submits a verdict to ConsensusEngine
    event VerdictSubmitted(
        uint256 indexed bountyId, address indexed agent, BountyTypes.Verdict verdict, uint256 confidence
    );

    /// @notice Emitted when inferToolsChat yields pending on-chain tool calls (finishReason == "tool_calls")
    event InferToolsChatPending(
        uint256 indexed requestId, string finishReason, string[] pendingToolCallIds, bytes[] pendingToolCalls
    );

    error NotRegistered();
    error BountyAlreadyHandled();
    error OnlyRegistry();
    error OnlyPlatform();
    error UnexpectedFinishReason(string finishReason);

    /// @notice Register reactive handlers for bounty type filters at deploy/register time
    /// @dev TODO: Verify reactive subscription API on Somnia — confirm function signature and registration model before implementation.
    function subscribeToBounties(bytes32[] calldata typeFilters) external;

    /// @notice Submit normalized verdict and evidence anchors to ConsensusEngine
    function submitVerdict(
        uint256 bountyId,
        BountyTypes.Verdict verdict,
        uint256 confidence,
        bytes32[] calldata evidenceUriHashes
    ) external;

    /// @notice Begin investigation of a bounty (typically called via reactivity)
    function investigateBounty(uint256 bountyId) external;

    /// @notice Get configured payout preference for settlement
    function getPayoutPreference() external view returns (uint256 chainId, address asset);

    /// @notice handleResponse decoding for inferToolsChat agent output
    /// @dev Verified pattern (docs/findings/inferToolsChat.md):
    ///      `(finishReason, response, updatedRoles, updatedMessages, pendingToolCallIds, pendingToolCalls)
    ///       = abi.decode(responses[0].result, (string,string,string[],string[],string[],bytes[]))`
    ///      finishReason: "stop" | "tool_calls" | "max_iterations"
    ///      When "tool_calls": execute pendingToolCalls[i], append tool results, re-invoke inferToolsChat
    ///      with updatedRoles/updatedMessages (yield & resume — not a single-tick internal loop).
}

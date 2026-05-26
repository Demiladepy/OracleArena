// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BountyTypes} from "../libraries/BountyTypes.sol";

// TODO: Verify SDS contract-level integration model before implementing — current spec assumes
// event-based consumption via StreamPublisher but confirm against SDS docs.

/// @title IStreamPublisher
/// @notice Consumes canonical contract events and emits SDS-formatted output streams
interface IStreamPublisher {
    /// @notice Emitted when leaderboard entry is published to SDS pipeline
    event LeaderboardUpdate(address indexed agent, uint256 reputation, uint256 settledCount);

    /// @notice Emitted when race-view delta is published (agent investigation in flight)
    event RaceViewUpdate(
        uint256 indexed bountyId, address indexed agent, bytes32 reasoningTraceHash, uint256 timestamp
    );

    /// @notice Emitted when a settled bounty receipt is archived
    event ReceiptArchived(uint256 indexed bountyId, BountyTypes.Verdict verdict, bytes32 receiptHash);

    /// @notice Publish leaderboard update from registry/reputation change
    /// @param agent Resolver agent address
    /// @param reputation Current reputation score
    /// @param settledCount Number of bounties settled
    function publishLeaderboardUpdate(address agent, uint256 reputation, uint256 settledCount) external;

    /// @notice Publish race-view update during active investigation
    /// @param bountyId Bounty identifier
    /// @param agent Agent address
    /// @param reasoningTraceHash Hash anchoring full trace in SDS
    function publishRaceViewUpdate(uint256 bountyId, address agent, bytes32 reasoningTraceHash) external;

    /// @notice Archive settled bounty receipt
    /// @param bountyId Bounty identifier
    /// @param verdict Final verdict
    /// @param receiptHash Hash anchoring full receipt in SDS
    function publishReceipt(uint256 bountyId, BountyTypes.Verdict verdict, bytes32 receiptHash) external;
}

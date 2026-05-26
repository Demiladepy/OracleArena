// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BountyTypes} from "../libraries/BountyTypes.sol";

/// @title IConsensusEngine
/// @notice Multi-agent resolution: aggregate submissions, agreement check, trigger settlement or refund
interface IConsensusEngine {
    /// @notice Emitted when two agents agree and bounty is ready for settlement
    event ConsensusReached(
        uint256 indexed bountyId, BountyTypes.Verdict verdict, address firstSubmitter, address secondSubmitter
    );

    /// @notice Emitted when submissions disagree or quorum is not met
    event ConsensusFailed(uint256 indexed bountyId, string reason);

    /// @notice Emitted when an agent submits a verdict
    event SubmissionReceived(
        uint256 indexed bountyId, address indexed agent, BountyTypes.Verdict verdict, uint256 submissionIndex
    );

    error BountyNotOpen();
    error AlreadySubmitted();
    error NotRegisteredAgent();
    error OnlyResolverAgent();

    /// @notice Record a resolver submission (MVP: first two within window)
    /// @param bountyId Bounty identifier
    /// @param verdict Normalized verdict
    /// @param confidence Confidence scalar
    /// @param evidenceUriHashes Evidence URI hashes
    function submitVerdict(
        uint256 bountyId,
        BountyTypes.Verdict verdict,
        uint256 confidence,
        bytes32[] calldata evidenceUriHashes
    ) external;

    /// @notice Get submission count for a bounty
    /// @param bountyId Bounty identifier
    /// @return count Number of submissions received
    function getSubmissionCount(uint256 bountyId) external view returns (uint256 count);

    /// @notice Get a submission by index (0 = first, 1 = second)
    /// @param bountyId Bounty identifier
    /// @param index Submission index
    /// @return submission Submission struct
    function getSubmission(uint256 bountyId, uint256 index)
        external
        view
        returns (BountyTypes.Submission memory submission);

    // TODO: confirm whether finalizeOnDeadline belongs in this interface (timeout → Unresolved)
}

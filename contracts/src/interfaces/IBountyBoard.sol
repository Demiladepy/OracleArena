// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IBountyBoard
/// @notice Reactive marketplace for posting bounties and holding STT escrow (MVP)
interface IBountyBoard {
    /// @notice Supported bounty type for Phase 1
    function URL_RESOLVABLE_FACT() external view returns (bytes32);

    enum BountyStatus {
        Open,
        Submitted,
        Resolved,
        Unresolved,
        Cancelled
    }

    struct Bounty {
        uint256 id;
        address poster;
        string claim;
        string[] evidenceSources;
        bytes32 bountyType;
        uint64 deadline;
        uint256 payout;
        BountyStatus status;
        uint64 createdAt;
        uint64 resolvedAt;
        bytes32 winningVerdictHash;
    }

    struct Submission {
        address resolver;
        bytes32 verdictHash;
        uint16 confidence;
        string evidenceUri;
        uint64 submittedAt;
    }

    event BountyPosted(
        uint256 indexed bountyId,
        address indexed poster,
        bytes32 indexed bountyType,
        string claim,
        string[] evidenceSources,
        uint64 deadline,
        uint256 payout
    );

    event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refunded);

    event SubmissionRecorded(
        uint256 indexed bountyId,
        address indexed resolver,
        bytes32 verdictHash,
        uint16 confidence,
        string evidenceUri,
        uint64 submittedAt
    );

    event BountySettled(
        uint256 indexed bountyId,
        bytes32 winningVerdictHash,
        address[] winners,
        uint256[] payoutShares,
        uint256 feeAmount
    );

    event BountyUnresolved(uint256 indexed bountyId, uint256 refundedToPoster, uint256 feeAmount);

    error BountyDoesNotExist(uint256 bountyId);
    error BountyNotOpen(uint256 bountyId, uint8 currentStatus);
    error BountyNotInSubmittedState(uint256 bountyId, uint8 currentStatus);
    error DeadlinePassed(uint256 bountyId, uint64 deadline);
    error DeadlineInPast(uint64 deadline);
    error DeadlineTooFar(uint64 deadline, uint64 maxAllowed);
    error PayoutTooSmall(uint256 sent, uint256 minimum);
    error UnsupportedBountyType(bytes32 bountyType);
    error TooManyEvidenceSources(uint256 sent, uint256 maximum);
    error NotPoster(address caller, address expected);
    error NotConsensusEngine(address caller, address expected);
    error ResolverAlreadySubmitted(uint256 bountyId, address resolver);
    error TooManySubmissions(uint256 bountyId, uint8 maximum);
    error HasSubmissions(uint256 bountyId);
    error PayoutShareMismatch(uint256 sumOfShares, uint256 expected);
    error InvalidWinnerArray();
    error TransferFailed(address recipient, uint256 amount);

    /// @notice Post a URL-resolvable bounty with STT escrow
    function postBounty(
        string calldata claim,
        string[] calldata evidenceSources,
        bytes32 bountyType,
        uint64 deadline
    ) external payable returns (uint256 bountyId);

    /// @notice Cancel an open bounty with no submissions; full refund to poster
    function cancelBounty(uint256 bountyId) external;

    /// @notice Record a resolver submission (ConsensusEngine only)
    function recordSubmission(
        uint256 bountyId,
        address resolver,
        bytes32 verdictHash,
        uint16 confidence,
        string calldata evidenceUri
    ) external;

    /// @notice Settle bounty and distribute payout (ConsensusEngine only)
    function settleBounty(
        uint256 bountyId,
        bytes32 winningVerdictHash,
        address[] calldata winners,
        uint256[] calldata payoutShares
    ) external;

    /// @notice Mark bounty unresolved and refund poster minus protocol fee (ConsensusEngine only)
    function markUnresolved(uint256 bountyId) external;

    function getBounty(uint256 bountyId) external view returns (Bounty memory bounty);

    function getSubmission(uint256 bountyId, address resolver) external view returns (Submission memory submission);

    function getOpenBounties(uint256 offset, uint256 limit) external view returns (uint256[] memory bountyIds);

    function bountyCount() external view returns (uint256 count);

    function protocolTreasury() external view returns (address treasury);

    function consensusEngine() external view returns (address engine);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Shared bounty and verdict types
/// @notice Common enums and structs used across Oracle Arena contracts
library BountyTypes {
    /// @notice Normalized verdict for URL-resolvable bounties (MVP)
    enum Verdict {
        UNRESOLVABLE,
        FALSE,
        TRUE
    }

    /// @notice Lifecycle state of a bounty
    enum BountyStatus {
        Open,
        Settled,
        Unresolved
    }

    /// @notice On-chain bounty record (MVP: STT escrow on Somnia)
    struct Bounty {
        uint256 id;
        address poster;
        string claim;
        string evidenceHint;
        bytes32 typeTag;
        uint256 deadline;
        uint256 escrowAmount;
        BountyStatus status;
        uint256 createdAt;
    }

    /// @notice Agent submission to ConsensusEngine
    struct Submission {
        uint256 bountyId;
        address agent;
        Verdict verdict;
        uint256 confidence;
        bytes32[] evidenceUriHashes;
        uint256 submittedAt;
    }
}

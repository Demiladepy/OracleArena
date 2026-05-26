// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBountyBoard} from "./interfaces/IBountyBoard.sol";

/// @title BountyBoard
/// @notice Reactive marketplace: STT escrow, bounty lifecycle, submission recording
/// @dev Protocol fee (2%) deducted on settle/unresolved only — not on post or cancel
contract BountyBoard is IBountyBoard {
    bytes32 public constant URL_RESOLVABLE_FACT = keccak256("URL_RESOLVABLE_FACT");

    uint256 public constant MIN_BOUNTY = 0.1 ether;
    uint256 public constant MAX_DEADLINE_WINDOW = 7 days;
    uint256 public constant MAX_EVIDENCE_SOURCES = 10;
    uint8 public constant MAX_SUBMISSIONS_PER_BOUNTY = 2;
    uint16 public constant PROTOCOL_FEE_BPS = 200;

    address public immutable protocolTreasury;
    address public immutable consensusEngine;

    uint256 private _nextBountyId = 1;
    uint256 private _bountyCount;

    mapping(uint256 => Bounty) private _bounties;
    mapping(uint256 => uint8) private _submissionCount;
    mapping(uint256 => mapping(address => Submission)) private _submissions;

    constructor(address protocolTreasury_, address consensusEngine_) {
        if (protocolTreasury_ == address(0) || consensusEngine_ == address(0)) {
            revert TransferFailed(address(0), 0);
        }
        protocolTreasury = protocolTreasury_;
        consensusEngine = consensusEngine_;
    }

    /// @inheritdoc IBountyBoard
    function postBounty(string calldata claim, string[] calldata evidenceSources, bytes32 bountyType, uint64 deadline)
        external
        payable
        returns (uint256 bountyId)
    {
        if (msg.value < MIN_BOUNTY) {
            revert PayoutTooSmall(msg.value, MIN_BOUNTY);
        }
        if (deadline <= block.timestamp) {
            revert DeadlineInPast(deadline);
        }
        uint64 maxAllowed = uint64(block.timestamp + MAX_DEADLINE_WINDOW);
        if (deadline > maxAllowed) {
            revert DeadlineTooFar(deadline, maxAllowed);
        }
        if (bountyType != URL_RESOLVABLE_FACT) {
            revert UnsupportedBountyType(bountyType);
        }
        if (evidenceSources.length > MAX_EVIDENCE_SOURCES) {
            revert TooManyEvidenceSources(evidenceSources.length, MAX_EVIDENCE_SOURCES);
        }

        bountyId = _nextBountyId++;
        _bountyCount++;

        Bounty storage bounty = _bounties[bountyId];
        bounty.id = bountyId;
        bounty.poster = msg.sender;
        bounty.claim = claim;
        bounty.evidenceSources = evidenceSources;
        bounty.bountyType = bountyType;
        bounty.deadline = deadline;
        bounty.payout = msg.value;
        bounty.status = BountyStatus.Open;
        bounty.createdAt = uint64(block.timestamp);

        emit BountyPosted(bountyId, msg.sender, bountyType, claim, evidenceSources, deadline, msg.value);
    }

    /// @inheritdoc IBountyBoard
    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = _loadBounty(bountyId);
        if (bounty.status != BountyStatus.Open) {
            revert BountyNotOpen(bountyId, uint8(bounty.status));
        }
        if (msg.sender != bounty.poster) {
            revert NotPoster(msg.sender, bounty.poster);
        }
        if (_submissionCount[bountyId] > 0) {
            revert HasSubmissions(bountyId);
        }

        uint256 refundAmount = bounty.payout;
        bounty.payout = 0;
        bounty.status = BountyStatus.Cancelled;
        bounty.resolvedAt = uint64(block.timestamp);

        _transferNative(bounty.poster, refundAmount);
        emit BountyCancelled(bountyId, bounty.poster, refundAmount);
    }

    /// @inheritdoc IBountyBoard
    function recordSubmission(
        uint256 bountyId,
        address resolver,
        bytes32 verdictHash,
        uint16 confidence,
        string calldata evidenceUri
    ) external {
        if (msg.sender != consensusEngine) {
            revert NotConsensusEngine(msg.sender, consensusEngine);
        }

        Bounty storage bounty = _loadBounty(bountyId);
        if (bounty.status != BountyStatus.Open && bounty.status != BountyStatus.Submitted) {
            revert BountyNotOpen(bountyId, uint8(bounty.status));
        }
        if (block.timestamp > bounty.deadline) {
            revert DeadlinePassed(bountyId, bounty.deadline);
        }
        if (_submissions[bountyId][resolver].submittedAt != 0) {
            revert ResolverAlreadySubmitted(bountyId, resolver);
        }
        if (_submissionCount[bountyId] >= MAX_SUBMISSIONS_PER_BOUNTY) {
            revert TooManySubmissions(bountyId, MAX_SUBMISSIONS_PER_BOUNTY);
        }

        if (bounty.status == BountyStatus.Open) {
            bounty.status = BountyStatus.Submitted;
        }

        _submissions[bountyId][resolver] = Submission({
            resolver: resolver,
            verdictHash: verdictHash,
            confidence: confidence,
            evidenceUri: evidenceUri,
            submittedAt: uint64(block.timestamp)
        });
        _submissionCount[bountyId]++;

        emit SubmissionRecorded(bountyId, resolver, verdictHash, confidence, evidenceUri, uint64(block.timestamp));
    }

    /// @inheritdoc IBountyBoard
    function settleBounty(
        uint256 bountyId,
        bytes32 winningVerdictHash,
        address[] calldata winners,
        uint256[] calldata payoutShares
    ) external {
        if (msg.sender != consensusEngine) {
            revert NotConsensusEngine(msg.sender, consensusEngine);
        }
        if (winners.length == 0 || winners.length != payoutShares.length) {
            revert InvalidWinnerArray();
        }

        Bounty storage bounty = _loadBounty(bountyId);
        if (bounty.status != BountyStatus.Submitted) {
            revert BountyNotInSubmittedState(bountyId, uint8(bounty.status));
        }

        uint256 payout = bounty.payout;
        uint256 feeAmount = (payout * PROTOCOL_FEE_BPS) / 10_000;
        uint256 distributable = payout - feeAmount;

        uint256 shareSum;
        for (uint256 i = 0; i < payoutShares.length; i++) {
            shareSum += payoutShares[i];
        }
        if (shareSum != distributable) {
            revert PayoutShareMismatch(shareSum, distributable);
        }

        bounty.payout = 0;
        bounty.status = BountyStatus.Resolved;
        bounty.resolvedAt = uint64(block.timestamp);
        bounty.winningVerdictHash = winningVerdictHash;

        if (feeAmount > 0) {
            _transferNative(protocolTreasury, feeAmount);
        }
        for (uint256 i = 0; i < winners.length; i++) {
            if (payoutShares[i] > 0) {
                _transferNative(winners[i], payoutShares[i]);
            }
        }

        emit BountySettled(bountyId, winningVerdictHash, winners, payoutShares, feeAmount);
    }

    /// @inheritdoc IBountyBoard
    function markUnresolved(uint256 bountyId) external {
        if (msg.sender != consensusEngine) {
            revert NotConsensusEngine(msg.sender, consensusEngine);
        }

        Bounty storage bounty = _loadBounty(bountyId);
        if (bounty.status == BountyStatus.Open) {
            if (block.timestamp <= bounty.deadline) {
                revert BountyNotInSubmittedState(bountyId, uint8(bounty.status));
            }
        } else if (bounty.status != BountyStatus.Submitted) {
            revert BountyNotInSubmittedState(bountyId, uint8(bounty.status));
        }

        uint256 payout = bounty.payout;
        uint256 feeAmount = (payout * PROTOCOL_FEE_BPS) / 10_000;
        uint256 refundAmount = payout - feeAmount;

        bounty.payout = 0;
        bounty.status = BountyStatus.Unresolved;
        bounty.resolvedAt = uint64(block.timestamp);

        if (feeAmount > 0) {
            _transferNative(protocolTreasury, feeAmount);
        }
        _transferNative(bounty.poster, refundAmount);

        emit BountyUnresolved(bountyId, refundAmount, feeAmount);
    }

    /// @inheritdoc IBountyBoard
    function getBounty(uint256 bountyId) external view returns (Bounty memory bounty) {
        bounty = _bounties[bountyId];
        if (bounty.id == 0) {
            revert BountyDoesNotExist(bountyId);
        }
    }

    /// @inheritdoc IBountyBoard
    function getSubmission(uint256 bountyId, address resolver) external view returns (Submission memory submission) {
        if (_bounties[bountyId].id == 0) {
            revert BountyDoesNotExist(bountyId);
        }
        submission = _submissions[bountyId][resolver];
        if (submission.submittedAt == 0) {
            revert BountyDoesNotExist(bountyId);
        }
    }

    /// @inheritdoc IBountyBoard
    function getOpenBounties(uint256 offset, uint256 limit) external view returns (uint256[] memory bountyIds) {
        if (limit == 0) {
            return new uint256[](0);
        }

        uint256 openCount;
        for (uint256 id = 1; id < _nextBountyId; id++) {
            if (_bounties[id].status == BountyStatus.Open) {
                openCount++;
            }
        }

        if (offset >= openCount) {
            return new uint256[](0);
        }

        uint256 remaining = openCount - offset;
        uint256 resultLength = limit < remaining ? limit : remaining;
        bountyIds = new uint256[](resultLength);

        uint256 skipped;
        uint256 filled;
        for (uint256 id = 1; id < _nextBountyId && filled < resultLength; id++) {
            if (_bounties[id].status != BountyStatus.Open) continue;
            if (skipped < offset) {
                skipped++;
                continue;
            }
            bountyIds[filled++] = id;
        }
    }

    /// @inheritdoc IBountyBoard
    function bountyCount() external view returns (uint256 count) {
        return _bountyCount;
    }

    function _loadBounty(uint256 bountyId) internal view returns (Bounty storage bounty) {
        bounty = _bounties[bountyId];
        if (bounty.id == 0) {
            revert BountyDoesNotExist(bountyId);
        }
    }

    function _transferNative(address recipient, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = recipient.call{value: amount}("");
        if (!ok) {
            revert TransferFailed(recipient, amount);
        }
    }

    receive() external payable {}
}

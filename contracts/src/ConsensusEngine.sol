// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBountyBoard} from "./interfaces/IBountyBoard.sol";
import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";
import {IResolverPayoutPrefs} from "./interfaces/IResolverPayoutPrefs.sol";
import {ISettlement} from "./interfaces/ISettlement.sol";

/// @title ConsensusEngine
/// @notice Aggregates resolver submissions, detects agreement, triggers settlement or unresolved
/// @dev Option B: native payouts go direct to resolver; cross-chain payouts route to Settlement
contract ConsensusEngine {
    uint8 public constant MAX_SUBMISSIONS = 2;
    uint16 public constant PROTOCOL_FEE_BPS = 200;
    uint16 public constant FIRST_SUBMITTER_BPS = 6000;

    IBountyBoard public immutable bountyBoard;
    IResolverRegistry public immutable registry;
    ISettlement public immutable settlement;
    IResolverPayoutPrefs public immutable payoutPrefs;
    address public immutable registryOwner;

    enum ConsensusStatus {
        Pending,
        Agreed,
        Disagreed,
        Unresolved
    }

    struct Submission {
        address resolver;
        bytes32 verdictHash;
        uint16 confidence;
        string evidenceUri;
        uint64 submittedAt;
    }

    mapping(uint256 => Submission[]) internal _submissions;
    mapping(uint256 => mapping(address => bool)) public submitters;
    mapping(uint256 => ConsensusStatus) public status;

    event VerdictReceived(
        uint256 indexed bountyId, address indexed resolver, bytes32 verdictHash, uint16 confidence, uint64 submittedAt
    );
    event ConsensusReached(uint256 indexed bountyId, bytes32 winningHash, address[] winners, uint256[] shares);
    event ConsensusFailed(uint256 indexed bountyId, string reason, address submitter1, address submitter2);

    error ResolverNotActive(address resolver);
    error ResolverDoesNotHandleType(address resolver, bytes32 typeTag);
    error BountyNotOpenOrSubmitted(uint256 bountyId, uint8 status);
    error DeadlinePassed(uint256 bountyId, uint64 deadline);
    error AlreadySubmitted(uint256 bountyId, address resolver);
    error TooManySubmissions(uint256 bountyId, uint8 maximum);
    error InvalidPayoutShares();
    error ConsensusAlreadyFinalized(uint256 bountyId, uint8 status);
    error DeadlineNotPassed(uint256 bountyId, uint64 deadline);
    error NotRegistryOwner(address caller, address expected);

    constructor(
        address bountyBoard_,
        address registry_,
        address settlement_,
        address payoutPrefs_,
        address registryOwner_
    ) {
        if (
            bountyBoard_ == address(0) || registry_ == address(0) || settlement_ == address(0)
                || payoutPrefs_ == address(0)
        ) {
            revert ResolverNotActive(address(0));
        }
        bountyBoard = IBountyBoard(bountyBoard_);
        registry = IResolverRegistry(registry_);
        settlement = ISettlement(settlement_);
        payoutPrefs = IResolverPayoutPrefs(payoutPrefs_);
        registryOwner = registryOwner_;
    }

    /// @notice Testnet smoke helper — queues a payout through Settlement (registry owner only)
    function smokeQueuePayout(uint256 bountyId, address resolver) external payable {
        if (msg.sender != registryOwner) revert NotRegistryOwner(msg.sender, registryOwner);
        settlement.queuePayout{value: msg.value}(bountyId, resolver, msg.value);
    }

    function submitVerdict(uint256 bountyId, bytes32 verdictHash, uint16 confidence, string calldata evidenceUri)
        external
    {
        if (!registry.isActive(msg.sender)) revert ResolverNotActive(msg.sender);

        if (submitters[bountyId][msg.sender]) revert AlreadySubmitted(bountyId, msg.sender);
        if (_submissions[bountyId].length >= MAX_SUBMISSIONS) {
            revert TooManySubmissions(bountyId, MAX_SUBMISSIONS);
        }
        if (status[bountyId] != ConsensusStatus.Pending) {
            revert ConsensusAlreadyFinalized(bountyId, uint8(status[bountyId]));
        }

        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        if (bounty.status != IBountyBoard.BountyStatus.Open && bounty.status != IBountyBoard.BountyStatus.Submitted) {
            revert BountyNotOpenOrSubmitted(bountyId, uint8(bounty.status));
        }
        if (block.timestamp > bounty.deadline) revert DeadlinePassed(bountyId, bounty.deadline);
        if (!registry.handlesTypeTag(msg.sender, bounty.bountyType)) {
            revert ResolverDoesNotHandleType(msg.sender, bounty.bountyType);
        }

        uint64 submittedAt = uint64(block.timestamp);
        _submissions[bountyId].push(
            Submission({
                resolver: msg.sender,
                verdictHash: verdictHash,
                confidence: confidence,
                evidenceUri: evidenceUri,
                submittedAt: submittedAt
            })
        );
        submitters[bountyId][msg.sender] = true;

        bountyBoard.recordSubmission(bountyId, msg.sender, verdictHash, confidence, evidenceUri);
        emit VerdictReceived(bountyId, msg.sender, verdictHash, confidence, submittedAt);

        if (_submissions[bountyId].length == MAX_SUBMISSIONS) {
            _checkConsensus(bountyId);
        }
    }

    function markExpired(uint256 bountyId) external {
        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        if (block.timestamp <= bounty.deadline) revert DeadlineNotPassed(bountyId, bounty.deadline);
        if (status[bountyId] != ConsensusStatus.Pending) {
            revert ConsensusAlreadyFinalized(bountyId, uint8(status[bountyId]));
        }
        if (_submissions[bountyId].length >= MAX_SUBMISSIONS) {
            revert ConsensusAlreadyFinalized(bountyId, uint8(status[bountyId]));
        }

        status[bountyId] = ConsensusStatus.Unresolved;

        address submitter1 = _submissions[bountyId].length > 0 ? _submissions[bountyId][0].resolver : address(0);
        address submitter2 = _submissions[bountyId].length > 1 ? _submissions[bountyId][1].resolver : address(0);

        bountyBoard.markUnresolved(bountyId);
        _applyFailedReputation(bountyId);

        emit ConsensusFailed(bountyId, "expired", submitter1, submitter2);
    }

    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        return _submissions[bountyId];
    }

    function getStatus(uint256 bountyId) external view returns (ConsensusStatus) {
        return status[bountyId];
    }

    function hasSubmitted(uint256 bountyId, address resolver) external view returns (bool) {
        return submitters[bountyId][resolver];
    }

    function getSubmissionCount(uint256 bountyId) external view returns (uint8) {
        return uint8(_submissions[bountyId].length);
    }

    function _checkConsensus(uint256 bountyId) internal {
        Submission[] storage subs = _submissions[bountyId];
        Submission storage first = subs[0];
        Submission storage second = subs[1];

        if (first.verdictHash == second.verdictHash) {
            status[bountyId] = ConsensusStatus.Agreed;
            _settle(bountyId, first.verdictHash, first, second);
        } else {
            status[bountyId] = ConsensusStatus.Disagreed;
            bountyBoard.markUnresolved(bountyId);
            _applyFailedReputation(bountyId);
            emit ConsensusFailed(bountyId, "disagreement", first.resolver, second.resolver);
        }
    }

    function _settle(uint256 bountyId, bytes32 winningHash, Submission storage first, Submission storage second)
        internal
    {
        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        uint256 feeAmount = (bounty.payout * PROTOCOL_FEE_BPS) / 10_000;
        uint256 distributable = bounty.payout - feeAmount;

        uint256 firstShare = (distributable * FIRST_SUBMITTER_BPS) / 10_000;
        uint256 secondShare = distributable - firstShare;
        if (firstShare + secondShare != distributable) revert InvalidPayoutShares();

        address[] memory winners = new address[](2);
        uint256[] memory shares = new uint256[](2);

        winners[0] = _payoutRecipient(first.resolver);
        winners[1] = _payoutRecipient(second.resolver);
        shares[0] = firstShare;
        shares[1] = secondShare;

        bountyBoard.settleBounty(bountyId, winningHash, winners, shares);

        _queueCrossChainIfNeeded(bountyId, first.resolver, firstShare, winners[0] == address(settlement));
        _queueCrossChainIfNeeded(bountyId, second.resolver, secondShare, winners[1] == address(settlement));

        registry.updateReputation(first.resolver, true, firstShare);
        registry.updateReputation(second.resolver, true, secondShare);

        emit ConsensusReached(bountyId, winningHash, winners, shares);
    }

    function _payoutRecipient(address resolver) internal view returns (address) {
        IResolverPayoutPrefs.PayoutPref memory pref = payoutPrefs.getPreference(resolver);
        if (pref.mode == uint8(IResolverPayoutPrefs.PayoutMode.CrossChain)) {
            return address(settlement);
        }
        return resolver;
    }

    function _queueCrossChainIfNeeded(uint256 bountyId, address resolver, uint256 amount, bool routedToSettlement)
        internal
    {
        if (!routedToSettlement) return;
        settlement.queuePayout(bountyId, resolver, amount);
    }

    function _applyFailedReputation(uint256 bountyId) internal {
        Submission[] storage subs = _submissions[bountyId];
        for (uint256 i = 0; i < subs.length; i++) {
            registry.updateReputation(subs[i].resolver, false, 0);
        }
    }
}

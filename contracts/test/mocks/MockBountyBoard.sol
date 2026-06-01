// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBountyBoard} from "../../src/interfaces/IBountyBoard.sol";

/// @notice Minimal BountyBoard mock for ResolverAgent / ConsensusEngine tests
contract MockBountyBoard is IBountyBoard {
    bytes32 public constant URL_RESOLVABLE_FACT = keccak256("URL_RESOLVABLE_FACT");

    address public engine;

    mapping(uint256 => Bounty) internal _bounties;
    mapping(uint256 => mapping(address => Submission)) internal _submissions;
    mapping(uint256 => uint8) internal _submissionCount;
    uint256 public bountyCount;

    struct SettleCall {
        uint256 bountyId;
        bytes32 winningHash;
        address[] winners;
        uint256[] shares;
    }

    SettleCall internal _lastSettle;

    function lastSettleBountyId() external view returns (uint256) {
        return _lastSettle.bountyId;
    }

    function lastSettleWinningHash() external view returns (bytes32) {
        return _lastSettle.winningHash;
    }

    function lastSettleWinners(uint256 index) external view returns (address) {
        return _lastSettle.winners[index];
    }

    function lastSettleShares(uint256 index) external view returns (uint256) {
        return _lastSettle.shares[index];
    }
    uint256 public markUnresolvedCount;
    uint256 public lastMarkUnresolvedBountyId;

    function setConsensusEngine(address engine_) external {
        engine = engine_;
    }

    function setBounty(uint256 bountyId, Bounty calldata bounty) external {
        _bounties[bountyId] = bounty;
        if (bountyId >= bountyCount) bountyCount = bountyId + 1;
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return _bounties[bountyId];
    }

    function recordSubmission(
        uint256 bountyId,
        address resolver,
        bytes32 verdictHash,
        uint16 confidence,
        string calldata evidenceUri
    ) external {
        if (engine != address(0) && msg.sender != engine) {
            revert NotConsensusEngine(msg.sender, engine);
        }
        Bounty storage bounty = _bounties[bountyId];
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

    function settleBounty(
        uint256 bountyId,
        bytes32 winningVerdictHash,
        address[] calldata winners,
        uint256[] calldata payoutShares
    ) external {
        if (engine != address(0) && msg.sender != engine) {
            revert NotConsensusEngine(msg.sender, engine);
        }
        _lastSettle = SettleCall({
            bountyId: bountyId,
            winningHash: winningVerdictHash,
            winners: winners,
            shares: payoutShares
        });
        Bounty storage bounty = _bounties[bountyId];
        bounty.status = BountyStatus.Resolved;
        bounty.winningVerdictHash = winningVerdictHash;
        bounty.payout = 0;
        emit BountySettled(bountyId, winningVerdictHash, winners, payoutShares, 0);
    }

    function markUnresolved(uint256 bountyId) external {
        if (engine != address(0) && msg.sender != engine) {
            revert NotConsensusEngine(msg.sender, engine);
        }
        lastMarkUnresolvedBountyId = bountyId;
        markUnresolvedCount++;
        Bounty storage bounty = _bounties[bountyId];
        bounty.status = BountyStatus.Unresolved;
        bounty.payout = 0;
        emit BountyUnresolved(bountyId, 0, 0);
    }

    function getSubmission(uint256 bountyId, address resolver) external view returns (Submission memory) {
        return _submissions[bountyId][resolver];
    }

    function getSubmissionCount(uint256 bountyId) external view returns (uint8) {
        return _submissionCount[bountyId];
    }

    function postBounty(string calldata claim, string[] calldata evidenceSources, bytes32 bountyType, uint64 deadline)
        external
        payable
        returns (uint256 bountyId)
    {
        bountyId = bountyCount + 1;
        bountyCount = bountyId + 1;
        _bounties[bountyId] = Bounty({
            id: bountyId,
            poster: msg.sender,
            claim: claim,
            evidenceSources: evidenceSources,
            bountyType: bountyType,
            deadline: deadline,
            payout: msg.value,
            status: BountyStatus.Open,
            createdAt: uint64(block.timestamp),
            resolvedAt: 0,
            winningVerdictHash: bytes32(0)
        });
        return bountyId;
    }

    function cancelBounty(uint256) external pure {
        revert("not implemented");
    }

    function getOpenBounties(uint256, uint256) external pure returns (uint256[] memory) {
        revert("not implemented");
    }

    function protocolTreasury() external pure returns (address) {
        return address(0);
    }

    function consensusEngine() external view returns (address) {
        return engine;
    }

    receive() external payable {}
}

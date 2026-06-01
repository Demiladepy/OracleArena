// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBountyBoard} from "./interfaces/IBountyBoard.sol";
import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";
import {IResolverPayoutPrefs} from "./interfaces/IResolverPayoutPrefs.sol";
import {ResolverPayoutPrefs} from "./ResolverPayoutPrefs.sol";
import {ILiFiAdapter} from "./interfaces/ILiFiAdapter.sol";
import {ISettlement} from "./interfaces/ISettlement.sol";

/// @title Settlement
/// @notice Queues cross-chain resolver payouts and forwards via LiFiAdapter (Option B additive layer)
contract Settlement is ISettlement {
    uint256 public constant RESCUE_DELAY = 24 hours;

    IBountyBoard public immutable bountyBoard;
    address public immutable consensusEngine;
    IResolverPayoutPrefs public immutable payoutPrefs;
    ILiFiAdapter public immutable lifiAdapter;

    mapping(uint256 => mapping(address => uint256)) public pendingForwards;
    mapping(uint256 => mapping(address => uint64)) public queuedAt;

    constructor(address bountyBoard_, address consensusEngine_, address payoutPrefs_, address lifiAdapter_) {
        if (bountyBoard_ == address(0) || consensusEngine_ == address(0) || payoutPrefs_ == address(0) || lifiAdapter_ == address(0)) {
            revert NotConsensusEngine(address(0), consensusEngine_);
        }
        bountyBoard = IBountyBoard(bountyBoard_);
        consensusEngine = consensusEngine_;
        payoutPrefs = IResolverPayoutPrefs(payoutPrefs_);
        lifiAdapter = ILiFiAdapter(lifiAdapter_);
    }

    receive() external payable {
        if (msg.sender != address(bountyBoard)) revert NotBountyBoard(msg.sender, address(bountyBoard));
    }

    /// @inheritdoc ISettlement
    function queuePayout(uint256 bountyId, address resolver, uint256 amount) external payable {
        if (msg.sender != consensusEngine) revert NotConsensusEngine(msg.sender, consensusEngine);
        if (amount == 0) revert AmountMismatch(0, msg.value);

        if (msg.value != 0) {
            if (msg.value != amount) revert AmountMismatch(amount, msg.value);
        }

        pendingForwards[bountyId][resolver] = amount;
        queuedAt[bountyId][resolver] = uint64(block.timestamp);
        emit PayoutQueued(bountyId, resolver, amount, uint64(block.timestamp));
    }

    /// @inheritdoc ISettlement
    function forwardPayout(uint256 bountyId, address resolver) external {
        uint256 amount = pendingForwards[bountyId][resolver];
        if (amount == 0) revert NoPendingForward(bountyId, resolver);

        IResolverPayoutPrefs.PayoutPref memory pref = payoutPrefs.getPreference(resolver);
        if (pref.mode == uint8(IResolverPayoutPrefs.PayoutMode.SomniaNative)) {
            revert UnexpectedNativePreference(resolver);
        }

        delete pendingForwards[bountyId][resolver];
        delete queuedAt[bountyId][resolver];

        lifiAdapter.initiateBridge{value: amount}(
            resolver, pref.destinationChain, pref.destinationAsset, pref.destinationRecipient
        );

        emit PayoutForwarded(bountyId, resolver, amount, pref.destinationChain, pref.destinationAsset);
    }

    /// @inheritdoc ISettlement
    function rescuePayout(uint256 bountyId, address resolver) external {
        uint256 amount = pendingForwards[bountyId][resolver];
        if (amount == 0) revert NoPendingForward(bountyId, resolver);

        uint64 readyAt = queuedAt[bountyId][resolver] + uint64(RESCUE_DELAY);
        if (block.timestamp < readyAt) revert RescueDelayNotElapsed(readyAt, uint64(block.timestamp));

        IResolverRegistry.Agent memory agent =
            ResolverPayoutPrefs(address(payoutPrefs)).registry().getAgent(resolver);
        if (msg.sender != agent.operator) revert IResolverPayoutPrefs.NotOperator(msg.sender, agent.operator);

        delete pendingForwards[bountyId][resolver];
        delete queuedAt[bountyId][resolver];

        _transferNative(agent.operator, amount);
        emit PayoutRescued(bountyId, resolver, amount, agent.operator);
    }

    function getPendingForward(uint256 bountyId, address resolver) external view returns (uint256) {
        return pendingForwards[bountyId][resolver];
    }

    function getQueuedAt(uint256 bountyId, address resolver) external view returns (uint64) {
        return queuedAt[bountyId][resolver];
    }

    function _transferNative(address to, uint256 amount) internal {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }
}

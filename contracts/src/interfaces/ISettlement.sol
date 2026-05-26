// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BountyTypes} from "../libraries/BountyTypes.sol";

/// @title ISettlement
/// @notice Atomic payout after consensus: 60/40 speed split (MVP), optional cross-chain via LiFiAdapter
interface ISettlement {
    /// @notice Emitted when bounty escrow is distributed to resolvers
    event BountyPaidOut(
        uint256 indexed bountyId,
        address indexed firstSubmitter,
        address indexed secondSubmitter,
        uint256 firstAmount,
        uint256 secondAmount
    );

    error BountyNotSettled();
    error PayoutFailed();
    error OnlyConsensusEngine();

    /// @notice Execute payout for a settled bounty
    /// @param bountyId Bounty identifier
    /// @param verdict Agreed verdict (for reputation updates)
    /// @param firstSubmitter Address of first submitter (60% share)
    /// @param secondSubmitter Address of second submitter (40% share)
    function settle(uint256 bountyId, BountyTypes.Verdict verdict, address firstSubmitter, address secondSubmitter)
        external;
}

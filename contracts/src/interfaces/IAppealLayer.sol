// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BountyTypes} from "../libraries/BountyTypes.sol";

/// @title IAppealLayer
/// @notice Phase 2: bonded challenge mechanism triggering re-resolution and bond slashing
/// @dev Interface stub in Phase 1 — no implementation. Activates ResolverRegistry.slash() when built.
interface IAppealLayer {
    /// @notice Emitted when a challenger opens an appeal
    event AppealOpened(uint256 indexed bountyId, address indexed challenger, uint256 bondAmount);

    /// @notice Emitted when an appeal is resolved
    event AppealResolved(uint256 indexed bountyId, bool challengeSucceeded);

    error AppealNotAllowed();
    error InsufficientChallengeBond();
    error BountyNotSettled();

    /// @notice Open a bonded challenge against a settled bounty
    /// @param bountyId Settled bounty identifier
    /// @param adversarialEvidenceUrls URLs the original agents did not consider
    function openAppeal(uint256 bountyId, string[] calldata adversarialEvidenceUrls) external payable;

    /// @notice Resolve an appeal after re-resolution (Phase 2)
    /// @param bountyId Bounty identifier
    /// @param newVerdict Verdict from re-resolution
    function resolveAppeal(uint256 bountyId, BountyTypes.Verdict newVerdict) external;
}

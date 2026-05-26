// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";

/// @title ResolverRegistry
/// @notice Agent registration, bonding, specialization tags, and reputation ledger
/// @dev Implementation TODO — slash() implemented but gated until AppealLayer (Phase 2)
abstract contract ResolverRegistry is IResolverRegistry {
    // TODO: implement registerAgent, slash, updateReputation, getBond, getReputation, handlesTypeTag, minimumBond, setAppealLayer
}

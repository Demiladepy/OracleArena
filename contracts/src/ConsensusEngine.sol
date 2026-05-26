// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConsensusEngine} from "./interfaces/IConsensusEngine.sol";

/// @title ConsensusEngine
/// @notice Multi-agent resolution: two-submitter agreement (MVP), Unresolved on disagreement
/// @dev Implementation TODO — see README Phase 1 scope
abstract contract ConsensusEngine is IConsensusEngine {
    // TODO: implement submitVerdict, getSubmissionCount, getSubmission
}

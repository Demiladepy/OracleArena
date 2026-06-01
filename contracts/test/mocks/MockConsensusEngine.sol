// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBountyBoard} from "../../src/interfaces/IBountyBoard.sol";

/// @notice Minimal ConsensusEngine mock — forwards submitVerdict to BountyBoard.recordSubmission
contract MockConsensusEngine {
    IBountyBoard public immutable bountyBoard;

    struct VerdictCall {
        uint256 bountyId;
        address resolver;
        bytes32 verdictHash;
        uint16 confidence;
        string evidenceUri;
    }

    VerdictCall public lastVerdict;

    constructor(address bountyBoard_) {
        bountyBoard = IBountyBoard(bountyBoard_);
    }

    function submitVerdict(uint256 bountyId, bytes32 verdictHash, uint16 confidence, string calldata evidenceUri)
        external
    {
        lastVerdict = VerdictCall({
            bountyId: bountyId,
            resolver: msg.sender,
            verdictHash: verdictHash,
            confidence: confidence,
            evidenceUri: evidenceUri
        });
        bountyBoard.recordSubmission(bountyId, msg.sender, verdictHash, confidence, evidenceUri);
    }

    function getLastVerdict() external view returns (VerdictCall memory) {
        return lastVerdict;
    }
}

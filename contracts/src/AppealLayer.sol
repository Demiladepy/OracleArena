// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAppealLayer} from "./interfaces/IAppealLayer.sol";
import {IBountyBoard} from "./interfaces/IBountyBoard.sol";
import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";
import {BountyTypes} from "./libraries/BountyTypes.sol";

interface IAppealConsensusEngine {
    struct Submission {
        address resolver;
        bytes32 verdictHash;
        uint16 confidence;
        string evidenceUri;
        uint64 submittedAt;
    }

    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory);
}

/// @title AppealLayer
/// @notice Bonded challenges against settled bounties; activates ResolverRegistry.slash on successful appeals
contract AppealLayer is IAppealLayer {
    IBountyBoard public immutable bountyBoard;
    IResolverRegistry public immutable registry;
    IAppealConsensusEngine public immutable consensusEngine;
    address public immutable owner;
    address public immutable treasury;

    uint256 public immutable minChallengeBond;
    uint64 public immutable appealWindow;

    struct AppealRecord {
        address challenger;
        uint256 bond;
        string[] adversarialEvidence;
        uint64 openedAt;
        bool resolved;
        bool succeeded;
    }

    mapping(uint256 => AppealRecord) public appeals;

    error AppealAlreadyOpen(uint256 bountyId);
    error AppealNotOpen(uint256 bountyId);
    error AppealAlreadyResolved(uint256 bountyId);
    error AppealWindowExpired(uint256 bountyId, uint64 resolvedAt, uint64 deadline);
    error NotOwner(address caller, address expected);
    error InvalidResolverCount(uint256 count);
    error TransferFailed(address recipient, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender, owner);
        _;
    }

    constructor(
        address bountyBoard_,
        address registry_,
        address consensusEngine_,
        address treasury_,
        address owner_,
        uint256 minChallengeBond_,
        uint64 appealWindow_
    ) {
        if (
            bountyBoard_ == address(0) || registry_ == address(0) || consensusEngine_ == address(0)
                || treasury_ == address(0) || owner_ == address(0)
        ) {
            revert TransferFailed(address(0), 0);
        }
        if (minChallengeBond_ == 0 || appealWindow_ == 0) revert InsufficientChallengeBond();

        bountyBoard = IBountyBoard(bountyBoard_);
        registry = IResolverRegistry(registry_);
        consensusEngine = IAppealConsensusEngine(consensusEngine_);
        treasury = treasury_;
        owner = owner_;
        minChallengeBond = minChallengeBond_;
        appealWindow = appealWindow_;
    }

    /// @inheritdoc IAppealLayer
    function openAppeal(uint256 bountyId, string[] calldata adversarialEvidenceUrls) external payable {
        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        if (bounty.status != IBountyBoard.BountyStatus.Resolved) revert BountyNotSettled();
        if (block.timestamp > bounty.resolvedAt + appealWindow) {
            revert AppealWindowExpired(bountyId, bounty.resolvedAt, bounty.resolvedAt + appealWindow);
        }
        if (msg.value < minChallengeBond) revert InsufficientChallengeBond();

        AppealRecord storage appeal = appeals[bountyId];
        if (appeal.challenger != address(0) && !appeal.resolved) {
            revert AppealAlreadyOpen(bountyId);
        }

        appeal.challenger = msg.sender;
        appeal.bond = msg.value;
        appeal.adversarialEvidence = adversarialEvidenceUrls;
        appeal.openedAt = uint64(block.timestamp);
        appeal.resolved = false;
        appeal.succeeded = false;

        emit AppealOpened(bountyId, msg.sender, msg.value);
    }

    /// @inheritdoc IAppealLayer
    /// @dev Owner resolves after off-chain re-review. Successful challenge slashes both resolvers.
    function resolveAppeal(uint256 bountyId, BountyTypes.Verdict newVerdict) external onlyOwner {
        AppealRecord storage appeal = appeals[bountyId];
        if (appeal.challenger == address(0)) revert AppealNotOpen(bountyId);
        if (appeal.resolved) revert AppealAlreadyResolved(bountyId);

        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        bytes32 newHash = _verdictToHash(newVerdict);
        bool challengeSucceeded = newHash != bounty.winningVerdictHash;

        appeal.resolved = true;
        appeal.succeeded = challengeSucceeded;

        if (challengeSucceeded) {
            IAppealConsensusEngine.Submission[] memory subs = consensusEngine.getSubmissions(bountyId);
            if (subs.length != 2) revert InvalidResolverCount(subs.length);

            uint256 slashAmount = appeal.bond / 2;
            if (slashAmount == 0) slashAmount = appeal.bond;

            for (uint256 i = 0; i < subs.length; i++) {
                uint256 bond = registry.getBond(subs[i].resolver);
                uint256 amount = slashAmount > bond ? bond : slashAmount;
                if (amount > 0) {
                    registry.slash(subs[i].resolver, amount, appeal.challenger);
                }
            }

            _transferNative(appeal.challenger, appeal.bond);
        } else {
            _transferNative(treasury, appeal.bond);
        }

        emit AppealResolved(bountyId, challengeSucceeded);
    }

    function getAppeal(uint256 bountyId)
        external
        view
        returns (
            address challenger,
            uint256 bond,
            string[] memory adversarialEvidence,
            uint64 openedAt,
            bool resolved,
            bool succeeded
        )
    {
        AppealRecord storage appeal = appeals[bountyId];
        return (
            appeal.challenger,
            appeal.bond,
            appeal.adversarialEvidence,
            appeal.openedAt,
            appeal.resolved,
            appeal.succeeded
        );
    }

    function _verdictToHash(BountyTypes.Verdict verdict) internal pure returns (bytes32) {
        if (verdict == BountyTypes.Verdict.TRUE) return keccak256("true");
        if (verdict == BountyTypes.Verdict.FALSE) return keccak256("false");
        return keccak256("unresolvable");
    }

    function _transferNative(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }

    receive() external payable {}
}

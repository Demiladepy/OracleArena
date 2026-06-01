// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";

/// @title ResolverRegistry
/// @notice Agent registration, bonding, specialization tags, and reputation ledger
/// @dev MVP: slash() gated until AppealLayer is configured via setAppealLayer (once)
contract ResolverRegistry is IResolverRegistry {
    /// @notice Minimum bond required at registration (wei). Production target: 50 STT.
    /// @dev For testnet, deploy with a low value (e.g. 1 STT) to stay within faucet budgets.
    uint256 public immutable MIN_BOND;
    uint256 public constant MAX_TYPE_TAGS = 10;
    uint256 public constant WITHDRAWAL_DELAY = 24 hours;

    /// @dev TODO: replace deployer placeholder once ConsensusEngine is deployed
    address public immutable consensusEngine;
    address public immutable owner;
    address public appealLayer;

    struct AgentRecord {
        address operator;
        uint256 bond;
        Reputation reputation;
        AgentStatus status;
        uint64 registeredAt;
        uint64 withdrawalReadyAt;
    }

    uint256 private _totalAgents;
    mapping(address => AgentRecord) private _agents;
    mapping(address => bytes32[]) private _typeTags;
    mapping(address => mapping(bytes32 => bool)) private _handlesTypeTag;
    mapping(bytes32 => address[]) private _agentsByTag;
    mapping(address => bool) private _everRegistered;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender, owner);
        _;
    }

    modifier onlyConsensusEngine() {
        if (msg.sender != consensusEngine) revert NotConsensusEngine(msg.sender, consensusEngine);
        _;
    }

    /// @param consensusEngine_ Only address allowed to call updateReputation (deployer placeholder in MVP)
    /// @param owner_ Can call setAppealLayer once
    /// @param minBond_ Minimum STT bond for registerAgent (production target: 50 ether)
    constructor(address consensusEngine_, address owner_, uint256 minBond_) {
        if (consensusEngine_ == address(0) || owner_ == address(0)) {
            revert TransferFailed(address(0), 0);
        }
        if (minBond_ == 0) revert BondTooSmall(0, 1);
        consensusEngine = consensusEngine_;
        owner = owner_;
        MIN_BOND = minBond_;
    }

    /// @inheritdoc IResolverRegistry
    function registerAgent(address agent, bytes32[] calldata typeTags) external payable {
        if (_everRegistered[agent]) revert AgentAlreadyRegistered(agent);
        if (msg.value < MIN_BOND) revert BondTooSmall(msg.value, MIN_BOND);
        if (typeTags.length == 0) revert NoTypeTags();
        if (typeTags.length > MAX_TYPE_TAGS) revert TooManyTypeTags(typeTags.length, MAX_TYPE_TAGS);

        _everRegistered[agent] = true;
        _totalAgents++;

        AgentRecord storage record = _agents[agent];
        record.operator = msg.sender;
        record.bond = msg.value;
        record.status = AgentStatus.Active;
        record.registeredAt = uint64(block.timestamp);

        delete _typeTags[agent];
        for (uint256 i = 0; i < typeTags.length; i++) {
            bytes32 tag = typeTags[i];
            if (!_handlesTypeTag[agent][tag]) {
                _typeTags[agent].push(tag);
                _handlesTypeTag[agent][tag] = true;
                _agentsByTag[tag].push(agent);
            }
        }

        emit AgentRegistered(agent, msg.sender, _typeTags[agent], msg.value, record.registeredAt);
    }

    /// @inheritdoc IResolverRegistry
    function updateReputation(address agent, bool agreed, uint256 earnings) external onlyConsensusEngine {
        AgentRecord storage record = _requireRegistered(agent);
        if (record.status != AgentStatus.Active) {
            revert AgentNotActive(agent, uint8(record.status));
        }

        record.reputation.resolutionsAttempted++;
        if (agreed) {
            record.reputation.resolutionsAgreed++;
            record.reputation.totalEarnings += earnings;
        }

        emit ReputationUpdated(
            agent, agreed, earnings, record.reputation.resolutionsAttempted, record.reputation.resolutionsAgreed
        );
    }

    /// @inheritdoc IResolverRegistry
    function requestWithdrawal(address agent) external {
        AgentRecord storage record = _requireRegistered(agent);
        if (msg.sender != record.operator) revert NotOperator(msg.sender, record.operator);
        if (record.status != AgentStatus.Active) {
            revert AgentNotActive(agent, uint8(record.status));
        }

        record.status = AgentStatus.Withdrawing;
        record.withdrawalReadyAt = uint64(block.timestamp + WITHDRAWAL_DELAY);

        emit WithdrawalRequested(agent, msg.sender, record.withdrawalReadyAt);
    }

    /// @inheritdoc IResolverRegistry
    function completeWithdrawal(address agent) external {
        AgentRecord storage record = _requireRegistered(agent);
        if (msg.sender != record.operator) revert NotOperator(msg.sender, record.operator);
        if (record.status != AgentStatus.Withdrawing) {
            revert AgentNotWithdrawing(agent, uint8(record.status));
        }
        if (block.timestamp < record.withdrawalReadyAt) {
            revert WithdrawalNotReady(agent, record.withdrawalReadyAt, uint64(block.timestamp));
        }

        uint256 refund = record.bond;
        record.bond = 0;
        record.status = AgentStatus.Withdrawn;

        _transferNative(record.operator, refund);

        emit WithdrawalCompleted(agent, msg.sender, refund);
    }

    /// @inheritdoc IResolverRegistry
    function slash(address agent, uint256 amount, address recipient) external {
        if (msg.sender != appealLayer) revert NotAppealLayer(msg.sender, appealLayer);

        AgentRecord storage record = _requireRegistered(agent);
        if (amount > record.bond) revert SlashAmountExceedsBond(amount, record.bond);

        record.bond -= amount;
        _transferNative(recipient, amount);

        emit AgentSlashed(agent, amount, recipient, msg.sender);
    }

    /// @inheritdoc IResolverRegistry
    function setAppealLayer(address newAppealLayer) external onlyOwner {
        if (appealLayer != address(0)) revert AppealLayerAlreadySet(appealLayer);
        if (newAppealLayer == address(0)) revert AppealLayerNotSet();

        appealLayer = newAppealLayer;
        emit AppealLayerSet(newAppealLayer);
    }

    /// @inheritdoc IResolverRegistry
    function getAgent(address agent) external view returns (Agent memory) {
        AgentRecord storage record = _agents[agent];
        return Agent({
            agentAddress: agent,
            operator: record.operator,
            bond: record.bond,
            typeTags: _typeTags[agent],
            reputation: record.reputation,
            status: record.status,
            registeredAt: record.registeredAt,
            withdrawalReadyAt: record.withdrawalReadyAt
        });
    }

    /// @inheritdoc IResolverRegistry
    function getBond(address agent) external view returns (uint256) {
        return _agents[agent].bond;
    }

    /// @inheritdoc IResolverRegistry
    function getReputation(address agent) external view returns (Reputation memory) {
        return _agents[agent].reputation;
    }

    /// @inheritdoc IResolverRegistry
    function handlesTypeTag(address agent, bytes32 tag) external view returns (bool) {
        return _handlesTypeTag[agent][tag];
    }

    /// @inheritdoc IResolverRegistry
    function getAgentsForTypeTag(bytes32 tag, uint256 offset, uint256 limit) external view returns (address[] memory) {
        address[] storage agents = _agentsByTag[tag];
        if (offset >= agents.length) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > agents.length) {
            end = agents.length;
        }

        uint256 size = end - offset;
        address[] memory page = new address[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = agents[offset + i];
        }
        return page;
    }

    /// @inheritdoc IResolverRegistry
    function totalAgents() external view returns (uint256) {
        return _totalAgents;
    }

    /// @inheritdoc IResolverRegistry
    function isActive(address agent) external view returns (bool) {
        return _agents[agent].status == AgentStatus.Active;
    }

    function _requireRegistered(address agent) internal view returns (AgentRecord storage record) {
        record = _agents[agent];
        if (!_everRegistered[agent]) revert AgentNotRegistered(agent);
    }

    function _transferNative(address to, uint256 amount) internal {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }

    receive() external payable {}
}

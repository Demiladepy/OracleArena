// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolverRegistry} from "../../src/interfaces/IResolverRegistry.sol";

/// @notice Controllable ResolverRegistry mock for ConsensusEngine / Settlement tests
contract MockResolverRegistry is IResolverRegistry {
    mapping(address => bool) internal _isActive;
    mapping(address => mapping(bytes32 => bool)) internal _handlesTypeTag;
    mapping(address => address) internal _operators;

    struct ReputationUpdate {
        address agent;
        bool agreed;
        uint256 earnings;
    }

    ReputationUpdate[] public reputationUpdates;

    function reputationUpdateAgent(uint256 index) external view returns (address) {
        return reputationUpdates[index].agent;
    }

    function reputationUpdateAgreed(uint256 index) external view returns (bool) {
        return reputationUpdates[index].agreed;
    }

    function reputationUpdateEarnings(uint256 index) external view returns (uint256) {
        return reputationUpdates[index].earnings;
    }

    function reputationUpdatesLength() external view returns (uint256) {
        return reputationUpdates.length;
    }

    function setAgent(address agent, bool active, bytes32 tag, bool handles) external {
        _isActive[agent] = active;
        _handlesTypeTag[agent][tag] = handles;
    }

    function setAgent(address agent, address operator, bool active) external {
        _operators[agent] = operator;
        _isActive[agent] = active;
    }

    function isActive(address agent) external view returns (bool) {
        return _isActive[agent];
    }

    function handlesTypeTag(address agent, bytes32 tag) external view returns (bool) {
        return _handlesTypeTag[agent][tag];
    }

    function updateReputation(address agent, bool agreed, uint256 earnings) external {
        reputationUpdates.push(ReputationUpdate({agent: agent, agreed: agreed, earnings: earnings}));
        emit ReputationUpdated(agent, agreed, earnings, 0, 0);
    }

    function getAgent(address agent) external view returns (Agent memory) {
        return Agent({
            agentAddress: agent,
            operator: _operators[agent],
            bond: 0,
            typeTags: new bytes32[](0),
            reputation: Reputation({resolutionsAttempted: 0, resolutionsAgreed: 0, totalEarnings: 0}),
            status: AgentStatus.Active,
            registeredAt: 0,
            withdrawalReadyAt: 0
        });
    }

    function registerAgent(address, bytes32[] calldata) external payable {
        revert("not implemented");
    }

    function requestWithdrawal(address) external pure {
        revert("not implemented");
    }

    function completeWithdrawal(address) external pure {
        revert("not implemented");
    }

    function slash(address, uint256, address) external pure {
        revert("not implemented");
    }

    function setAppealLayer(address) external pure {
        revert("not implemented");
    }

    function getBond(address) external pure returns (uint256) {
        revert("not implemented");
    }

    function getReputation(address) external pure returns (Reputation memory) {
        revert("not implemented");
    }

    function getAgentsForTypeTag(bytes32, uint256, uint256) external pure returns (address[] memory) {
        revert("not implemented");
    }

    function totalAgents() external pure returns (uint256) {
        revert("not implemented");
    }
}

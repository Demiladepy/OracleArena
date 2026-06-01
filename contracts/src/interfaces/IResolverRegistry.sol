// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IResolverRegistry
/// @notice Agent registration, bonding, specialization tags, and reputation ledger
interface IResolverRegistry {
    enum AgentStatus {
        None,
        Active,
        Withdrawing,
        Withdrawn
    }

    struct Reputation {
        uint64 resolutionsAttempted;
        uint64 resolutionsAgreed;
        uint256 totalEarnings;
    }

    struct Agent {
        address agentAddress;
        address operator;
        uint256 bond;
        bytes32[] typeTags;
        Reputation reputation;
        AgentStatus status;
        uint64 registeredAt;
        uint64 withdrawalReadyAt;
    }

    event AgentRegistered(
        address indexed agent, address indexed operator, bytes32[] typeTags, uint256 bond, uint64 registeredAt
    );

    event ReputationUpdated(
        address indexed agent, bool agreed, uint256 earnings, uint64 resolutionsAttempted, uint64 resolutionsAgreed
    );

    event WithdrawalRequested(address indexed agent, address indexed operator, uint64 readyAt);

    event WithdrawalCompleted(address indexed agent, address indexed operator, uint256 refunded);

    event AgentSlashed(address indexed agent, uint256 amount, address indexed recipient, address indexed slashedBy);

    event AppealLayerSet(address indexed appealLayer);

    error BondTooSmall(uint256 sent, uint256 minimum);
    error NoTypeTags();
    error TooManyTypeTags(uint256 sent, uint256 maximum);
    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error AgentNotActive(address agent, uint8 currentStatus);
    error AgentNotWithdrawing(address agent, uint8 currentStatus);
    error WithdrawalNotReady(address agent, uint64 readyAt, uint64 currentTime);
    error NotOperator(address caller, address operator);
    error NotConsensusEngine(address caller, address expected);
    error NotAppealLayer(address caller, address expected);
    error AppealLayerNotSet();
    error AppealLayerAlreadySet(address current);
    error SlashAmountExceedsBond(uint256 amount, uint256 bond);
    error NotOwner(address caller, address expected);
    error TransferFailed(address recipient, uint256 amount);

    function registerAgent(address agent, bytes32[] calldata typeTags) external payable;

    function updateReputation(address agent, bool agreed, uint256 earnings) external;

    function requestWithdrawal(address agent) external;

    function completeWithdrawal(address agent) external;

    function slash(address agent, uint256 amount, address recipient) external;

    function setAppealLayer(address newAppealLayer) external;

    function getAgent(address agent) external view returns (Agent memory);

    function getBond(address agent) external view returns (uint256);

    function getReputation(address agent) external view returns (Reputation memory);

    function handlesTypeTag(address agent, bytes32 tag) external view returns (bool);

    function getAgentsForTypeTag(bytes32 tag, uint256 offset, uint256 limit) external view returns (address[] memory);

    function totalAgents() external view returns (uint256);

    function isActive(address agent) external view returns (bool);
}

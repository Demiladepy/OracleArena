// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IResolverRegistry
/// @notice Agent registration, bonding, specialization tags, and reputation ledger
interface IResolverRegistry {
    /// @notice Emitted when a resolver agent registers
    event AgentRegistered(address indexed agent, bytes32[] typeTags, uint256 bondAmount);

    /// @notice Emitted when reputation is updated after a settled bounty
    event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore);

    /// @notice Emitted when a bond is slashed (Phase 2: via AppealLayer)
    event BondSlashed(address indexed agent, uint256 amount, address indexed recipient);

    error AgentAlreadyRegistered();
    error AgentNotRegistered();
    error InsufficientBond();
    error OnlyAppealLayer();
    error AppealLayerNotConfigured();

    /// @notice Register a resolver agent with bond and handled type tags
    /// @param agent ResolverAgent contract address
    /// @param typeTags Bounty type tags this agent handles (reactive filter)
    /// @return success Whether registration succeeded
    function registerAgent(address agent, bytes32[] calldata typeTags) external payable returns (bool success);

    /// @notice Slash a resolver bond (callable only by AppealLayer when configured)
    /// @param agent Agent to slash
    /// @param amount Amount to slash from bond
    /// @param recipient Address receiving slashed funds
    function slash(address agent, uint256 amount, address recipient) external;

    /// @notice Update agent reputation after settlement
    /// @param agent Agent address
    /// @param delta Reputation change (positive or negative)
    function updateReputation(address agent, int256 delta) external;

    /// @notice Get locked bond for an agent
    /// @param agent Agent address
    /// @return bond Locked bond amount in STT
    function getBond(address agent) external view returns (uint256 bond);

    /// @notice Get reputation score for an agent
    /// @param agent Agent address
    /// @return score Current reputation score
    function getReputation(address agent) external view returns (uint256 score);

    /// @notice Check whether an agent handles a given type tag
    /// @param agent Agent address
    /// @param typeTag Bounty type tag
    /// @return handles True if agent subscribed to this tag
    function handlesTypeTag(address agent, bytes32 typeTag) external view returns (bool handles);

    /// @notice Minimum bond required for registration (MVP: 50 STT)
    function minimumBond() external view returns (uint256);

    /// @notice Set AppealLayer address (Phase 2 wiring)
    /// @param appealLayer AppealLayer contract address
    function setAppealLayer(address appealLayer) external;

    // TODO: confirm whether deregisterAgent belongs in this interface (Phase 2 open registration)
}

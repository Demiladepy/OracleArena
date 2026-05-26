// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Source: https://docs.somnia.network/agents/invoking-agents/from-solidity.md
//         https://docs.somnia.network/agents/base-agents/llm-inference.md
// Copied: 2026-05-25
//
// NOTE: https://github.com/SomniaDevs/somnia-agents-examples returned 404 at copy time.
// This file follows the official Somnia documentation, not a community fork.
//
// This is an upstream interface. Do not modify locally. If upstream changes, update by
// re-copying from source, do not patch by hand.

enum ConsensusType {
    Majority,
    Threshold
}

enum ResponseStatus {
    None,
    Pending,
    Success,
    Failed,
    TimedOut
}

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
    uint256 perAgentBudget;
}

/// @title IAgentRequester
/// @notice Somnia Agents platform interface (AgentRequester / SomniaAgents)
interface IAgentRequester {
    event RequestCreated(
        uint256 indexed requestId,
        uint256 indexed agentId,
        uint256 perAgentBudget,
        bytes payload,
        address[] subcommittee
    );
    event RequestFinalized(uint256 indexed requestId, ResponseStatus status);
    event SubcommitteePaid(uint256 indexed requestId, uint256 totalPaid, uint256 perMember);
    event CommitteeDepositFailed(uint256 indexed requestId, uint256 attemptedAmount);

    function createRequest(uint256 agentId, address callbackAddress, bytes4 callbackSelector, bytes calldata payload)
        external
        payable
        returns (uint256 requestId);

    function createAdvancedRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload,
        uint256 subcommitteeSize,
        uint256 threshold,
        ConsensusType consensusType,
        uint256 timeout
    ) external payable returns (uint256 requestId);

    function getRequest(uint256 requestId) external view returns (Request memory);

    function hasRequest(uint256 requestId) external view returns (bool);

    function getRequestDeposit() external view returns (uint256);

    function getAdvancedRequestDeposit(uint256 subcommitteeSize) external view returns (uint256);
}

/// @title IAgentRequesterHandler
/// @notice Callback interface invoked by the platform on consensus
interface IAgentRequesterHandler {
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory details
    ) external;
}

/// @title ILLMAgent
/// @notice LLM Inference agent method signatures (agent ID 12847293847561029384 on testnet)
/// @dev inferToolsChat documented at https://docs.somnia.network/agents/base-agents/llm-inference.md
interface ILLMAgent {
    struct OnchainTool {
        string signature;
        string description;
    }

    function inferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external returns (string memory response);

    function inferNumber(
        string calldata prompt,
        string calldata system,
        int256 minValue,
        int256 maxValue,
        bool chainOfThought
    ) external returns (int256 response);

    function inferChat(string[] calldata roles, string[] calldata messages, bool chainOfThought)
        external
        returns (string memory response);

    function inferToolsChat(
        string[] calldata roles,
        string[] calldata messages,
        string[] calldata mcpServerUrls,
        OnchainTool[] calldata onchainTools,
        uint256 maxIterations,
        bool chainOfThought
    )
        external
        returns (
            string memory finishReason,
            string memory response,
            string[] memory updatedRoles,
            string[] memory updatedMessages,
            string[] memory pendingToolCallIds,
            bytes[] memory pendingToolCalls
        );
}

/// @title IJsonApiAgent
/// @notice JSON API Request agent method signatures
interface IJsonApiAgent {
    function fetchString(string calldata url, string calldata selector) external returns (string memory);

    function fetchUint(string calldata url, string calldata selector, uint8 decimals) external returns (uint256);

    function fetchInt(string calldata url, string calldata selector, uint8 decimals) external returns (int256);

    function fetchBool(string calldata url, string calldata selector) external returns (bool);

    function fetchStringArray(string calldata url, string calldata selector) external returns (string[] memory);

    function fetchUintArray(string calldata url, string calldata selector, uint8 decimals)
        external
        returns (uint256[] memory);
}

/// @title IParseWebsiteAgent
/// @notice LLM Parse Website agent method signatures
interface IParseWebsiteAgent {
    function ExtractString(
        string calldata key,
        string calldata description,
        string[] calldata options,
        string calldata prompt,
        string calldata url,
        bool resolveUrl,
        uint8 numPages
    ) external returns (string memory);

    function ExtractANumber(
        string calldata key,
        string calldata description,
        uint256 min,
        uint256 max,
        string calldata prompt,
        string calldata url,
        bool resolveUrl,
        uint8 numPages
    ) external returns (uint256);
}

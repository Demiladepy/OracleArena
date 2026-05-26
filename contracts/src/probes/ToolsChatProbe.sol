// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    IAgentRequester,
    IAgentRequesterHandler,
    Request,
    Response,
    ResponseStatus
} from "../interfaces/IAgentRequester.sol";
import {ILLMAgent} from "../interfaces/IAgentRequester.sol";

/// @title ToolsChatProbe
/// @notice Minimal probe contract to observe raw inferToolsChat callback bytes on Somnia testnet
/// @dev See docs/findings/inferToolsChat.md for verified behavior
contract ToolsChatProbe is IAgentRequesterHandler {
    IAgentRequester public immutable platform;

    uint256 public constant LLM_INFERENCE_AGENT_ID = 12847293847561029384;
    uint256 public constant LLM_INFERENCE_PRICE_PER_VALIDATOR = 0.07 ether;
    uint256 public constant DEFAULT_SUBCOMMITTEE_SIZE = 3;
    uint256 public constant DEPOSIT_BUFFER_BPS = 1200; // 20% buffer

    address public owner;
    uint256 public lastNumber;

    uint256 public lastRequestId;
    ResponseStatus public lastStatus;
    bytes public lastRawResponse;
    uint256 public lastResponseCount;
    bool public callbackReceived;

    mapping(uint256 => bool) public pendingRequests;

    event ProbeRequested(uint256 indexed requestId, uint256 deposit);
    event ProbeResponse(uint256 indexed requestId, ResponseStatus status, bytes rawResult);
    event ProbeNumberSet(uint256 indexed requestId, uint256 value);

    error OnlyOwner();
    error OnlyPlatform();
    error UnknownRequest();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address platformAddress) {
        platform = IAgentRequester(platformAddress);
        owner = msg.sender;
    }

    /// @notice Fake on-chain tool offered to inferToolsChat — selector matches setNumber(uint256)
    function setNumber(uint256 value) external {
        lastNumber = value;
        emit ProbeNumberSet(lastRequestId, value);
    }

    /// @notice Send a single inferToolsChat request and store the async callback payload
    /// @param systemPrompt System message for the LLM
    /// @param userMessage User message for the LLM
    function probe(string calldata systemPrompt, string calldata userMessage)
        external
        payable
        onlyOwner
        returns (uint256 requestId)
    {
        string[] memory roles = new string[](2);
        roles[0] = "system";
        roles[1] = "user";

        string[] memory messages = new string[](2);
        messages[0] = systemPrompt;
        messages[1] = userMessage;

        string[] memory mcpServerUrls = new string[](0);

        ILLMAgent.OnchainTool[] memory onchainTools = new ILLMAgent.OnchainTool[](1);
        onchainTools[0] = ILLMAgent.OnchainTool({
            signature: "setNumber(uint256)",
            description: "Set the probe contract's stored number to the given integer value"
        });

        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferToolsChat.selector, roles, messages, mcpServerUrls, onchainTools, uint256(5), false
        );

        uint256 floor = platform.getRequestDeposit();
        uint256 reward = LLM_INFERENCE_PRICE_PER_VALIDATOR * DEFAULT_SUBCOMMITTEE_SIZE;
        uint256 deposit = ((floor + reward) * DEPOSIT_BUFFER_BPS) / 1000;

        if (msg.value < deposit) revert TransferFailed();

        requestId = platform.createRequest{value: deposit}(
            LLM_INFERENCE_AGENT_ID, address(this), this.handleResponse.selector, payload
        );

        lastRequestId = requestId;
        pendingRequests[requestId] = true;
        callbackReceived = false;

        emit ProbeRequested(requestId, deposit);

        if (msg.value > deposit) {
            (bool ok,) = payable(msg.sender).call{value: msg.value - deposit}("");
            if (!ok) revert TransferFailed();
        }
    }

    /// @inheritdoc IAgentRequesterHandler
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory /* details */
    )
        external
    {
        if (msg.sender != address(platform)) revert OnlyPlatform();
        if (!pendingRequests[requestId]) revert UnknownRequest();

        delete pendingRequests[requestId];

        lastRequestId = requestId;
        lastStatus = status;
        lastResponseCount = responses.length;
        callbackReceived = true;

        if (responses.length > 0) {
            lastRawResponse = responses[0].result;
        } else {
            lastRawResponse = bytes("");
        }

        emit ProbeResponse(requestId, status, lastRawResponse);
    }

    /// @notice Required deposit for one probe call (floor + reward + 20% buffer)
    function requiredProbeDeposit() external view returns (uint256) {
        uint256 floor = platform.getRequestDeposit();
        uint256 reward = LLM_INFERENCE_PRICE_PER_VALIDATOR * DEFAULT_SUBCOMMITTEE_SIZE;
        return ((floor + reward) * DEPOSIT_BUFFER_BPS) / 1000;
    }

    receive() external payable {}
}

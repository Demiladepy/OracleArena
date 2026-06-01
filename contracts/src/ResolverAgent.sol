// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    IAgentRequester,
    IAgentRequesterHandler,
    ILLMAgent,
    Request,
    Response,
    ResponseStatus
} from "./interfaces/IAgentRequester.sol";
import {IBountyBoard} from "./interfaces/IBountyBoard.sol";
import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";
import {ConsensusEngine} from "./ConsensusEngine.sol";

/// @title ResolverAgent
/// @notice Autonomous resolver: inferToolsChat evaluation + verdict submission
/// @dev Verified inferToolsChat decode via probe 0x8bd481… on platform 0x037Bb9… (tx 0x34b5bdc5…)
contract ResolverAgent is IAgentRequesterHandler {
    uint256 public constant TOOL_SUBMIT_VERDICT = 1;
    uint256 public constant LLM_INFERENCE_AGENT_ID = 12847293847561029384;
    uint256 public constant LLM_PRICE_PER_VALIDATOR = 0.07 ether;
    uint256 public constant DEFAULT_SUBCOMMITTEE_SIZE = 3;
    uint256 public constant DEPOSIT_BUFFER_BPS = 1300; // 30% margin for Somnia gas variance
    uint256 public constant MAX_ITERATIONS = 5;

    IAgentRequester public immutable platform;
    IBountyBoard public immutable bountyBoard;
    IResolverRegistry public immutable registry;
    ConsensusEngine public immutable consensusEngine;
    address public immutable operator;

    string public systemPrompt;
    bytes32[] internal _supportedTypes;

    mapping(uint256 => uint256) public pendingRequests;
    uint256 public earnings;

    event BountyEvaluationStarted(uint256 indexed requestId, uint256 indexed bountyId, uint64 timestamp);
    event VerdictSubmitted(
        uint256 indexed requestId, uint256 indexed bountyId, bytes32 verdictHash, uint16 confidence, string evidenceUri
    );
    event InferToolsChatPending(
        uint256 indexed requestId, string finishReason, string[] pendingToolCallIds, bytes[] pendingToolCalls
    );
    event AgentResponseFailed(uint256 indexed requestId, uint256 indexed bountyId, uint8 status);
    event DecodeFailed(uint256 indexed requestId, uint256 indexed bountyId);
    event SystemPromptUpdated(string newPrompt);
    event EarningsWithdrawn(address indexed operator, uint256 amount);
    event AgentFunded(address indexed funder, uint256 amount);

    error NotOperator(address caller, address expected);
    error NotPlatform(address caller, address expected);
    error UnknownRequest(uint256 requestId);
    error UnsupportedBountyType(bytes32 bountyType);
    error BountyNotOpen(uint256 bountyId, uint8 status);
    error DeadlinePassed(uint256 bountyId, uint64 deadline);
    error InsufficientBalance(uint256 needed, uint256 available);
    error InvalidToolId(uint256 toolId);
    error TransferFailed(address recipient, uint256 amount);

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator(msg.sender, operator);
        _;
    }

    constructor(
        address platform_,
        address bountyBoard_,
        address registry_,
        address consensusEngine_,
        address operator_,
        string memory systemPrompt_,
        bytes32[] memory supportedTypes_
    ) payable {
        if (
            platform_ == address(0) || bountyBoard_ == address(0) || registry_ == address(0) || consensusEngine_ == address(0)
                || operator_ == address(0)
        ) {
            revert TransferFailed(address(0), 0);
        }
        if (supportedTypes_.length == 0) revert UnsupportedBountyType(bytes32(0));

        platform = IAgentRequester(platform_);
        bountyBoard = IBountyBoard(bountyBoard_);
        registry = IResolverRegistry(registry_);
        consensusEngine = ConsensusEngine(consensusEngine_);
        operator = operator_;
        systemPrompt = systemPrompt_;

        for (uint256 i = 0; i < supportedTypes_.length; i++) {
            _supportedTypes.push(supportedTypes_[i]);
        }
    }

    receive() external payable {}

    function fund() external payable {
        emit AgentFunded(msg.sender, msg.value);
    }

    function setSystemPrompt(string calldata newPrompt) external onlyOperator {
        systemPrompt = newPrompt;
        emit SystemPromptUpdated(newPrompt);
    }

    function evaluateBounty(uint256 bountyId) external returns (uint256 requestId) {
        IBountyBoard.Bounty memory bounty = bountyBoard.getBounty(bountyId);
        if (bounty.id == 0 && bounty.poster == address(0)) {
            revert BountyNotOpen(bountyId, 0);
        }
        if (!_supportsType(bounty.bountyType)) {
            revert UnsupportedBountyType(bounty.bountyType);
        }
        if (bounty.status != IBountyBoard.BountyStatus.Open && bounty.status != IBountyBoard.BountyStatus.Submitted) {
            revert BountyNotOpen(bountyId, uint8(bounty.status));
        }
        if (block.timestamp > bounty.deadline) {
            revert DeadlinePassed(bountyId, bounty.deadline);
        }

        string memory userMessage = _buildUserMessage(bounty);
        uint256 deposit = _requiredDeposit();
        if (address(this).balance < deposit) {
            revert InsufficientBalance(deposit, address(this).balance);
        }

        bytes memory payload = _buildInferToolsChatPayload(userMessage);

        requestId = platform.createRequest{value: deposit}(
            LLM_INFERENCE_AGENT_ID, address(this), this.handleResponse.selector, payload
        );

        pendingRequests[requestId] = bountyId;
        emit BountyEvaluationStarted(requestId, bountyId, uint64(block.timestamp));
    }

    /// @inheritdoc IAgentRequesterHandler
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory /* details */
    ) external {
        if (msg.sender != address(platform)) revert NotPlatform(msg.sender, address(platform));

        uint256 bountyId = pendingRequests[requestId];
        if (bountyId == 0) revert UnknownRequest(requestId);

        if (status != ResponseStatus.Success) {
            emit AgentResponseFailed(requestId, bountyId, uint8(status));
            delete pendingRequests[requestId];
            return;
        }

        if (responses.length == 0) {
            emit DecodeFailed(requestId, bountyId);
            delete pendingRequests[requestId];
            return;
        }

        try this.decodeAndSubmit(requestId, bountyId, responses[0].result) {
            delete pendingRequests[requestId];
        } catch {
            emit DecodeFailed(requestId, bountyId);
            delete pendingRequests[requestId];
        }
    }

    /// @notice On-chain tool offered to inferToolsChat — executed when LLM selects submitVerdict
    function submitVerdict(bytes32 verdictHash, uint16 confidence, string calldata evidenceUri) external {
        if (msg.sender != address(this) && msg.sender != address(platform)) {
            revert NotPlatform(msg.sender, address(platform));
        }
        _submitVerdictFromTool(verdictHash, confidence, evidenceUri);
    }

    function _submitVerdictFromTool(bytes32 verdictHash, uint16 confidence, string memory evidenceUri) internal {
        uint256 requestId = _activeToolRequestId;
        if (requestId == 0) revert UnknownRequest(0);
        uint256 bountyId = pendingRequests[requestId];
        if (bountyId == 0) revert UnknownRequest(requestId);

        consensusEngine.submitVerdict(bountyId, verdictHash, confidence, evidenceUri);
        emit VerdictSubmitted(requestId, bountyId, verdictHash, confidence, evidenceUri);
        delete pendingRequests[requestId];
        _activeToolRequestId = 0;
    }

    uint256 internal _activeToolRequestId;

    /// @notice External helper so handleResponse can use try/catch around decode logic
    function decodeAndSubmit(uint256 requestId, uint256 bountyId, bytes memory rawResult) external {
        if (msg.sender != address(this)) revert NotPlatform(msg.sender, address(this));

        (
            string memory finishReason,
            string memory responseText,
            string[] memory updatedRoles,
            string[] memory updatedMessages,
            string[] memory pendingToolCallIds,
            bytes[] memory pendingToolCalls
        ) = _decodeInferToolsChat(rawResult);

        responseText;
        updatedRoles;
        updatedMessages;

        if (keccak256(bytes(finishReason)) == keccak256("tool_calls")) {
            emit InferToolsChatPending(requestId, finishReason, pendingToolCallIds, pendingToolCalls);
            _activeToolRequestId = requestId;
            _executePendingToolCalls(pendingToolCalls);
            return;
        }

        revert InvalidToolId(uint256(keccak256(bytes(finishReason))));
    }

    function withdrawEarnings(uint256 amount) external onlyOperator {
        if (amount > address(this).balance) revert InsufficientBalance(amount, address(this).balance);
        _transferNative(operator, amount);
        emit EarningsWithdrawn(operator, amount);
    }

    function getPendingRequest(uint256 requestId) external view returns (uint256 bountyId) {
        return pendingRequests[requestId];
    }

    function getEarnings() external view returns (uint256) {
        return earnings;
    }

    function getSupportedTypes() external view returns (bytes32[] memory) {
        return _supportedTypes;
    }

    function getSystemPrompt() external view returns (string memory) {
        return systemPrompt;
    }

    function creditEarnings(uint256 amount) external {
        if (msg.sender != operator) revert NotOperator(msg.sender, operator);
        earnings += amount;
    }

    /// @notice Verified shape from live probe — 6-tuple per Somnia LLM Inference docs
    function _decodeInferToolsChat(bytes memory rawResult)
        internal
        pure
        returns (
            string memory finishReason,
            string memory responseText,
            string[] memory updatedRoles,
            string[] memory updatedMessages,
            string[] memory pendingToolCallIds,
            bytes[] memory pendingToolCalls
        )
    {
        (finishReason, responseText, updatedRoles, updatedMessages, pendingToolCallIds, pendingToolCalls) =
            abi.decode(rawResult, (string, string, string[], string[], string[], bytes[]));
    }

    function _executePendingToolCalls(bytes[] memory pendingToolCalls) internal {
        if (pendingToolCalls.length == 0) return;

        bytes memory callData = pendingToolCalls[0];
        (bool ok,) = address(this).call(callData);
        if (ok) return;

        if (callData.length <= 4) return;

        (bytes32 verdictHash, uint16 confidence, string memory evidenceUri) =
            abi.decode(_sliceCalldataArgs(callData), (bytes32, uint16, string));

        _submitVerdictFromTool(verdictHash, confidence, evidenceUri);
    }

    function _sliceCalldataArgs(bytes memory callData) internal pure returns (bytes memory args) {
        args = new bytes(callData.length - 4);
        for (uint256 i = 4; i < callData.length; i++) {
            args[i - 4] = callData[i];
        }
    }

    function _supportsType(bytes32 tag) internal view returns (bool) {
        for (uint256 i = 0; i < _supportedTypes.length; i++) {
            if (_supportedTypes[i] == tag) return true;
        }
        return false;
    }

    function _requiredDeposit() internal view returns (uint256) {
        uint256 floor = platform.getRequestDeposit();
        uint256 reward = LLM_PRICE_PER_VALIDATOR * DEFAULT_SUBCOMMITTEE_SIZE;
        return ((floor + reward) * DEPOSIT_BUFFER_BPS) / 1000;
    }

    function _buildUserMessage(IBountyBoard.Bounty memory bounty) internal pure returns (string memory) {
        string memory sources = _joinSources(bounty.evidenceSources);
        return string.concat(
            "Evaluate this bounty and call submitVerdict with your conclusion.\n",
            "Claim: ",
            bounty.claim,
            "\nEvidence sources: ",
            sources,
            "\nDeadline (unix): ",
            _uintToString(bounty.deadline),
            "\nUse tool submitVerdict(bytes32 verdictHash, uint16 confidence, string evidenceUri)."
        );
    }

    function _joinSources(string[] memory sources) internal pure returns (string memory) {
        if (sources.length == 0) return "";
        string memory out = sources[0];
        for (uint256 i = 1; i < sources.length; i++) {
            out = string.concat(out, ", ", sources[i]);
        }
        return out;
    }

    function _buildInferToolsChatPayload(string memory userMessage) internal view returns (bytes memory) {
        string[] memory roles = new string[](2);
        roles[0] = "system";
        roles[1] = "user";

        string[] memory messages = new string[](2);
        messages[0] = systemPrompt;
        messages[1] = userMessage;

        string[] memory mcpServerUrls = new string[](0);

        ILLMAgent.OnchainTool[] memory onchainTools = new ILLMAgent.OnchainTool[](1);
        onchainTools[0] = ILLMAgent.OnchainTool({
            signature: "submitVerdict(bytes32,uint16,string)",
            description: "Submit a normalized verdict hash, confidence score, and evidence URI for the bounty"
        });

        return abi.encodeWithSelector(
            ILLMAgent.inferToolsChat.selector, roles, messages, mcpServerUrls, onchainTools, MAX_ITERATIONS, false
        );
    }

    function _transferNative(address to, uint256 amount) internal {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }

    function _uintToString(uint64 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

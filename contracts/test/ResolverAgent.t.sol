// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ResolverAgent} from "../src/ResolverAgent.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {MockBountyBoard} from "./mocks/MockBountyBoard.sol";
import {MockAgentPlatform} from "./mocks/MockAgentPlatform.sol";
import {MockConsensusEngine} from "./mocks/MockConsensusEngine.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";
import {Response, ResponseStatus, Request, ConsensusType} from "../src/interfaces/IAgentRequester.sol";

contract RevertingReceiver {
    receive() external payable {
        revert();
    }
}

contract ResolverAgentTest is Test {
    event BountyEvaluationStarted(uint256 indexed requestId, uint256 indexed bountyId, uint64 timestamp);
    event AgentResponseFailed(uint256 indexed requestId, uint256 indexed bountyId, uint8 status);
    event DecodeFailed(uint256 indexed requestId, uint256 indexed bountyId);
    event AgentFunded(address indexed funder, uint256 amount);
    event SystemPromptUpdated(string newPrompt);

    ResolverAgent internal agent;
    MockBountyBoard internal board;
    MockAgentPlatform internal platform;
    MockConsensusEngine internal consensusEngine;
    ResolverRegistry internal registry;

    address internal operator = makeAddr("operator");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant URL_RESOLVABLE_FACT = keccak256("URL_RESOLVABLE_FACT");
    bytes32 internal constant OTHER_TAG = keccak256("OTHER_TAG");

    uint256 internal constant BOUNTY_ID = 1;
    uint256 internal constant DEPOSIT = ((0.03 ether + 0.07 ether * 3) * 1300) / 1000;

    function setUp() public {
        board = new MockBountyBoard();
        platform = new MockAgentPlatform();
        consensusEngine = new MockConsensusEngine(address(board));
        registry = new ResolverRegistry(operator, operator, 50 ether);

        bytes32[] memory types = new bytes32[](1);
        types[0] = URL_RESOLVABLE_FACT;

        vm.deal(operator, 10 ether);
        vm.prank(operator);
        agent = new ResolverAgent{value: 5 ether}(
            address(platform),
            address(board),
            address(registry),
            address(consensusEngine),
            operator,
            "You are a URL-resolvable fact checker.",
            types
        );
    }

    function _openBounty() internal {
        string[] memory sources = new string[](1);
        sources[0] = "https://example.com/evidence";

        board.setBounty(
            BOUNTY_ID,
            IBountyBoard.Bounty({
                id: BOUNTY_ID,
                poster: makeAddr("poster"),
                claim: "Did Team A beat Team B?",
                evidenceSources: sources,
                bountyType: URL_RESOLVABLE_FACT,
                deadline: uint64(block.timestamp + 1 days),
                payout: 0.2 ether,
                status: IBountyBoard.BountyStatus.Open,
                createdAt: uint64(block.timestamp),
                resolvedAt: 0,
                winningVerdictHash: bytes32(0)
            })
        );
    }

    function _mockSuccessResponse(bytes32 verdictHash, uint16 confidence, string memory evidenceUri)
        internal
        pure
        returns (bytes memory)
    {
        bytes[] memory pendingToolCalls = new bytes[](1);
        pendingToolCalls[0] = abi.encodeWithSignature("submitVerdict(bytes32,uint16,string)", verdictHash, confidence, evidenceUri);

        string[] memory roles = new string[](0);
        string[] memory messages = new string[](0);
        string[] memory ids = new string[](1);
        ids[0] = "call_0";

        return abi.encode("tool_calls", "", roles, messages, ids, pendingToolCalls);
    }

    function test_evaluateBounty_storesPendingAndEmits() public {
        _openBounty();
        vm.expectEmit(true, true, false, true);
        emit BountyEvaluationStarted(1, BOUNTY_ID, uint64(block.timestamp));
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);
        assertEq(agent.getPendingRequest(requestId), BOUNTY_ID);
    }

    function test_handleResponse_successSubmitsVerdict() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        bytes32 verdictHash = keccak256("YES");
        bytes memory raw = _mockSuccessResponse(verdictHash, 9000, "ipfs://evidence");

        Response[] memory responses = new Response[](1);
        responses[0] = Response({
            validator: makeAddr("validator"),
            result: raw,
            status: ResponseStatus.Success,
            receipt: 0,
            timestamp: block.timestamp,
            executionCost: 0
        });

        vm.prank(address(platform));
        agent.handleResponse(requestId, responses, ResponseStatus.Success, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: agent.handleResponse.selector,
            subcommittee: new address[](0),
            responses: responses,
            responseCount: 1,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));

        assertEq(agent.getPendingRequest(requestId), 0);
        MockConsensusEngine.VerdictCall memory verdict = consensusEngine.getLastVerdict();
        assertEq(verdict.verdictHash, verdictHash);
        assertEq(verdict.confidence, 9000);
        IBountyBoard.Submission memory sub = board.getSubmission(BOUNTY_ID, address(agent));
        assertEq(sub.verdictHash, verdictHash);
        assertEq(sub.confidence, 9000);
    }

    function test_handleResponse_failedStatus() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        vm.expectEmit(true, true, false, true);
        emit AgentResponseFailed(requestId, BOUNTY_ID, uint8(ResponseStatus.Failed));
        vm.prank(address(platform));
        agent.handleResponse(requestId, new Response[](0), ResponseStatus.Failed, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: new Response[](0),
            responseCount: 0,
            failureCount: 1,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Failed,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_handleResponse_timedOut() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        vm.prank(address(platform));
        agent.handleResponse(requestId, new Response[](0), ResponseStatus.TimedOut, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: new Response[](0),
            responseCount: 0,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.TimedOut,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
        assertEq(agent.getPendingRequest(requestId), 0);
    }

    function test_handleResponse_decodeFailure() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        Response[] memory responses = new Response[](1);
        responses[0].result = hex"deadbeef";

        vm.expectEmit(true, true, false, false);
        emit DecodeFailed(requestId, BOUNTY_ID);
        vm.prank(address(platform));
        agent.handleResponse(requestId, responses, ResponseStatus.Success, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: responses,
            responseCount: 1,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_evaluateBounty_revertsUnsupportedType() public {
        string[] memory sources = new string[](1);
        sources[0] = "https://example.com";
        board.setBounty(
            BOUNTY_ID,
            IBountyBoard.Bounty({
                id: BOUNTY_ID,
                poster: makeAddr("poster"),
                claim: "claim",
                evidenceSources: sources,
                bountyType: OTHER_TAG,
                deadline: uint64(block.timestamp + 1 days),
                payout: 0.2 ether,
                status: IBountyBoard.BountyStatus.Open,
                createdAt: uint64(block.timestamp),
                resolvedAt: 0,
                winningVerdictHash: bytes32(0)
            })
        );

        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.UnsupportedBountyType.selector, OTHER_TAG));
        agent.evaluateBounty(BOUNTY_ID);
    }

    function test_evaluateBounty_revertsClosedBounty() public {
        _openBounty();
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        bounty.status = IBountyBoard.BountyStatus.Resolved;
        board.setBounty(BOUNTY_ID, bounty);

        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.BountyNotOpen.selector, BOUNTY_ID, uint8(2)));
        agent.evaluateBounty(BOUNTY_ID);
    }

    function test_evaluateBounty_revertsDeadlinePassed() public {
        _openBounty();
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        bounty.deadline = uint64(block.timestamp - 1);
        board.setBounty(BOUNTY_ID, bounty);

        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.DeadlinePassed.selector, BOUNTY_ID, bounty.deadline));
        agent.evaluateBounty(BOUNTY_ID);
    }

    function test_evaluateBounty_revertsInsufficientBalance() public {
        _openBounty();
        ResolverAgent poor = _deployAgent(0);
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.InsufficientBalance.selector, DEPOSIT, 0));
        poor.evaluateBounty(BOUNTY_ID);
    }

    function test_handleResponse_revertsNotPlatform() public {
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.NotPlatform.selector, stranger, address(platform)));
        vm.prank(stranger);
        agent.handleResponse(1, new Response[](0), ResponseStatus.Success, Request({
            id: 1,
            requester: address(0),
            callbackAddress: address(0),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: new Response[](0),
            responseCount: 0,
            failureCount: 0,
            threshold: 0,
            createdAt: 0,
            deadline: 0,
            status: ResponseStatus.None,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_handleResponse_revertsUnknownRequest() public {
        vm.prank(address(platform));
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.UnknownRequest.selector, 999));
        agent.handleResponse(999, new Response[](0), ResponseStatus.Success, Request({
            id: 999,
            requester: address(0),
            callbackAddress: address(0),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: new Response[](0),
            responseCount: 0,
            failureCount: 0,
            threshold: 0,
            createdAt: 0,
            deadline: 0,
            status: ResponseStatus.None,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_setSystemPrompt_onlyOperator() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.NotOperator.selector, stranger, operator));
        agent.setSystemPrompt("nope");

        vm.prank(operator);
        agent.setSystemPrompt("updated");
        assertEq(agent.getSystemPrompt(), "updated");
    }

    function test_withdrawEarnings_onlyOperator() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.NotOperator.selector, stranger, operator));
        agent.withdrawEarnings(1 ether);

        uint256 before = operator.balance;
        vm.prank(operator);
        agent.withdrawEarnings(1 ether);
        assertEq(operator.balance, before + 1 ether);
    }

    function test_withdrawEarnings_revertsOverBalance() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.InsufficientBalance.selector, 100 ether, address(agent).balance));
        agent.withdrawEarnings(100 ether);
    }

    function test_decodeFailureDoesNotBrickNextEvaluation() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        Response[] memory responses = new Response[](1);
        responses[0].result = hex"deadbeef";
        vm.prank(address(platform));
        agent.handleResponse(requestId, responses, ResponseStatus.Success, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: responses,
            responseCount: 1,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));

        vm.deal(address(agent), DEPOSIT);
        uint256 requestId2 = agent.evaluateBounty(BOUNTY_ID);
        assertEq(agent.getPendingRequest(requestId2), BOUNTY_ID);
    }

    function test_fund_emitsEvent() public {
        vm.deal(stranger, 1 ether);
        vm.expectEmit(true, false, false, true);
        emit AgentFunded(stranger, 1 ether);
        vm.prank(stranger);
        agent.fund{value: 1 ether}();
    }

    function test_constructor_revertsZeroAddress() public {
        bytes32[] memory types = new bytes32[](1);
        types[0] = URL_RESOLVABLE_FACT;
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.TransferFailed.selector, address(0), 0));
        new ResolverAgent{value: 0}(
            address(0), address(board), address(registry), address(consensusEngine), operator, "p", types
        );
    }

    function test_constructor_revertsEmptyTypes() public {
        bytes32[] memory types = new bytes32[](0);
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.UnsupportedBountyType.selector, bytes32(0)));
        new ResolverAgent{value: 0}(
            address(platform), address(board), address(registry), address(consensusEngine), operator, "p", types
        );
    }

    function test_evaluateBounty_revertsNonexistentBounty() public {
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.BountyNotOpen.selector, 999, uint8(0)));
        agent.evaluateBounty(999);
    }

    function test_evaluateBounty_acceptsSubmittedStatus() public {
        _openBounty();
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        bounty.status = IBountyBoard.BountyStatus.Submitted;
        board.setBounty(BOUNTY_ID, bounty);
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);
        assertEq(agent.getPendingRequest(requestId), BOUNTY_ID);
    }

    function test_handleResponse_emptyResponses() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        vm.expectEmit(true, true, false, false);
        emit DecodeFailed(requestId, BOUNTY_ID);
        vm.prank(address(platform));
        agent.handleResponse(requestId, new Response[](0), ResponseStatus.Success, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: new Response[](0),
            responseCount: 0,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_handleResponse_invalidFinishReason() public {
        _openBounty();
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);

        string[] memory empty = new string[](0);
        bytes memory raw = abi.encode("stop", "final answer", empty, empty, empty, empty);
        Response[] memory responses = new Response[](1);
        responses[0].result = raw;

        vm.expectEmit(true, true, false, false);
        emit DecodeFailed(requestId, BOUNTY_ID);
        vm.prank(address(platform));
        agent.handleResponse(requestId, responses, ResponseStatus.Success, Request({
            id: requestId,
            requester: address(agent),
            callbackAddress: address(agent),
            callbackSelector: bytes4(0),
            subcommittee: new address[](0),
            responses: responses,
            responseCount: 1,
            failureCount: 0,
            threshold: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + 1 hours,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: 0,
            perAgentBudget: 0
        }));
    }

    function test_decodeAndSubmit_revertsNotSelf() public {
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.NotPlatform.selector, stranger, address(agent)));
        vm.prank(stranger);
        agent.decodeAndSubmit(1, BOUNTY_ID, hex"");
    }

    function test_creditEarnings_and_getEarnings() public {
        vm.prank(operator);
        agent.creditEarnings(0.5 ether);
        assertEq(agent.getEarnings(), 0.5 ether);
    }

    function test_setSystemPrompt_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit SystemPromptUpdated("updated prompt");
        vm.prank(operator);
        agent.setSystemPrompt("updated prompt");
    }

    function test_receive_acceptsNative() public {
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        (bool ok,) = address(agent).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(address(agent).balance, 6 ether);
    }

    function test_getSupportedTypes() public view {
        bytes32[] memory types = agent.getSupportedTypes();
        assertEq(types.length, 1);
        assertEq(types[0], URL_RESOLVABLE_FACT);
    }

    function test_evaluateBounty_joinsMultipleSources() public {
        string[] memory sources = new string[](2);
        sources[0] = "https://a.example";
        sources[1] = "https://b.example";
        board.setBounty(
            BOUNTY_ID,
            IBountyBoard.Bounty({
                id: BOUNTY_ID,
                poster: makeAddr("poster"),
                claim: "multi-source claim",
                evidenceSources: sources,
                bountyType: URL_RESOLVABLE_FACT,
                deadline: uint64(block.timestamp + 1 days),
                payout: 0.2 ether,
                status: IBountyBoard.BountyStatus.Open,
                createdAt: uint64(block.timestamp),
                resolvedAt: 0,
                winningVerdictHash: bytes32(0)
            })
        );
        uint256 requestId = agent.evaluateBounty(BOUNTY_ID);
        assertGt(requestId, 0);
    }

    function test_withdrawEarnings_revertsTransferFailed() public {
        RevertingReceiver receiver = new RevertingReceiver();
        bytes32[] memory types = new bytes32[](1);
        types[0] = URL_RESOLVABLE_FACT;
        vm.deal(operator, 2 ether);
        vm.prank(operator);
        ResolverAgent revertingAgent = new ResolverAgent{value: 1 ether}(
            address(platform),
            address(board),
            address(registry),
            address(consensusEngine),
            address(receiver),
            "p",
            types
        );
        vm.prank(address(receiver));
        vm.expectRevert(abi.encodeWithSelector(ResolverAgent.TransferFailed.selector, address(receiver), 1 ether));
        revertingAgent.withdrawEarnings(1 ether);
    }

    function _deployAgent(uint256 initialFunding) internal returns (ResolverAgent deployed) {
        bytes32[] memory types = new bytes32[](1);
        types[0] = URL_RESOLVABLE_FACT;
        vm.deal(operator, initialFunding);
        vm.prank(operator);
        deployed = new ResolverAgent{value: initialFunding}(
            address(platform),
            address(board),
            address(registry),
            address(consensusEngine),
            operator,
            "prompt",
            types
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";
import {Settlement} from "../src/Settlement.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {MockBountyBoard} from "./mocks/MockBountyBoard.sol";
import {MockResolverRegistry} from "./mocks/MockResolverRegistry.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";
import {IResolverPayoutPrefs} from "../src/interfaces/IResolverPayoutPrefs.sol";

contract ConsensusEngineTest is Test {
    ConsensusEngine internal engine;
    MockBountyBoard internal board;
    MockResolverRegistry internal reg;
    Settlement internal settlement;
    ResolverPayoutPrefs internal prefs;
    LiFiAdapter internal adapter;
    MockLiFiRouter internal router;

    address internal registryOwner = makeAddr("registryOwner");
    address internal resolverA = makeAddr("resolverA");
    address internal resolverB = makeAddr("resolverB");
    address internal resolverC = makeAddr("resolverC");
    address internal operatorA = makeAddr("operatorA");
    address internal inactive = makeAddr("inactive");

    bytes32 internal constant URL_TAG = keccak256("URL_RESOLVABLE_FACT");
    bytes32 internal constant VERDICT_YES = keccak256("YES");
    bytes32 internal constant VERDICT_NO = keccak256("NO");

    uint256 internal constant BOUNTY_ID = 1;
    uint256 internal constant PAYOUT = 0.2 ether;

    function setUp() public {
        uint256 nonce = vm.getNonce(address(this));
        address predictedEngine = vm.computeCreateAddress(address(this), nonce + 6);

        board = new MockBountyBoard();
        reg = new MockResolverRegistry();
        router = new MockLiFiRouter();
        adapter = new LiFiAdapter(address(router));
        prefs = new ResolverPayoutPrefs(address(reg));
        settlement = new Settlement(address(board), predictedEngine, address(prefs), address(adapter));
        engine = new ConsensusEngine(address(board), address(reg), address(settlement), address(prefs), registryOwner);

        require(address(engine) == predictedEngine, "engine prediction mismatch");
        board.setConsensusEngine(address(engine));

        _registerResolver(resolverA);
        _registerResolver(resolverB);
        _registerResolver(resolverC);
        reg.setAgent(inactive, makeAddr("inactiveOp"), false);

        _openBounty(BOUNTY_ID, PAYOUT, uint64(block.timestamp + 1 days));
    }

    function _registerResolver(address resolver) internal {
        reg.setAgent(resolver, true, URL_TAG, true);
    }

    function _openBounty(uint256 bountyId, uint256 payout, uint64 deadline) internal {
        string[] memory sources = new string[](1);
        sources[0] = "https://example.com";
        board.setBounty(
            bountyId,
            IBountyBoard.Bounty({
                id: bountyId,
                poster: makeAddr("poster"),
                claim: "claim",
                evidenceSources: sources,
                bountyType: URL_TAG,
                deadline: deadline,
                payout: payout,
                status: IBountyBoard.BountyStatus.Open,
                createdAt: uint64(block.timestamp),
                resolvedAt: 0,
                winningVerdictHash: bytes32(0)
            })
        );
    }

    function _distributable(uint256 payout) internal pure returns (uint256) {
        return payout - (payout * 200) / 10_000;
    }

    function test_matchingVerdicts_settlesWith6040Split() public {
        bytes32 hash = VERDICT_YES;
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, hash, 9000, "ipfs://a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, hash, 8500, "ipfs://b");

        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Agreed));
        assertEq(engine.getSubmissionCount(BOUNTY_ID), 2);

        uint256 distributable = _distributable(PAYOUT);
        uint256 expectedFirst = (distributable * 6000) / 10_000;
        uint256 expectedSecond = distributable - expectedFirst;

        assertEq(board.lastSettleBountyId(), BOUNTY_ID);
        assertEq(board.lastSettleWinningHash(), hash);
        assertEq(board.lastSettleWinners(0), resolverA);
        assertEq(board.lastSettleWinners(1), resolverB);
        assertEq(board.lastSettleShares(0), expectedFirst);
        assertEq(board.lastSettleShares(1), expectedSecond);
        assertEq(board.lastSettleShares(0) + board.lastSettleShares(1), distributable);

        assertEq(reg.reputationUpdateAgent(0), resolverA);
        assertTrue(reg.reputationUpdateAgreed(0));
        assertEq(reg.reputationUpdateEarnings(0), expectedFirst);
        assertEq(reg.reputationUpdateAgent(1), resolverB);
        assertTrue(reg.reputationUpdateAgreed(1));
        assertEq(reg.reputationUpdateEarnings(1), expectedSecond);
    }

    function test_crossChainWinner_routesToSettlementAndQueues() public {
        reg.setAgent(resolverA, operatorA, true);
        IResolverPayoutPrefs.PayoutPref memory pref = IResolverPayoutPrefs.PayoutPref({
            mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
            destinationChain: 8453,
            destinationAsset: address(0),
            destinationRecipient: operatorA
        });
        vm.prank(operatorA);
        prefs.setPreference(resolverA, pref);

        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 9000, "a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 8500, "b");

        assertEq(board.lastSettleWinners(0), address(settlement));
        assertEq(board.lastSettleWinners(1), resolverB);

        uint256 expectedFirst = (_distributable(PAYOUT) * 6000) / 10_000;
        assertEq(settlement.getPendingForward(BOUNTY_ID, resolverA), expectedFirst);
    }

    function test_mismatchingVerdicts_marksUnresolvedAndUpdatesReputation() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 9000, "a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_NO, 9000, "b");

        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Disagreed));
        assertEq(board.markUnresolvedCount(), 1);
        assertEq(board.lastMarkUnresolvedBountyId(), BOUNTY_ID);

        assertEq(reg.reputationUpdateAgent(0), resolverA);
        assertFalse(reg.reputationUpdateAgreed(0));
        assertEq(reg.reputationUpdateAgent(1), resolverB);
        assertFalse(reg.reputationUpdateAgreed(1));
    }

    function test_oddPayoutWeiLevelExactness() public {
        uint256 oddPayout = 0.123456789012345678 ether;
        _openBounty(2, oddPayout, uint64(block.timestamp + 1 days));

        vm.prank(resolverA);
        engine.submitVerdict(2, VERDICT_YES, 5000, "a");
        vm.prank(resolverB);
        engine.submitVerdict(2, VERDICT_YES, 5000, "b");

        uint256 distributable = _distributable(oddPayout);
        assertEq(board.lastSettleShares(0) + board.lastSettleShares(1), distributable);
    }

    function test_sameBlockSubmissionOrder_firstGets60Percent() public {
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 10000, "b");
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 10000, "a");

        uint256 distributable = _distributable(PAYOUT);
        uint256 firstShare = (distributable * 6000) / 10_000;
        assertEq(board.lastSettleWinners(0), resolverB);
        assertEq(board.lastSettleShares(0), firstShare);
    }

    function test_confidenceBoundsAccepted() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 0, "a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 10_000, "b");
        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Agreed));
    }

    function test_markExpired_singleSubmission() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 9000, "a");

        vm.warp(block.timestamp + 2 days);
        engine.markExpired(BOUNTY_ID);

        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Unresolved));
        assertEq(board.markUnresolvedCount(), 1);
        assertEq(reg.reputationUpdateAgent(0), resolverA);
        assertFalse(reg.reputationUpdateAgreed(0));
    }

    function test_markExpired_zeroSubmissions() public {
        vm.warp(block.timestamp + 2 days);
        engine.markExpired(BOUNTY_ID);
        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Unresolved));
        assertEq(board.markUnresolvedCount(), 1);
        assertEq(reg.reputationUpdatesLength(), 0);
    }

    function test_viewFunctions() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "uri");

        assertTrue(engine.hasSubmitted(BOUNTY_ID, resolverA));
        assertFalse(engine.hasSubmitted(BOUNTY_ID, resolverB));
        assertEq(engine.getSubmissionCount(BOUNTY_ID), 1);

        ConsensusEngine.Submission[] memory subs = engine.getSubmissions(BOUNTY_ID);
        assertEq(subs.length, 1);
        assertEq(subs[0].resolver, resolverA);
        assertEq(subs[0].verdictHash, VERDICT_YES);
        assertEq(subs[0].confidence, 100);
        assertEq(subs[0].evidenceUri, "uri");
    }

    function test_submitVerdict_revertsInactive() public {
        vm.prank(inactive);
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.ResolverNotActive.selector, inactive));
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "x");
    }

    function test_submitVerdict_revertsWrongType() public {
        reg.setAgent(resolverC, true, URL_TAG, false);
        vm.prank(resolverC);
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.ResolverDoesNotHandleType.selector, resolverC, URL_TAG));
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "x");
    }

    function test_submitVerdict_revertsClosedBounty() public {
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        bounty.status = IBountyBoard.BountyStatus.Resolved;
        board.setBounty(BOUNTY_ID, bounty);

        vm.prank(resolverA);
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.BountyNotOpenOrSubmitted.selector, BOUNTY_ID, uint8(2)));
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "x");
    }

    function test_submitVerdict_revertsAfterDeadline() public {
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        vm.warp(bounty.deadline + 1);
        vm.prank(resolverA);
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.DeadlinePassed.selector, BOUNTY_ID, bounty.deadline));
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "x");
    }

    function test_submitVerdict_revertsDuplicate() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "x");
        vm.prank(resolverA);
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.AlreadySubmitted.selector, BOUNTY_ID, resolverA));
        engine.submitVerdict(BOUNTY_ID, VERDICT_NO, 100, "x");
    }

    function test_submitVerdict_revertsTooMany() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "b");

        reg.setAgent(makeAddr("third"), true, URL_TAG, true);
        vm.prank(makeAddr("third"));
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.TooManySubmissions.selector, BOUNTY_ID, uint8(2)));
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "c");
    }

    function test_markExpired_revertsBeforeDeadline() public {
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.DeadlineNotPassed.selector, BOUNTY_ID, block.timestamp + 1 days));
        engine.markExpired(BOUNTY_ID);
    }

    function test_markExpired_revertsAfterConsensus() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "a");
        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "b");

        vm.warp(block.timestamp + 2 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                ConsensusEngine.ConsensusAlreadyFinalized.selector, BOUNTY_ID, uint8(ConsensusEngine.ConsensusStatus.Agreed)
            )
        );
        engine.markExpired(BOUNTY_ID);
    }

    function test_constructor_revertsZeroAddresses() public {
        vm.expectRevert(abi.encodeWithSelector(ConsensusEngine.ResolverNotActive.selector, address(0)));
        new ConsensusEngine(address(0), address(reg), address(settlement), address(prefs), registryOwner);
    }

    function test_submittedStatusStillAcceptsSecondVerdict() public {
        vm.prank(resolverA);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "a");
        IBountyBoard.Bounty memory bounty = board.getBounty(BOUNTY_ID);
        assertEq(uint8(bounty.status), uint8(IBountyBoard.BountyStatus.Submitted));

        vm.prank(resolverB);
        engine.submitVerdict(BOUNTY_ID, VERDICT_YES, 100, "b");
        assertEq(uint8(engine.getStatus(BOUNTY_ID)), uint8(ConsensusEngine.ConsensusStatus.Agreed));
    }
}

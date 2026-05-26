// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

contract BountyBoardTest is Test {
    event BountyPosted(
        uint256 indexed bountyId,
        address indexed poster,
        bytes32 indexed bountyType,
        string claim,
        string[] evidenceSources,
        uint64 deadline,
        uint256 payout
    );

    event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refunded);

    event SubmissionRecorded(
        uint256 indexed bountyId,
        address indexed resolver,
        bytes32 verdictHash,
        uint16 confidence,
        string evidenceUri,
        uint64 submittedAt
    );

    BountyBoard internal board;
    address internal treasury = makeAddr("treasury");
    address internal engine = makeAddr("consensusEngine");
    address internal poster = makeAddr("poster");
    address internal resolverA = makeAddr("resolverA");
    address internal resolverB = makeAddr("resolverB");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant BOUNTY_TYPE = keccak256("URL_RESOLVABLE_FACT");
    uint256 internal constant MIN_BOUNTY = 0.1 ether;
    uint256 internal constant PAYOUT = 1 ether;

    function setUp() public {
        board = new BountyBoard(treasury, engine);
        vm.deal(poster, 100 ether);
        vm.deal(stranger, 100 ether);
    }

    function _postDefaultBounty() internal returns (uint256 bountyId) {
        string[] memory sources = new string[](1);
        sources[0] = "https://example.com/match-report";
        vm.prank(poster);
        bountyId = board.postBounty{value: PAYOUT}(
            "Did Manchester City beat Arsenal?",
            sources,
            BOUNTY_TYPE,
            uint64(block.timestamp + 1 days)
        );
    }

    function _recordSubmission(uint256 bountyId, address resolver, bytes32 verdictHash) internal {
        vm.prank(engine);
        board.recordSubmission(bountyId, resolver, verdictHash, 9000, "https://evidence.example.com");
    }

    // ─── Happy path ───────────────────────────────────────────────────────────

    function test_postBounty_createsCorrectState() public {
        string[] memory sources = new string[](2);
        sources[0] = "https://a.example";
        sources[1] = "https://b.example";
        uint64 deadline = uint64(block.timestamp + 2 days);

        vm.expectEmit(true, true, true, true);
        emit BountyPosted(1, poster, BOUNTY_TYPE, "Claim text", sources, deadline, PAYOUT);

        vm.prank(poster);
        uint256 bountyId = board.postBounty{value: PAYOUT}("Claim text", sources, BOUNTY_TYPE, deadline);

        assertEq(bountyId, 1);
        assertEq(board.bountyCount(), 1);
        assertEq(address(board).balance, PAYOUT);

        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        assertEq(bounty.id, 1);
        assertEq(bounty.poster, poster);
        assertEq(bounty.claim, "Claim text");
        assertEq(bounty.evidenceSources.length, 2);
        assertEq(bounty.bountyType, BOUNTY_TYPE);
        assertEq(bounty.deadline, deadline);
        assertEq(bounty.payout, PAYOUT);
        assertEq(uint8(bounty.status), uint8(IBountyBoard.BountyStatus.Open));
        assertEq(bounty.createdAt, block.timestamp);
        assertEq(bounty.resolvedAt, 0);
    }

    function test_cancelBounty_refundsPosterFully() public {
        uint256 bountyId = _postDefaultBounty();
        uint256 posterBefore = poster.balance;

        vm.expectEmit(true, true, false, true);
        emit BountyCancelled(bountyId, poster, PAYOUT);

        vm.prank(poster);
        board.cancelBounty(bountyId);

        assertEq(poster.balance, posterBefore + PAYOUT);
        assertEq(address(board).balance, 0);
        assertEq(uint8(board.getBounty(bountyId).status), uint8(IBountyBoard.BountyStatus.Cancelled));
    }

    function test_recordSubmission_transitionsOpenToSubmitted() public {
        uint256 bountyId = _postDefaultBounty();
        bytes32 verdict = keccak256("TRUE");

        vm.expectEmit(true, true, false, true);
        emit SubmissionRecorded(
            bountyId, resolverA, verdict, 9000, "https://evidence.example.com", uint64(block.timestamp)
        );

        _recordSubmission(bountyId, resolverA, verdict);

        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        assertEq(uint8(bounty.status), uint8(IBountyBoard.BountyStatus.Submitted));

        IBountyBoard.Submission memory sub = board.getSubmission(bountyId, resolverA);
        assertEq(sub.resolver, resolverA);
        assertEq(sub.verdictHash, verdict);
        assertEq(sub.confidence, 9000);
    }

    function test_settleBounty_distributesPayoutAndFee() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        uint256 fee = (PAYOUT * 200) / 10_000;
        uint256 distributable = PAYOUT - fee;
        uint256 shareA = (distributable * 60) / 100;
        uint256 shareB = distributable - shareA;

        address[] memory winners = new address[](2);
        winners[0] = resolverA;
        winners[1] = resolverB;
        uint256[] memory shares = new uint256[](2);
        shares[0] = shareA;
        shares[1] = shareB;

        uint256 treasuryBefore = treasury.balance;
        uint256 resolverABefore = resolverA.balance;
        uint256 resolverBBefore = resolverB.balance;

        bytes32 winningVerdict = keccak256("TRUE");
        vm.prank(engine);
        board.settleBounty(bountyId, winningVerdict, winners, shares);

        assertEq(treasury.balance, treasuryBefore + fee);
        assertEq(resolverA.balance, resolverABefore + shareA);
        assertEq(resolverB.balance, resolverBBefore + shareB);
        assertEq(address(board).balance, 0);

        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        assertEq(uint8(bounty.status), uint8(IBountyBoard.BountyStatus.Resolved));
        assertEq(bounty.winningVerdictHash, winningVerdict);
        assertEq(bounty.resolvedAt, block.timestamp);
    }

    function test_markUnresolved_refundsPosterMinusFee() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("FALSE"));

        uint256 fee = (PAYOUT * 200) / 10_000;
        uint256 refund = PAYOUT - fee;
        uint256 posterBefore = poster.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(engine);
        board.markUnresolved(bountyId);

        assertEq(poster.balance, posterBefore + refund);
        assertEq(treasury.balance, treasuryBefore + fee);
        assertEq(uint8(board.getBounty(bountyId).status), uint8(IBountyBoard.BountyStatus.Unresolved));
    }

    function test_markUnresolved_afterDeadlineWithNoSubmissions() public {
        uint256 bountyId = _postDefaultBounty();
        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        vm.warp(bounty.deadline + 1);

        uint256 fee = (PAYOUT * 200) / 10_000;
        uint256 refund = PAYOUT - fee;
        uint256 posterBefore = poster.balance;

        vm.prank(engine);
        board.markUnresolved(bountyId);

        assertEq(poster.balance, posterBefore + refund);
        assertEq(uint8(board.getBounty(bountyId).status), uint8(IBountyBoard.BountyStatus.Unresolved));
    }

    // ─── Edge cases: postBounty ────────────────────────────────────────────────

    function test_postBounty_revertsPayoutTooSmall() public {
        string[] memory sources = new string[](0);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.PayoutTooSmall.selector, MIN_BOUNTY - 1, MIN_BOUNTY));
        board.postBounty{value: MIN_BOUNTY - 1}("claim", sources, BOUNTY_TYPE, uint64(block.timestamp + 1 days));
    }

    function test_postBounty_revertsDeadlineInPast() public {
        string[] memory sources = new string[](0);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.DeadlineInPast.selector, uint64(block.timestamp - 1)));
        board.postBounty{value: PAYOUT}("claim", sources, BOUNTY_TYPE, uint64(block.timestamp - 1));
    }

    function test_postBounty_revertsDeadlineTooFar() public {
        string[] memory sources = new string[](0);
        uint64 deadline = uint64(block.timestamp + 7 days + 1);
        vm.prank(poster);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.DeadlineTooFar.selector, deadline, uint64(block.timestamp + 7 days))
        );
        board.postBounty{value: PAYOUT}("claim", sources, BOUNTY_TYPE, deadline);
    }

    function test_postBounty_revertsUnsupportedBountyType() public {
        string[] memory sources = new string[](0);
        bytes32 badType = keccak256("BAD_TYPE");
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.UnsupportedBountyType.selector, badType));
        board.postBounty{value: PAYOUT}("claim", sources, badType, uint64(block.timestamp + 1 days));
    }

    function test_postBounty_revertsTooManyEvidenceSources() public {
        string[] memory sources = new string[](11);
        for (uint256 i = 0; i < 11; i++) {
            sources[i] = "https://example.com";
        }
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.TooManyEvidenceSources.selector, 11, 10));
        board.postBounty{value: PAYOUT}("claim", sources, BOUNTY_TYPE, uint64(block.timestamp + 1 days));
    }

    // ─── Edge cases: cancel ───────────────────────────────────────────────────

    function test_cancelBounty_revertsNotPoster() public {
        uint256 bountyId = _postDefaultBounty();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotPoster.selector, stranger, poster));
        board.cancelBounty(bountyId);
    }

    function test_cancelBounty_revertsHasSubmissions() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        vm.prank(poster);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotOpen.selector, bountyId, uint8(IBountyBoard.BountyStatus.Submitted)
            )
        );
        board.cancelBounty(bountyId);
    }

    function test_cancelBounty_revertsWhenAlreadyCancelled() public {
        uint256 bountyId = _postDefaultBounty();
        vm.prank(poster);
        board.cancelBounty(bountyId);
        vm.prank(poster);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotOpen.selector, bountyId, uint8(IBountyBoard.BountyStatus.Cancelled)
            )
        );
        board.cancelBounty(bountyId);
    }

    // ─── Edge cases: recordSubmission ─────────────────────────────────────────

    function test_recordSubmission_revertsNotConsensusEngine() public {
        uint256 bountyId = _postDefaultBounty();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotConsensusEngine.selector, stranger, engine));
        board.recordSubmission(bountyId, resolverA, keccak256("TRUE"), 100, "uri");
    }

    function test_recordSubmission_revertsAfterDeadline() public {
        uint256 bountyId = _postDefaultBounty();
        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        vm.warp(bounty.deadline + 1);
        vm.prank(engine);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.DeadlinePassed.selector, bountyId, bounty.deadline));
        board.recordSubmission(bountyId, resolverA, keccak256("TRUE"), 100, "uri");
    }

    function test_recordSubmission_revertsDuplicateResolver() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        vm.prank(engine);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.ResolverAlreadySubmitted.selector, bountyId, resolverA));
        board.recordSubmission(bountyId, resolverA, keccak256("FALSE"), 100, "uri");
    }

    function test_recordSubmission_revertsTooManySubmissions() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));
        address resolverC = makeAddr("resolverC");
        vm.prank(engine);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.TooManySubmissions.selector, bountyId, uint8(2)));
        board.recordSubmission(bountyId, resolverC, keccak256("TRUE"), 100, "uri");
    }

    // ─── Edge cases: settle ───────────────────────────────────────────────────

    function test_settleBounty_revertsNotSubmittedState() public {
        uint256 bountyId = _postDefaultBounty();
        address[] memory winners = new address[](1);
        winners[0] = resolverA;
        uint256[] memory shares = new uint256[](1);
        shares[0] = 1 ether;
        vm.prank(engine);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotInSubmittedState.selector, bountyId, uint8(IBountyBoard.BountyStatus.Open)
            )
        );
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
    }

    function test_settleBounty_revertsPayoutShareMismatch() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        address[] memory winners = new address[](1);
        winners[0] = resolverA;
        uint256[] memory shares = new uint256[](1);
        shares[0] = 1;

        uint256 expected = PAYOUT - ((PAYOUT * 200) / 10_000);
        vm.prank(engine);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.PayoutShareMismatch.selector, 1, expected));
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
    }

    function test_settleBounty_revertsInvalidWinnerArray() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        address[] memory winners = new address[](0);
        uint256[] memory shares = new uint256[](0);
        vm.prank(engine);
        vm.expectRevert(IBountyBoard.InvalidWinnerArray.selector);
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
    }

    function test_markUnresolved_revertsOnResolvedBounty() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        uint256 distributable = PAYOUT - ((PAYOUT * 200) / 10_000);
        address[] memory winners = new address[](1);
        winners[0] = resolverA;
        uint256[] memory shares = new uint256[](1);
        shares[0] = distributable;

        vm.prank(engine);
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);

        vm.prank(engine);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotInSubmittedState.selector, bountyId, uint8(IBountyBoard.BountyStatus.Resolved)
            )
        );
        board.markUnresolved(bountyId);
    }

    function test_markUnresolved_revertsWhenOpenBeforeDeadline() public {
        uint256 bountyId = _postDefaultBounty();
        vm.prank(engine);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotInSubmittedState.selector, bountyId, uint8(IBountyBoard.BountyStatus.Open)
            )
        );
        board.markUnresolved(bountyId);
    }

    function test_markUnresolved_revertsNotConsensusEngine() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("FALSE"));
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotConsensusEngine.selector, stranger, engine));
        board.markUnresolved(bountyId);
    }

    function test_settleBounty_revertsNotConsensusEngine() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));
        address[] memory winners = new address[](1);
        winners[0] = resolverA;
        uint256[] memory shares = new uint256[](1);
        shares[0] = PAYOUT;
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotConsensusEngine.selector, stranger, engine));
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
    }

    function test_getSubmission_revertsNonexistentBounty() public {
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.BountyDoesNotExist.selector, 42));
        board.getSubmission(42, resolverA);
    }

    function test_recordSubmission_revertsWhenBountyResolved() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));
        uint256 distributable = PAYOUT - ((PAYOUT * 200) / 10_000);
        address[] memory winners = new address[](1);
        winners[0] = resolverA;
        uint256[] memory shares = new uint256[](1);
        shares[0] = distributable;
        vm.prank(engine);
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);

        vm.prank(engine);
        vm.expectRevert(
            abi.encodeWithSelector(
                IBountyBoard.BountyNotOpen.selector, bountyId, uint8(IBountyBoard.BountyStatus.Resolved)
            )
        );
        board.recordSubmission(bountyId, makeAddr("late"), keccak256("TRUE"), 100, "uri");
    }

    function test_settleBounty_allowsZeroShareWinnerWhenSumMatches() public {
        uint256 bountyId = _postDefaultBounty();
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        uint256 distributable = PAYOUT - ((PAYOUT * 200) / 10_000);
        address[] memory winners = new address[](2);
        winners[0] = resolverA;
        winners[1] = resolverB;
        uint256[] memory shares = new uint256[](2);
        shares[0] = distributable;
        shares[1] = 0;

        uint256 resolverABefore = resolverA.balance;
        vm.prank(engine);
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
        assertEq(resolverA.balance, resolverABefore + distributable);
        assertEq(resolverB.balance, 0);
    }

    function test_bountyIdZeroDoesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.BountyDoesNotExist.selector, 0));
        board.getBounty(0);
    }

    // ─── Edge of edge ─────────────────────────────────────────────────────────

    function test_getOpenBounties_pagination() public {
        _postDefaultBounty();
        _postDefaultBounty();
        _postDefaultBounty();

        uint256[] memory page0 = board.getOpenBounties(0, 2);
        assertEq(page0.length, 2);
        assertEq(page0[0], 1);
        assertEq(page0[1], 2);

        uint256[] memory page1 = board.getOpenBounties(2, 2);
        assertEq(page1.length, 1);
        assertEq(page1[0], 3);

        uint256[] memory beyond = board.getOpenBounties(10, 5);
        assertEq(beyond.length, 0);
    }

    function test_getOpenBounties_limitZeroReturnsEmpty() public {
        _postDefaultBounty();
        uint256[] memory empty = board.getOpenBounties(0, 0);
        assertEq(empty.length, 0);
    }

    function test_getBounty_revertsWhenNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.BountyDoesNotExist.selector, 999));
        board.getBounty(999);
    }

    function test_twoBountiesSameBlockGetDifferentIds() public {
        string[] memory sources = new string[](0);
        vm.startPrank(poster);
        uint256 id1 = board.postBounty{value: PAYOUT}("a", sources, BOUNTY_TYPE, uint64(block.timestamp + 1 days));
        uint256 id2 = board.postBounty{value: PAYOUT}("b", sources, BOUNTY_TYPE, uint64(block.timestamp + 1 days));
        vm.stopPrank();
        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_protocolFeeMathExactAtWeiLevel() public {
        uint256 oddPayout = 1 ether + 3;
        string[] memory sources = new string[](0);
        vm.prank(poster);
        uint256 bountyId = board.postBounty{value: oddPayout}(
            "claim", sources, BOUNTY_TYPE, uint64(block.timestamp + 1 days)
        );
        _recordSubmission(bountyId, resolverA, keccak256("TRUE"));
        _recordSubmission(bountyId, resolverB, keccak256("TRUE"));

        uint256 fee = (oddPayout * 200) / 10_000;
        uint256 distributable = oddPayout - fee;
        assertEq(fee + distributable, oddPayout);

        address[] memory winners = new address[](1);
        winners[0] = treasury;
        uint256[] memory shares = new uint256[](1);
        shares[0] = distributable;

        uint256 treasuryBefore = treasury.balance;
        vm.prank(engine);
        board.settleBounty(bountyId, keccak256("TRUE"), winners, shares);
        assertEq(treasury.balance, treasuryBefore + fee + distributable);
    }
}

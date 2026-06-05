// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AppealLayer} from "../src/AppealLayer.sol";
import {IAppealLayer} from "../src/interfaces/IAppealLayer.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";
import {BountyTypes} from "../src/libraries/BountyTypes.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {ConsensusEngine} from "../src/ConsensusEngine.sol";
import {Settlement} from "../src/Settlement.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";

contract AppealLayerTest is Test {
    event AppealOpened(uint256 indexed bountyId, address indexed challenger, uint256 bondAmount);
    event AppealResolved(uint256 indexed bountyId, bool challengeSucceeded);

    BountyBoard internal board;
    ResolverRegistry internal registry;
    ConsensusEngine internal engine;
    AppealLayer internal appeals;

    MockLiFiRouter internal router;
    LiFiAdapter internal adapter;
    ResolverPayoutPrefs internal prefs;
    Settlement internal settlement;

    address internal treasury = makeAddr("treasury");
    address internal owner = makeAddr("owner");
    address internal poster = makeAddr("poster");
    address internal challenger = makeAddr("challenger");
    address internal agentA = makeAddr("agentA");
    address internal agentB = makeAddr("agentB");
    address internal operatorA = makeAddr("operatorA");
    address internal operatorB = makeAddr("operatorB");

    bytes32 internal constant URL_TYPE = keccak256("URL_RESOLVABLE_FACT");
    bytes32 internal constant WINNING_HASH = keccak256("true");

    uint256 internal constant MIN_BOND = 1 ether;
    uint256 internal constant CHALLENGE_BOND = 0.1 ether;

    function setUp() public {
        uint256 nonce = vm.getNonce(address(this));
        address predictedEngine = vm.computeCreateAddress(address(this), nonce + 6);

        router = new MockLiFiRouter();
        adapter = new LiFiAdapter(address(router));
        board = new BountyBoard(treasury, predictedEngine);
        registry = new ResolverRegistry(predictedEngine, owner, MIN_BOND);
        prefs = new ResolverPayoutPrefs(address(registry));
        settlement = new Settlement(address(board), predictedEngine, address(prefs), address(adapter));
        engine = new ConsensusEngine(address(board), address(registry), address(settlement), address(prefs), owner);
        require(address(engine) == predictedEngine, "engine prediction mismatch");

        appeals = new AppealLayer(
            address(board), address(registry), address(engine), treasury, owner, CHALLENGE_BOND, 7 days
        );

        vm.prank(owner);
        registry.setAppealLayer(address(appeals));

        _registerAgent(operatorA, agentA);
        _registerAgent(operatorB, agentB);
    }

    function _registerAgent(address operator, address agent) internal {
        bytes32[] memory tags = new bytes32[](1);
        tags[0] = URL_TYPE;
        vm.deal(operator, MIN_BOND);
        vm.prank(operator);
        registry.registerAgent{value: MIN_BOND}(agent, tags);
    }

    function _postAndSettle() internal returns (uint256 bountyId) {
        vm.deal(poster, 1 ether);
        vm.prank(poster);
        bountyId =
            board.postBounty{value: 0.2 ether}("Is water H2O?", _urls(), URL_TYPE, uint64(block.timestamp + 1 days));

        vm.prank(agentA);
        engine.submitVerdict(bountyId, WINNING_HASH, 9000, "https://example.com/a");

        vm.prank(agentB);
        engine.submitVerdict(bountyId, WINNING_HASH, 9000, "https://example.com/b");
    }

    function _urls() internal pure returns (string[] memory urls) {
        urls = new string[](1);
        urls[0] = "https://example.com/evidence";
    }

    function test_openAppeal_happyPath() public {
        uint256 bountyId = _postAndSettle();

        vm.deal(challenger, CHALLENGE_BOND);
        vm.expectEmit(true, true, false, true);
        emit AppealOpened(bountyId, challenger, CHALLENGE_BOND);
        vm.prank(challenger);
        appeals.openAppeal{value: CHALLENGE_BOND}(bountyId, _urls());

        (address who,,,, bool resolved,) = appeals.getAppeal(bountyId);
        assertEq(who, challenger);
        assertFalse(resolved);
    }

    function test_openAppeal_revertsNotSettled() public {
        vm.deal(poster, 1 ether);
        vm.prank(poster);
        board.postBounty{value: 0.2 ether}("Open bounty", _urls(), URL_TYPE, uint64(block.timestamp + 1 days));

        vm.deal(challenger, CHALLENGE_BOND);
        vm.prank(challenger);
        vm.expectRevert(IAppealLayer.BountyNotSettled.selector);
        appeals.openAppeal{value: CHALLENGE_BOND}(1, _urls());
    }

    function test_openAppeal_revertsInsufficientBond() public {
        _postAndSettle();
        vm.deal(challenger, CHALLENGE_BOND - 1);
        vm.prank(challenger);
        vm.expectRevert(IAppealLayer.InsufficientChallengeBond.selector);
        appeals.openAppeal{value: CHALLENGE_BOND - 1}(1, _urls());
    }

    function test_resolveAppeal_successSlashesAndRefunds() public {
        uint256 bountyId = _postAndSettle();

        vm.deal(challenger, CHALLENGE_BOND);
        vm.prank(challenger);
        appeals.openAppeal{value: CHALLENGE_BOND}(bountyId, _urls());

        uint256 challengerBefore = challenger.balance;

        vm.expectEmit(true, false, false, true);
        emit AppealResolved(bountyId, true);
        vm.prank(owner);
        appeals.resolveAppeal(bountyId, BountyTypes.Verdict.FALSE);

        assertEq(registry.getBond(agentA), MIN_BOND - CHALLENGE_BOND / 2);
        assertEq(registry.getBond(agentB), MIN_BOND - CHALLENGE_BOND / 2);
        uint256 slashEach = CHALLENGE_BOND / 2;
        assertEq(challenger.balance, challengerBefore + CHALLENGE_BOND + slashEach * 2);

        (,,,, bool resolved, bool succeeded) = appeals.getAppeal(bountyId);
        assertTrue(resolved);
        assertTrue(succeeded);
    }

    function test_resolveAppeal_failedForfeitsBond() public {
        uint256 bountyId = _postAndSettle();

        vm.deal(challenger, CHALLENGE_BOND);
        vm.prank(challenger);
        appeals.openAppeal{value: CHALLENGE_BOND}(bountyId, _urls());

        uint256 treasuryBefore = treasury.balance;

        vm.prank(owner);
        appeals.resolveAppeal(bountyId, BountyTypes.Verdict.TRUE);

        assertEq(treasury.balance, treasuryBefore + CHALLENGE_BOND);
        assertEq(registry.getBond(agentA), MIN_BOND);

        (,,,, bool resolved, bool succeeded) = appeals.getAppeal(bountyId);
        assertTrue(resolved);
        assertFalse(succeeded);
    }

    function test_openAppeal_revertsAfterWindow() public {
        uint256 bountyId = _postAndSettle();
        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);

        vm.warp(bounty.resolvedAt + 8 days);

        vm.deal(challenger, CHALLENGE_BOND);
        vm.prank(challenger);
        vm.expectRevert(
            abi.encodeWithSelector(
                AppealLayer.AppealWindowExpired.selector, bountyId, bounty.resolvedAt, bounty.resolvedAt + 7 days
            )
        );
        appeals.openAppeal{value: CHALLENGE_BOND}(bountyId, _urls());
    }
}

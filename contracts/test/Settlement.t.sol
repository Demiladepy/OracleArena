// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Settlement} from "../src/Settlement.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {MockBountyBoard} from "./mocks/MockBountyBoard.sol";
import {MockResolverRegistry} from "./mocks/MockResolverRegistry.sol";
import {IResolverPayoutPrefs} from "../src/interfaces/IResolverPayoutPrefs.sol";
import {ISettlement} from "../src/interfaces/ISettlement.sol";

contract MockConsensusEngine {
    address payable public settlement;

    function setSettlement(address settlement_) external {
        settlement = payable(settlement_);
    }

    function queuePayout(uint256 bountyId, address resolver, uint256 amount) external payable {
        Settlement(settlement).queuePayout{value: msg.value}(bountyId, resolver, amount);
    }
}

contract SettlementTest is Test {
    Settlement internal settlement;
    MockConsensusEngine internal engine;
    MockBountyBoard internal board;
    MockResolverRegistry internal reg;
    ResolverPayoutPrefs internal prefs;
    LiFiAdapter internal adapter;
    MockLiFiRouter internal router;

    address internal resolver = makeAddr("resolver");
    address internal operator = makeAddr("operator");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant BOUNTY_ID = 1;
    uint256 internal constant AMOUNT = 0.05 ether;
    uint32 internal constant BASE_CHAIN = 8453;

    function setUp() public {
        board = new MockBountyBoard();
        reg = new MockResolverRegistry();
        reg.setAgent(resolver, operator, true);

        router = new MockLiFiRouter();
        adapter = new LiFiAdapter(address(router));
        prefs = new ResolverPayoutPrefs(address(reg));

        engine = new MockConsensusEngine();
        settlement = new Settlement(address(board), address(engine), address(prefs), address(adapter));
        engine.setSettlement(address(settlement));

        vm.deal(address(engine), 10 ether);
        vm.deal(address(board), 10 ether);
    }

    function _setCrossChainPref() internal {
        IResolverPayoutPrefs.PayoutPref memory pref = IResolverPayoutPrefs.PayoutPref({
            mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
            destinationChain: BASE_CHAIN,
            destinationAsset: address(0),
            destinationRecipient: operator
        });
        vm.prank(operator);
        prefs.setPreference(resolver, pref);
    }

    function test_happyPath_queueForward_reachesMockRouter() public {
        _setCrossChainPref();

        vm.prank(address(engine));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);

        assertEq(settlement.getPendingForward(BOUNTY_ID, resolver), AMOUNT);

        settlement.forwardPayout(BOUNTY_ID, resolver);

        assertEq(settlement.getPendingForward(BOUNTY_ID, resolver), 0);
        assertEq(router.totalRequests(), 1);

        MockLiFiRouter.BridgeRequest memory req = router.getRequest(1);
        assertEq(req.sender, address(adapter));
        assertEq(req.amount, AMOUNT);
        assertEq(req.destinationChain, BASE_CHAIN);
        assertEq(req.destinationRecipient, operator);
        assertEq(uint8(req.status), uint8(MockLiFiRouter.BridgeStatus.Simulated));
    }

    function test_rescuePath_afterDelay_returnsToOperator() public {
        _setCrossChainPref();

        vm.prank(address(engine));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);

        vm.warp(block.timestamp + settlement.RESCUE_DELAY() + 1);

        uint256 before = operator.balance;
        vm.prank(operator);
        settlement.rescuePayout(BOUNTY_ID, resolver);

        assertEq(operator.balance, before + AMOUNT);
        assertEq(settlement.getPendingForward(BOUNTY_ID, resolver), 0);
    }

    function test_forwardWithoutQueue_reverts() public {
        vm.expectRevert(abi.encodeWithSelector(ISettlement.NoPendingForward.selector, BOUNTY_ID, resolver));
        settlement.forwardPayout(BOUNTY_ID, resolver);
    }

    function test_queueFromNonConsensusEngine_reverts() public {
        vm.deal(stranger, AMOUNT);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ISettlement.NotConsensusEngine.selector, stranger, address(engine)));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);
    }

    function test_rescueBeforeDelay_reverts() public {
        _setCrossChainPref();
        vm.prank(address(engine));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);

        uint64 readyAt = settlement.getQueuedAt(BOUNTY_ID, resolver) + uint64(settlement.RESCUE_DELAY());
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(ISettlement.RescueDelayNotElapsed.selector, readyAt, uint64(block.timestamp))
        );
        settlement.rescuePayout(BOUNTY_ID, resolver);
    }

    function test_forwardNativePreference_reverts() public {
        vm.prank(address(engine));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);

        vm.expectRevert(abi.encodeWithSelector(ISettlement.UnexpectedNativePreference.selector, resolver));
        settlement.forwardPayout(BOUNTY_ID, resolver);
    }

    function test_receive_onlyFromBountyBoard() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ISettlement.NotBountyBoard.selector, stranger, address(board)));
        (bool ok,) = address(settlement).call{value: 1 ether}("");
        ok;
    }

    function test_receive_fromBountyBoard() public {
        vm.prank(address(board));
        (bool ok,) = address(settlement).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(address(settlement).balance, 1 ether);
    }

    function test_queueAmountMismatch_reverts() public {
        vm.prank(address(engine));
        vm.expectRevert(abi.encodeWithSelector(ISettlement.AmountMismatch.selector, AMOUNT, AMOUNT / 2));
        settlement.queuePayout{value: AMOUNT / 2}(BOUNTY_ID, resolver, AMOUNT);
    }

    function test_rescue_notOperator_reverts() public {
        _setCrossChainPref();
        vm.prank(address(engine));
        settlement.queuePayout{value: AMOUNT}(BOUNTY_ID, resolver, AMOUNT);
        vm.warp(block.timestamp + settlement.RESCUE_DELAY() + 1);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverPayoutPrefs.NotOperator.selector, stranger, operator));
        settlement.rescuePayout(BOUNTY_ID, resolver);
    }

    function test_constructor_revertsZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(ISettlement.NotConsensusEngine.selector, address(0), address(engine)));
        new Settlement(address(0), address(engine), address(prefs), address(adapter));
    }
}

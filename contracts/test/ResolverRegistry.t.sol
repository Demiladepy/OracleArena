// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";
import {IResolverRegistry} from "../src/interfaces/IResolverRegistry.sol";

contract RevertingReceiver {
    receive() external payable {
        revert();
    }
}

contract ResolverRegistryTest is Test {
    event AgentRegistered(
        address indexed agent, address indexed operator, bytes32[] typeTags, uint256 bond, uint64 registeredAt
    );
    event AgentSlashed(address indexed agent, uint256 amount, address indexed recipient, address indexed slashedBy);
    event AppealLayerSet(address indexed appealLayer);

    ResolverRegistry internal registry;

    address internal owner = makeAddr("owner");
    address internal consensusEngine = makeAddr("consensusEngine");
    address internal appealLayer = makeAddr("appealLayer");
    address internal operatorA = makeAddr("operatorA");
    address internal operatorB = makeAddr("operatorB");
    address internal agentA = makeAddr("agentA");
    address internal agentB = makeAddr("agentB");
    address internal stranger = makeAddr("stranger");
    address internal recipient = makeAddr("recipient");

    bytes32 internal constant URL_RESOLVABLE_FACT = keccak256("URL_RESOLVABLE_FACT");
    bytes32 internal constant OTHER_TAG = keccak256("OTHER_TAG");

    uint256 internal constant MIN_BOND = 50 ether;

    function setUp() public {
        registry = new ResolverRegistry(consensusEngine, owner, MIN_BOND);
    }

    function _tags(bytes32 tag) internal pure returns (bytes32[] memory tags_) {
        tags_ = new bytes32[](1);
        tags_[0] = tag;
    }

    function _register(address operator, address agent, bytes32 tag, uint256 bond) internal {
        vm.deal(operator, bond);
        vm.prank(operator);
        registry.registerAgent{value: bond}(agent, _tags(tag));
    }

    function test_registerAgent_happyPath() public {
        bytes32[] memory tags = new bytes32[](2);
        tags[0] = URL_RESOLVABLE_FACT;
        tags[1] = OTHER_TAG;

        vm.deal(operatorA, MIN_BOND);
        vm.expectEmit(true, true, false, true);
        emit AgentRegistered(agentA, operatorA, tags, MIN_BOND, uint64(block.timestamp));
        vm.prank(operatorA);
        registry.registerAgent{value: MIN_BOND}(agentA, tags);

        IResolverRegistry.Agent memory agent = registry.getAgent(agentA);
        assertEq(agent.agentAddress, agentA);
        assertEq(agent.operator, operatorA);
        assertEq(agent.bond, MIN_BOND);
        assertEq(agent.typeTags.length, 2);
        assertEq(uint8(agent.status), uint8(IResolverRegistry.AgentStatus.Active));
        assertEq(agent.registeredAt, uint64(block.timestamp));
        assertTrue(registry.isActive(agentA));
        assertEq(registry.totalAgents(), 1);
        assertTrue(registry.handlesTypeTag(agentA, URL_RESOLVABLE_FACT));
        assertTrue(registry.handlesTypeTag(agentA, OTHER_TAG));
    }

    function test_registerAgent_revertsBondTooSmall() public {
        vm.deal(operatorA, MIN_BOND - 1);
        vm.prank(operatorA);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.BondTooSmall.selector, MIN_BOND - 1, MIN_BOND));
        registry.registerAgent{value: MIN_BOND - 1}(agentA, _tags(URL_RESOLVABLE_FACT));
    }

    function test_registerAgent_revertsNoTypeTags() public {
        bytes32[] memory empty = new bytes32[](0);
        vm.deal(operatorA, MIN_BOND);
        vm.prank(operatorA);
        vm.expectRevert(IResolverRegistry.NoTypeTags.selector);
        registry.registerAgent{value: MIN_BOND}(agentA, empty);
    }

    function test_registerAgent_revertsTooManyTypeTags() public {
        bytes32[] memory tags = new bytes32[](11);
        for (uint256 i = 0; i < 11; i++) {
            tags[i] = keccak256(abi.encodePacked("tag", i));
        }
        vm.deal(operatorA, MIN_BOND);
        vm.prank(operatorA);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.TooManyTypeTags.selector, 11, 10));
        registry.registerAgent{value: MIN_BOND}(agentA, tags);
    }

    function test_registerAgent_revertsAlreadyRegistered() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.deal(operatorB, MIN_BOND);
        vm.prank(operatorB);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.AgentAlreadyRegistered.selector, agentA));
        registry.registerAgent{value: MIN_BOND}(agentA, _tags(OTHER_TAG));
    }

    function test_registerAgent_deduplicatesDuplicateTags() public {
        bytes32[] memory tags = new bytes32[](2);
        tags[0] = URL_RESOLVABLE_FACT;
        tags[1] = URL_RESOLVABLE_FACT;

        vm.deal(operatorA, MIN_BOND);
        vm.prank(operatorA);
        registry.registerAgent{value: MIN_BOND}(agentA, tags);

        IResolverRegistry.Agent memory agent = registry.getAgent(agentA);
        assertEq(agent.typeTags.length, 1);
        assertEq(agent.typeTags[0], URL_RESOLVABLE_FACT);
    }

    function test_updateReputation_agreedAndNotAgreed() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);

        vm.prank(consensusEngine);
        registry.updateReputation(agentA, true, 1 ether);

        IResolverRegistry.Reputation memory rep = registry.getReputation(agentA);
        assertEq(rep.resolutionsAttempted, 1);
        assertEq(rep.resolutionsAgreed, 1);
        assertEq(rep.totalEarnings, 1 ether);

        vm.prank(consensusEngine);
        registry.updateReputation(agentA, false, 0);

        rep = registry.getReputation(agentA);
        assertEq(rep.resolutionsAttempted, 2);
        assertEq(rep.resolutionsAgreed, 1);
        assertEq(rep.totalEarnings, 1 ether);
    }

    function test_updateReputation_revertsNotConsensusEngine() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IResolverRegistry.NotConsensusEngine.selector, stranger, consensusEngine)
        );
        registry.updateReputation(agentA, true, 1);
    }

    function test_updateReputation_revertsAgentNotActive() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(operatorA);
        registry.requestWithdrawal(agentA);

        vm.prank(consensusEngine);
        vm.expectRevert(
            abi.encodeWithSelector(
                IResolverRegistry.AgentNotActive.selector, agentA, uint8(IResolverRegistry.AgentStatus.Withdrawing)
            )
        );
        registry.updateReputation(agentA, true, 1);
    }

    function test_withdrawalLifecycle() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);

        vm.prank(operatorA);
        registry.requestWithdrawal(agentA);

        IResolverRegistry.Agent memory mid = registry.getAgent(agentA);
        assertEq(uint8(mid.status), uint8(IResolverRegistry.AgentStatus.Withdrawing));
        assertEq(mid.withdrawalReadyAt, uint64(block.timestamp + registry.WITHDRAWAL_DELAY()));

        vm.expectRevert(
            abi.encodeWithSelector(
                IResolverRegistry.WithdrawalNotReady.selector, agentA, mid.withdrawalReadyAt, uint64(block.timestamp)
            )
        );
        vm.prank(operatorA);
        registry.completeWithdrawal(agentA);

        vm.warp(mid.withdrawalReadyAt);
        uint256 before = operatorA.balance;
        vm.prank(operatorA);
        registry.completeWithdrawal(agentA);

        assertEq(operatorA.balance, before + MIN_BOND);
        assertEq(registry.getBond(agentA), 0);
        assertFalse(registry.isActive(agentA));
        assertEq(uint8(registry.getAgent(agentA).status), uint8(IResolverRegistry.AgentStatus.Withdrawn));
    }

    function test_requestWithdrawal_revertsNotOperator() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.NotOperator.selector, stranger, operatorA));
        registry.requestWithdrawal(agentA);
    }

    function test_requestWithdrawal_revertsAgentNotActive() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(operatorA);
        registry.requestWithdrawal(agentA);
        vm.warp(block.timestamp + registry.WITHDRAWAL_DELAY());
        vm.prank(operatorA);
        registry.completeWithdrawal(agentA);

        vm.prank(operatorA);
        vm.expectRevert(
            abi.encodeWithSelector(
                IResolverRegistry.AgentNotActive.selector, agentA, uint8(IResolverRegistry.AgentStatus.Withdrawn)
            )
        );
        registry.requestWithdrawal(agentA);
    }

    function test_completeWithdrawal_revertsAgentNotWithdrawing() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(operatorA);
        vm.expectRevert(
            abi.encodeWithSelector(
                IResolverRegistry.AgentNotWithdrawing.selector, agentA, uint8(IResolverRegistry.AgentStatus.Active)
            )
        );
        registry.completeWithdrawal(agentA);
    }

    function test_slash_revertsNotAppealLayerWhenUnset() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(appealLayer);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.NotAppealLayer.selector, appealLayer, address(0)));
        registry.slash(agentA, 1 ether, recipient);
    }

    function test_slash_revertsNotAppealLayerWhenWrongSender() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.NotAppealLayer.selector, stranger, appealLayer));
        registry.slash(agentA, 1 ether, recipient);
    }

    function test_slash_revertsSlashAmountExceedsBond() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);

        vm.prank(appealLayer);
        vm.expectRevert(
            abi.encodeWithSelector(IResolverRegistry.SlashAmountExceedsBond.selector, MIN_BOND + 1, MIN_BOND)
        );
        registry.slash(agentA, MIN_BOND + 1, recipient);
    }

    function test_slash_transfersBondSlice() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);

        uint256 slashAmount = 5 ether;
        uint256 before = recipient.balance;

        vm.expectEmit(true, true, true, true);
        emit AgentSlashed(agentA, slashAmount, recipient, appealLayer);
        vm.prank(appealLayer);
        registry.slash(agentA, slashAmount, recipient);

        assertEq(registry.getBond(agentA), MIN_BOND - slashAmount);
        assertEq(recipient.balance, before + slashAmount);
    }

    function test_setAppealLayer_ownerOnce() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit AppealLayerSet(appealLayer);
        registry.setAppealLayer(appealLayer);
        assertEq(registry.appealLayer(), appealLayer);
    }

    function test_setAppealLayer_revertsNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.NotOwner.selector, stranger, owner));
        registry.setAppealLayer(appealLayer);
    }

    function test_setAppealLayer_revertsAlreadySet() public {
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.AppealLayerAlreadySet.selector, appealLayer));
        registry.setAppealLayer(makeAddr("other"));
    }

    function test_setAppealLayer_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IResolverRegistry.AppealLayerNotSet.selector);
        registry.setAppealLayer(address(0));
    }

    function test_getAgentsForTypeTag_pagination() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        _register(operatorB, agentB, URL_RESOLVABLE_FACT, MIN_BOND + 1 ether);

        address[] memory page0 = registry.getAgentsForTypeTag(URL_RESOLVABLE_FACT, 0, 1);
        assertEq(page0.length, 1);
        assertEq(page0[0], agentA);

        address[] memory page1 = registry.getAgentsForTypeTag(URL_RESOLVABLE_FACT, 1, 10);
        assertEq(page1.length, 1);
        assertEq(page1[0], agentB);

        address[] memory empty = registry.getAgentsForTypeTag(URL_RESOLVABLE_FACT, 5, 1);
        assertEq(empty.length, 0);
    }

    function test_viewFunctions_defaultForUnknownAgent() public view {
        IResolverRegistry.Agent memory agent = registry.getAgent(agentA);
        assertEq(agent.operator, address(0));
        assertEq(agent.bond, 0);
        assertEq(uint8(agent.status), uint8(IResolverRegistry.AgentStatus.None));
        assertEq(registry.getBond(agentA), 0);
        assertEq(registry.getReputation(agentA).resolutionsAttempted, 0);
        assertFalse(registry.handlesTypeTag(agentA, URL_RESOLVABLE_FACT));
        assertFalse(registry.isActive(agentA));
    }

    function test_withdrawnAgentCannotRegisterAgain() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(operatorA);
        registry.requestWithdrawal(agentA);
        vm.warp(block.timestamp + registry.WITHDRAWAL_DELAY());
        vm.prank(operatorA);
        registry.completeWithdrawal(agentA);

        vm.deal(operatorB, MIN_BOND);
        vm.prank(operatorB);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.AgentAlreadyRegistered.selector, agentA));
        registry.registerAgent{value: MIN_BOND}(agentA, _tags(OTHER_TAG));
    }

    function test_constructor_revertsZeroAddresses() public {
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.TransferFailed.selector, address(0), 0));
        new ResolverRegistry(address(0), owner, MIN_BOND);

        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.TransferFailed.selector, address(0), 0));
        new ResolverRegistry(consensusEngine, address(0), MIN_BOND);
    }

    function test_registerAgent_respectsConstructorMinBond() public {
        ResolverRegistry lowBondRegistry = new ResolverRegistry(consensusEngine, owner, 1 ether);
        vm.deal(operatorA, 1 ether);
        vm.prank(operatorA);
        lowBondRegistry.registerAgent{value: 1 ether}(agentA, _tags(URL_RESOLVABLE_FACT));
        assertEq(lowBondRegistry.getBond(agentA), 1 ether);
        assertEq(lowBondRegistry.MIN_BOND(), 1 ether);
    }

    function test_completeWithdrawal_revertsNotOperator() public {
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(operatorA);
        registry.requestWithdrawal(agentA);
        vm.warp(block.timestamp + registry.WITHDRAWAL_DELAY());

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.NotOperator.selector, stranger, operatorA));
        registry.completeWithdrawal(agentA);
    }

    function test_completeWithdrawal_revertsTransferFailed() public {
        RevertingReceiver revertingOperator = new RevertingReceiver();
        vm.deal(address(revertingOperator), MIN_BOND);
        vm.prank(address(revertingOperator));
        registry.registerAgent{value: MIN_BOND}(agentA, _tags(URL_RESOLVABLE_FACT));

        vm.prank(address(revertingOperator));
        registry.requestWithdrawal(agentA);
        vm.warp(block.timestamp + registry.WITHDRAWAL_DELAY());

        vm.prank(address(revertingOperator));
        vm.expectRevert(
            abi.encodeWithSelector(IResolverRegistry.TransferFailed.selector, address(revertingOperator), MIN_BOND)
        );
        registry.completeWithdrawal(agentA);
    }

    function test_slash_revertsTransferFailed() public {
        RevertingReceiver reverting = new RevertingReceiver();
        _register(operatorA, agentA, URL_RESOLVABLE_FACT, MIN_BOND);
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);

        vm.prank(appealLayer);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.TransferFailed.selector, address(reverting), 1 ether));
        registry.slash(agentA, 1 ether, address(reverting));
    }

    function test_slash_revertsAgentNotRegistered() public {
        vm.prank(owner);
        registry.setAppealLayer(appealLayer);
        vm.prank(appealLayer);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.AgentNotRegistered.selector, agentA));
        registry.slash(agentA, 1 ether, recipient);
    }

    function test_updateReputation_revertsAgentNotRegistered() public {
        vm.prank(consensusEngine);
        vm.expectRevert(abi.encodeWithSelector(IResolverRegistry.AgentNotRegistered.selector, agentA));
        registry.updateReputation(agentA, true, 1);
    }
}

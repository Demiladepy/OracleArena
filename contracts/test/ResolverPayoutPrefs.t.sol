// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {MockResolverRegistry} from "./mocks/MockResolverRegistry.sol";
import {IResolverPayoutPrefs} from "../src/interfaces/IResolverPayoutPrefs.sol";

contract ResolverPayoutPrefsTest is Test {
    ResolverPayoutPrefs internal prefs;
    MockResolverRegistry internal reg;

    address internal agent = makeAddr("agent");
    address internal operator = makeAddr("operator");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        reg = new MockResolverRegistry();
        reg.setAgent(agent, operator, true);
        prefs = new ResolverPayoutPrefs(address(reg));
    }

    function test_defaultPreference_isSomniaNative() public view {
        IResolverPayoutPrefs.PayoutPref memory pref = prefs.getPreference(agent);
        assertEq(pref.mode, uint8(IResolverPayoutPrefs.PayoutMode.SomniaNative));
        assertEq(pref.destinationChain, 0);
        assertEq(pref.destinationAsset, address(0));
        assertEq(pref.destinationRecipient, address(0));
    }

    function test_setAndClearPreference() public {
        IResolverPayoutPrefs.PayoutPref memory cross = IResolverPayoutPrefs.PayoutPref({
            mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
            destinationChain: 8453,
            destinationAsset: address(0),
            destinationRecipient: operator
        });

        vm.prank(operator);
        prefs.setPreference(agent, cross);
        IResolverPayoutPrefs.PayoutPref memory stored = prefs.getPreference(agent);
        assertEq(stored.mode, cross.mode);
        assertEq(stored.destinationChain, cross.destinationChain);

        vm.prank(operator);
        prefs.clearPreference(agent);
        assertEq(prefs.getPreference(agent).mode, uint8(IResolverPayoutPrefs.PayoutMode.SomniaNative));
    }

    function test_setPreference_revertsNotOperator() public {
        IResolverPayoutPrefs.PayoutPref memory cross = IResolverPayoutPrefs.PayoutPref({
            mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
            destinationChain: 8453,
            destinationAsset: address(0),
            destinationRecipient: operator
        });
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IResolverPayoutPrefs.NotOperator.selector, stranger, operator));
        prefs.setPreference(agent, cross);
    }

    function test_setPreference_revertsInvalidMode() public {
        IResolverPayoutPrefs.PayoutPref memory bad = IResolverPayoutPrefs.PayoutPref({
            mode: 2, destinationChain: 0, destinationAsset: address(0), destinationRecipient: address(0)
        });
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IResolverPayoutPrefs.InvalidMode.selector, uint8(2)));
        prefs.setPreference(agent, bad);
    }
}

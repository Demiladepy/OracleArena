// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LiFiAdapter} from "../src/LiFiAdapter.sol";
import {MockLiFiRouter} from "../src/mocks/MockLiFiRouter.sol";
import {RevertingLiFiRouter} from "./mocks/RevertingLiFiRouter.sol";
import {ILiFiAdapter} from "../src/interfaces/ILiFiAdapter.sol";

contract LiFiAdapterTest is Test {
    address internal resolver = makeAddr("resolver");
    address internal recipient = makeAddr("recipient");
    uint32 internal constant DEST_CHAIN = 8453;

    function test_happyPath_routesToMockRouter() public {
        MockLiFiRouter router = new MockLiFiRouter();
        LiFiAdapter adapter = new LiFiAdapter(address(router));

        assertEq(adapter.getRouter(), address(router));

        uint256 amount = 0.123456789012345678 ether;
        vm.deal(address(this), amount);

        adapter.initiateBridge{value: amount}(resolver, DEST_CHAIN, address(0), recipient);

        assertEq(router.totalRequests(), 1);
        MockLiFiRouter.BridgeRequest memory req = router.getRequest(1);
        assertEq(req.sender, address(adapter));
        assertEq(req.amount, amount);
        assertEq(req.destinationChain, DEST_CHAIN);
        assertEq(req.destinationRecipient, recipient);
    }

    function test_bridgeFailure_propagatesBridgeFailed() public {
        RevertingLiFiRouter router = new RevertingLiFiRouter();
        LiFiAdapter adapter = new LiFiAdapter(address(router));

        vm.expectRevert();
        adapter.initiateBridge{value: 1 ether}(resolver, DEST_CHAIN, address(0), recipient);
    }

    function test_zeroAmount_reverts() public {
        MockLiFiRouter router = new MockLiFiRouter();
        LiFiAdapter adapter = new LiFiAdapter(address(router));

        vm.expectRevert(ILiFiAdapter.ZeroAmount.selector);
        adapter.initiateBridge(resolver, DEST_CHAIN, address(0), recipient);
    }

    function test_constructor_revertsZeroRouter() public {
        vm.expectRevert(abi.encodeWithSelector(ILiFiAdapter.BridgeFailed.selector, address(0), bytes("")));
        new LiFiAdapter(address(0));
    }

    function test_nativeAccounting_weiLevel() public {
        MockLiFiRouter router = new MockLiFiRouter();
        LiFiAdapter adapter = new LiFiAdapter(address(router));

        uint256 amount = 1 wei;
        adapter.initiateBridge{value: amount}(resolver, DEST_CHAIN, address(0), recipient);
        assertEq(address(router).balance, amount);
    }
}

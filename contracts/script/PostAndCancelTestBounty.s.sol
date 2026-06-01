// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title PostAndCancelTestBounty
/// @notice Post a small test bounty then cancel it — for SDS publisher smoke test
contract PostAndCancelTestBounty is Script {
    function run() external {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));
        uint256 payout = vm.envOr("TEST_BOUNTY_PAYOUT_WEI", uint256(0.1 ether));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        string[] memory sources = new string[](1);
        sources[0] = "https://example.com/sds-smoke-test";

        uint256 bountyId = board.postBounty{value: payout}(
            "SDS publisher smoke test bounty", sources, board.URL_RESOLVABLE_FACT(), uint64(block.timestamp + 1 days)
        );
        console2.log("Posted test bountyId:", bountyId);

        board.cancelBounty(bountyId);
        console2.log("Cancelled test bountyId:", bountyId);

        vm.stopBroadcast();
    }
}

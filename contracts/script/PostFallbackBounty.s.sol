// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title PostFallbackBounty
/// @notice Post an unambiguous URL-resolvable demo bounty for consensus retry
contract PostFallbackBounty is Script {
    function run() external {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));

        string[] memory sources = new string[](1);
        sources[0] = "https://en.wikipedia.org/wiki/Manchester_United_F.C.";

        uint64 deadline = uint64(block.timestamp + 6 days);
        uint256 payout = 0.2 ether;

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        uint256 bountyId = board.postBounty{value: payout}(
            "Is the official English Wikipedia page for Manchester United F.C. located at https://en.wikipedia.org/wiki/Manchester_United_F.C. ?",
            sources,
            board.URL_RESOLVABLE_FACT(),
            deadline
        );

        vm.stopBroadcast();

        console2.log("Fallback bountyId:", bountyId);
        console2.log("deadline:", deadline);
        console2.log("payout wei:", payout);
    }
}

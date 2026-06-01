// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

/// @title PostOpenBounty
/// @notice Post a live bounty left open for ResolverAgent testing (testnet)
/// @dev BOUNTY_BOARD_ADDRESS env required
contract PostOpenBounty is Script {
    function run() external {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        string[] memory sources = new string[](1);
        sources[0] = "https://www.bbc.com/sport/football/teams/manchester-city";

        uint64 deadline = uint64(block.timestamp + 6 days);
        uint256 payout = 0.2 ether;

        vm.startBroadcast(deployerKey);

        uint256 gasBefore = gasleft();
        uint256 bountyId = board.postBounty{value: payout}(
            "Did Manchester City beat Arsenal in their most recent Premier League fixture?",
            sources,
            board.URL_RESOLVABLE_FACT(),
            deadline
        );
        uint256 postGas = gasBefore - gasleft();

        vm.stopBroadcast();

        console2.log("Open bountyId:", bountyId);
        console2.log("postBounty gas (approx):", postGas);
        console2.log("deadline:", deadline);
        console2.log("payout wei:", payout);
    }
}

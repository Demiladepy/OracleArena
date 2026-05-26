// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

/// @title VerifyBountyBoard
/// @notice Post and cancel a sample bounty on deployed BountyBoard (testnet smoke test)
/// @dev BOUNTY_BOARD_ADDRESS env required; uses deployer key as consensusEngine placeholder for read-only cancel path
contract VerifyBountyBoard is Script {
    function run() external {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        string[] memory sources = new string[](1);
        sources[0] = "https://example.com/sports/manchester-city-arsenal";

        uint64 deadline = uint64(block.timestamp + 1 days);
        uint256 payout = 0.1 ether;

        vm.startBroadcast(deployerKey);

        uint256 gasBefore = gasleft();
        uint256 bountyId = board.postBounty{value: payout}(
            "Did Manchester City beat Arsenal on 2026-05-25?", sources, board.URL_RESOLVABLE_FACT(), deadline
        );
        uint256 postGas = gasBefore - gasleft();
        console2.log("Posted bountyId:", bountyId);
        console2.log("postBounty gas (approx):", postGas);

        gasBefore = gasleft();
        board.cancelBounty(bountyId);
        uint256 cancelGas = gasBefore - gasleft();
        console2.log("cancelBounty gas (approx):", cancelGas);

        vm.stopBroadcast();

        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        console2.log("Final status:", uint8(bounty.status));
        require(uint8(bounty.status) == uint8(IBountyBoard.BountyStatus.Cancelled), "cancel failed");
    }
}

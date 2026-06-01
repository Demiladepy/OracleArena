// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

/// @title VerifyBountyBoard
/// @notice Post and cancel a sample bounty on deployed BountyBoard (testnet smoke test)
/// @dev Run post and cancel as separate forge invocations so each tx gets a full gas budget on Somnia.
contract VerifyBountyBoard is Script {
    function run() external {
        uint256 bountyId = _postSampleBounty();
        _cancelSampleBounty(bountyId);
    }

    function runPost() external returns (uint256 bountyId) {
        bountyId = _postSampleBounty();
    }

    function runCancel() external {
        uint256 bountyId = vm.envUint("SMOKE_BOUNTY_ID");
        _cancelSampleBounty(bountyId);
    }

    function _postSampleBounty() internal returns (uint256 bountyId) {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        string[] memory sources = new string[](1);
        sources[0] = "https://example.com/sports/manchester-city-arsenal";

        uint64 deadline = uint64(block.timestamp + 1 days);
        uint256 payout = 0.1 ether;

        vm.startBroadcast(deployerKey);

        uint256 gasBefore = gasleft();
        bountyId = board.postBounty{value: payout}(
            "Did Manchester City beat Arsenal on 2026-05-25?", sources, board.URL_RESOLVABLE_FACT(), deadline
        );
        uint256 postGas = gasBefore - gasleft();
        console2.log("Posted bountyId:", bountyId);
        console2.log("postBounty gas (approx):", postGas);

        vm.stopBroadcast();
    }

    function _cancelSampleBounty(uint256 bountyId) internal {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        BountyBoard board = BountyBoard(payable(boardAddress));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        uint256 gasBefore = gasleft();
        board.cancelBounty(bountyId);
        uint256 cancelGas = gasBefore - gasleft();
        console2.log("cancelBounty gas (approx):", cancelGas);

        vm.stopBroadcast();

        IBountyBoard.Bounty memory bounty = board.getBounty(bountyId);
        console2.log("Final status:", uint8(bounty.status));
        require(uint8(bounty.status) == uint8(IBountyBoard.BountyStatus.Cancelled), "cancel failed");
    }
}

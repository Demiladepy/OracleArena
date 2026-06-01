// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BountyBoard} from "../src/BountyBoard.sol";

contract CancelTestBounty is Script {
    function run() external {
        address boardAddress = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        uint256 bountyId = vm.envUint("BOUNTY_ID");
        BountyBoard board = BountyBoard(payable(boardAddress));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        board.cancelBounty(bountyId);
        vm.stopBroadcast();
        console2.log("Cancelled bountyId:", bountyId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverPayoutPrefs} from "../src/ResolverPayoutPrefs.sol";
import {IResolverPayoutPrefs} from "../src/interfaces/IResolverPayoutPrefs.sol";

/// @notice Set CrossChain payout preference for live ResolverAgent (operator = deployer)
contract SetCrossChainPref is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address prefs = vm.envAddress("PAYOUT_PREFS_ADDRESS");
        address agent = vm.envAddress("RESOLVER_AGENT_ADDRESS");
        address recipient = vm.envOr("CROSS_CHAIN_RECIPIENT", deployer);
        uint32 chainId = uint32(vm.envOr("DESTINATION_CHAIN_ID", uint256(8453)));

        IResolverPayoutPrefs.PayoutPref memory pref = IResolverPayoutPrefs.PayoutPref({
            mode: uint8(IResolverPayoutPrefs.PayoutMode.CrossChain),
            destinationChain: chainId,
            destinationAsset: address(0),
            destinationRecipient: recipient
        });

        vm.startBroadcast(deployer);
        ResolverPayoutPrefs(prefs).setPreference(agent, pref);
        vm.stopBroadcast();

        console2.log("Set CrossChain pref for agent:", agent);
        console2.log("destinationChain:", chainId);
        console2.log("destinationRecipient:", recipient);
    }
}

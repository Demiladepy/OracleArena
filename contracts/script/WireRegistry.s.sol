// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";

/// @title WireRegistry
/// @notice Deploy ResolverRegistry v3 with real ConsensusEngine (Option A — immutable consensusEngine requires redeploy)
/// @dev Reads CONSENSUS_ENGINE and MIN_BOND_WEI (default 1 STT) from env
contract WireRegistry is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE");
        uint256 minBond = vm.envOr("MIN_BOND_WEI", uint256(1 ether));

        console2.log("Deployer:", deployer);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("Owner:", deployer);
        console2.log("MIN_BOND (wei):", minBond);

        vm.startBroadcast(deployer);
        ResolverRegistry registry = new ResolverRegistry(consensusEngine, deployer, minBond);
        console2.log("ResolverRegistry v3 deployed at:", address(registry));
        vm.stopBroadcast();
    }
}

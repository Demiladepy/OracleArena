// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";

/// @title DeployResolverRegistry
/// @notice Deploy ResolverRegistry to Somnia testnet
/// @dev Set MIN_BOND_WEI in env (default 1e18 = 1 STT for testnet). Production target: 50e18 (50 STT).
contract DeployResolverRegistry is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address consensusEngine = vm.envOr("CONSENSUS_ENGINE", deployer);
        address owner = vm.envOr("REGISTRY_OWNER", deployer);
        uint256 minBond = vm.envOr("MIN_BOND_WEI", uint256(1 ether));

        if (consensusEngine == deployer) {
            console2.log("WARNING: CONSENSUS_ENGINE is the deployer address. Update once ConsensusEngine is deployed.");
        }

        console2.log("Deployer:", deployer);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("Owner:", owner);
        console2.log("MIN_BOND (wei):", minBond);

        vm.startBroadcast(deployer);

        ResolverRegistry registry = new ResolverRegistry(consensusEngine, owner, minBond);
        console2.log("ResolverRegistry deployed at:", address(registry));
        console2.log("appealLayer (MVP):", registry.appealLayer());

        vm.stopBroadcast();
    }
}

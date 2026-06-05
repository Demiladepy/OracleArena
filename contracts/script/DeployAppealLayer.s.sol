// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {AppealLayer} from "../src/AppealLayer.sol";
import {ResolverRegistry} from "../src/ResolverRegistry.sol";

/// @notice Deploy AppealLayer and wire it to ResolverRegistry (owner must call setAppealLayer)
contract DeployAppealLayer is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address bountyBoard = vm.envAddress("BOUNTY_BOARD_ADDRESS");
        address registry = vm.envAddress("RESOLVER_REGISTRY_ADDRESS");
        address consensusEngine = vm.envAddress("CONSENSUS_ENGINE_ADDRESS");
        address treasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        uint256 minChallengeBond = vm.envOr("MIN_CHALLENGE_BOND_WEI", uint256(0.05 ether));
        uint64 appealWindow = uint64(vm.envOr("APPEAL_WINDOW_SECONDS", uint256(7 days)));

        console2.log("Deployer:", deployer);
        console2.log("BountyBoard:", bountyBoard);
        console2.log("Registry:", registry);
        console2.log("ConsensusEngine:", consensusEngine);
        console2.log("Treasury:", treasury);
        console2.log("Min challenge bond (wei):", minChallengeBond);
        console2.log("Appeal window (seconds):", appealWindow);

        vm.startBroadcast(deployer);

        AppealLayer layer =
            new AppealLayer(bountyBoard, registry, consensusEngine, treasury, deployer, minChallengeBond, appealWindow);
        console2.log("AppealLayer deployed at:", address(layer));

        address currentAppeal = ResolverRegistry(payable(registry)).appealLayer();
        if (currentAppeal == address(0)) {
            ResolverRegistry(payable(registry)).setAppealLayer(address(layer));
            console2.log("AppealLayer wired to registry");
        } else {
            console2.log("Registry already has appealLayer:", currentAppeal);
        }

        vm.stopBroadcast();
    }
}

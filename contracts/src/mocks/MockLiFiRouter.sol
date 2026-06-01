// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILiFiRouter} from "../interfaces/ILiFiRouter.sol";

/// @title MockLiFiRouter
/// @notice MOCK LI.FI router for Somnia testnet — LI.FI does not support testnets (docs.li.fi/sdk/testing-integration)
/// @dev On mainnet, LiFiAdapter is deployed pointing at LI.FI's real LiFiDiamond router.
///      This mock demonstrates the integration pattern; actual cross-chain swaps occur only on mainnet.
contract MockLiFiRouter is ILiFiRouter {
    enum BridgeStatus {
        Pending,
        Simulated
    }

    struct BridgeRequest {
        address sender;
        uint256 amount;
        uint32 destinationChain;
        address destinationAsset;
        address destinationRecipient;
        uint64 timestamp;
        BridgeStatus status;
    }

    uint256 public bridgeRequestCount;
    mapping(uint256 => BridgeRequest) public requests;

    event MockBridgeRequest(
        uint256 indexed id,
        address indexed sender,
        uint256 amount,
        uint32 destinationChain,
        address destinationAsset,
        address destinationRecipient
    );

    /// @notice Simulates LI.FI native bridge entrypoint
    function startBridgeTokensViaBridge(ILiFiRouter.BridgeData calldata bridgeData, bytes calldata) external payable {
        uint256 id = ++bridgeRequestCount;
        requests[id] = BridgeRequest({
            sender: msg.sender,
            amount: msg.value,
            destinationChain: uint32(bridgeData.destinationChainId),
            destinationAsset: bridgeData.sendingAssetId,
            destinationRecipient: bridgeData.receiver,
            timestamp: uint64(block.timestamp),
            status: BridgeStatus.Simulated
        });

        emit MockBridgeRequest(
            id,
            msg.sender,
            msg.value,
            uint32(bridgeData.destinationChainId),
            bridgeData.sendingAssetId,
            bridgeData.receiver
        );
    }

    function getRequest(uint256 id) external view returns (BridgeRequest memory) {
        return requests[id];
    }

    function totalRequests() external view returns (uint256) {
        return bridgeRequestCount;
    }

    receive() external payable {}
}

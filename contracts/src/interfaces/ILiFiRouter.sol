// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal LI.FI bridge interface — pattern from docs.li.fi BridgeData + facet entrypoint
/// @dev Assumption: native-token bridge via startBridgeTokensViaBridge(BridgeData, bytes).
///      On mainnet, router = LiFiDiamond; bridge-specific bytes are facet-dependent.
///      Refine when integrating against live LI.FI on Somnia mainnet.
interface ILiFiRouter {
    struct BridgeData {
        bytes32 transactionId;
        string bridge;
        string integrator;
        string referrer;
        address sendingAssetId;
        address receiver;
        uint256 minAmount;
        uint256 destinationChainId;
        bool hasSourceSwaps;
        bool hasDestinationCall;
    }

    function startBridgeTokensViaBridge(BridgeData calldata bridgeData, bytes calldata bridgeSpecificData)
        external
        payable;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILiFiRouter} from "./interfaces/ILiFiRouter.sol";
import {ILiFiAdapter} from "./interfaces/ILiFiAdapter.sol";

/// @title LiFiAdapter
/// @notice Thin wrapper around a configurable LI.FI router (LiFiDiamond on mainnet, MockLiFiRouter on testnet)
/// @dev Uses ILiFiRouter.startBridgeTokensViaBridge with BridgeData per docs.li.fi/concepts/bridge-data
contract LiFiAdapter is ILiFiAdapter {
    address public immutable router;
    string public constant INTEGRATOR = "oracle-arena";

    constructor(address router_) {
        if (router_ == address(0)) revert BridgeFailed(address(0), "");
        router = router_;
    }

    /// @inheritdoc ILiFiAdapter
    function initiateBridge(
        address resolver,
        uint32 destinationChain,
        address destinationAsset,
        address destinationRecipient
    ) external payable {
        if (msg.value == 0) revert ZeroAmount();

        ILiFiRouter.BridgeData memory bridgeData = ILiFiRouter.BridgeData({
            transactionId: keccak256(abi.encodePacked(resolver, block.timestamp, msg.value, destinationChain)),
            bridge: "mock",
            integrator: INTEGRATOR,
            referrer: "",
            sendingAssetId: address(0),
            receiver: destinationRecipient,
            minAmount: msg.value,
            destinationChainId: destinationChain,
            hasSourceSwaps: false,
            hasDestinationCall: false
        });

        (bool ok, bytes memory revertData) =
            router.call{value: msg.value}(abi.encodeWithSelector(ILiFiRouter.startBridgeTokensViaBridge.selector, bridgeData, bytes("")));

        if (!ok) revert BridgeFailed(router, revertData);

        emit BridgeInitiated(resolver, destinationChain, destinationAsset, destinationRecipient, msg.value);
    }

    function getRouter() external view returns (address) {
        return router;
    }
}

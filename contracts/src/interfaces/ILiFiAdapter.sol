// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Cross-chain payout routing via configurable LI.FI router (mainnet) or MockLiFiRouter (testnet)
interface ILiFiAdapter {
    event BridgeInitiated(
        address indexed resolver,
        uint32 destinationChain,
        address destinationAsset,
        address destinationRecipient,
        uint256 amount
    );

    error BridgeFailed(address router, bytes revertData);
    error ZeroAmount();

    function initiateBridge(
        address resolver,
        uint32 destinationChain,
        address destinationAsset,
        address destinationRecipient
    ) external payable;

    function getRouter() external view returns (address);
}

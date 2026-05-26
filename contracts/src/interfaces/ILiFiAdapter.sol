// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// TODO: Verify LI.FI Somnia integration before implementation — confirm whether to call LI.FI router
// directly or via a custom adapter pattern.

/// @title ILiFiAdapter
/// @notice Cross-chain payout routing (MVP: outbound STT on Somnia → USDC on Base)
interface ILiFiAdapter {
    /// @notice Payout route quote for cross-chain settlement
    /// @param amount Source amount in STT (wei)
    /// @param destinationChainId Target chain ID (e.g. 8453 for Base)
    /// @param destinationAsset Target asset address on destination chain
    /// @return expectedAmount Expected destination amount (implementation-defined)
    /// @return routeData Opaque route calldata for LI.FI (verify format before implementation)
    function quotePayoutRoute(uint256 amount, uint256 destinationChainId, address destinationAsset)
        external
        view
        returns (uint256 expectedAmount, bytes memory routeData);

    /// @notice Initiate cross-chain payout to a resolver's preferred chain/asset
    /// @param recipient Resolver payout address on destination chain
    /// @param amount Source amount in STT (wei)
    /// @param destinationChainId Target chain ID
    /// @param destinationAsset Target asset address
    /// @param routeData Route calldata from quotePayoutRoute
    function initiatePayout(
        address recipient,
        uint256 amount,
        uint256 destinationChainId,
        address destinationAsset,
        bytes calldata routeData
    ) external payable;

    error RouteNotSupported();
    error PayoutFailed();
    error OnlySettlement();
}

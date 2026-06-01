// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Cross-chain payout forwarder — queues STT and routes via LiFiAdapter
interface ISettlement {
    event PayoutQueued(uint256 indexed bountyId, address indexed resolver, uint256 amount, uint64 queuedAt);
    event PayoutForwarded(
        uint256 indexed bountyId,
        address indexed resolver,
        uint256 amount,
        uint32 destinationChain,
        address destinationAsset
    );
    event PayoutRescued(uint256 indexed bountyId, address indexed resolver, uint256 amount, address operator);

    error NotConsensusEngine(address caller, address expected);
    error NotBountyBoard(address caller, address expected);
    error AmountMismatch(uint256 expected, uint256 received);
    error NoPendingForward(uint256 bountyId, address resolver);
    error UnexpectedNativePreference(address resolver);
    error RescueTooEarly(uint256 bountyId, address resolver, uint64 readyAt, uint64 currentTime);
    error RescueDelayNotElapsed(uint64 readyAt, uint64 currentTime);
    error TransferFailed(address recipient, uint256 amount);

    function queuePayout(uint256 bountyId, address resolver, uint256 amount) external payable;

    function forwardPayout(uint256 bountyId, address resolver) external;

    function rescuePayout(uint256 bountyId, address resolver) external;

    function getPendingForward(uint256 bountyId, address resolver) external view returns (uint256);

    function getQueuedAt(uint256 bountyId, address resolver) external view returns (uint64);
}

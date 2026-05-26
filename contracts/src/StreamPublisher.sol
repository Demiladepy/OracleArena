// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IStreamPublisher} from "./interfaces/IStreamPublisher.sol";

/// @title StreamPublisher
/// @notice Consumes canonical contract events and emits SDS-formatted output
/// @dev Implementation TODO — verify SDS contract-level integration model first
abstract contract StreamPublisher is IStreamPublisher {
    // TODO: implement publishLeaderboardUpdate, publishRaceViewUpdate, publishReceipt
}

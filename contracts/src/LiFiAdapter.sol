// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILiFiAdapter} from "./interfaces/ILiFiAdapter.sol";

/// @title LiFiAdapter
/// @notice Outbound cross-chain payout routing (MVP: STT Somnia → USDC Base)
/// @dev Implementation TODO — verify LI.FI Somnia integration before implementing
abstract contract LiFiAdapter is ILiFiAdapter {
    // TODO: implement quotePayoutRoute, initiatePayout

    }

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Resolver cross-chain payout preferences (separate from ResolverRegistry agent lifecycle)
interface IResolverPayoutPrefs {
    enum PayoutMode {
        SomniaNative,
        CrossChain
    }

    struct PayoutPref {
        uint8 mode;
        uint32 destinationChain;
        address destinationAsset;
        address destinationRecipient;
    }

    event PreferenceSet(address indexed agent, PayoutPref pref);
    event PreferenceCleared(address indexed agent);

    error NotOperator(address caller, address expected);
    error InvalidMode(uint8 mode);

    function setPreference(address agent, PayoutPref calldata pref) external;

    function clearPreference(address agent) external;

    function getPreference(address agent) external view returns (PayoutPref memory);
}

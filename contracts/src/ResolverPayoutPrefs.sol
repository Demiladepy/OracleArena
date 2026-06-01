// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolverRegistry} from "./interfaces/IResolverRegistry.sol";
import {IResolverPayoutPrefs} from "./interfaces/IResolverPayoutPrefs.sol";

/// @title ResolverPayoutPrefs
/// @notice Operator-controlled payout preferences per resolver agent (separate from ResolverRegistry)
contract ResolverPayoutPrefs is IResolverPayoutPrefs {
    IResolverRegistry public immutable registry;

    mapping(address => PayoutPref) internal _preferences;
    mapping(address => bool) internal _hasPreference;

    constructor(address registry_) {
        if (registry_ == address(0)) revert NotOperator(address(0), address(0));
        registry = IResolverRegistry(registry_);
    }

    function setPreference(address agent, PayoutPref calldata pref) external {
        _requireOperator(agent);
        if (pref.mode > uint8(PayoutMode.CrossChain)) revert InvalidMode(pref.mode);

        _preferences[agent] = pref;
        _hasPreference[agent] = true;
        emit PreferenceSet(agent, pref);
    }

    function clearPreference(address agent) external {
        _requireOperator(agent);
        delete _preferences[agent];
        _hasPreference[agent] = false;
        emit PreferenceCleared(agent);
    }

    function getPreference(address agent) external view returns (PayoutPref memory) {
        if (!_hasPreference[agent]) {
            return PayoutPref({
                mode: uint8(PayoutMode.SomniaNative),
                destinationChain: 0,
                destinationAsset: address(0),
                destinationRecipient: address(0)
            });
        }
        return _preferences[agent];
    }

    function _requireOperator(address agent) internal view {
        IResolverRegistry.Agent memory agentRecord = registry.getAgent(agent);
        if (agentRecord.operator != msg.sender) {
            revert NotOperator(msg.sender, agentRecord.operator);
        }
    }
}

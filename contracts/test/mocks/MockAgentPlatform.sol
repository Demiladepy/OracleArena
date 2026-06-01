// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    IAgentRequester,
    IAgentRequesterHandler,
    Request,
    Response,
    ResponseStatus,
    ConsensusType
} from "../../src/interfaces/IAgentRequester.sol";

/// @notice Minimal platform mock for ResolverAgent tests
contract MockAgentPlatform is IAgentRequester {
    uint256 public requestDeposit = 0.03 ether;
    uint256 internal _nextRequestId = 1;

    struct StoredRequest {
        address callbackAddress;
        bytes4 callbackSelector;
        bytes payload;
    }

    mapping(uint256 => StoredRequest) internal _requests;

    function setRequestDeposit(uint256 deposit) external {
        requestDeposit = deposit;
    }

    function createRequest(uint256, address callbackAddress, bytes4 callbackSelector, bytes calldata payload)
        external
        payable
        returns (uint256 requestId)
    {
        requestId = _nextRequestId++;
        _requests[requestId] =
            StoredRequest({callbackAddress: callbackAddress, callbackSelector: callbackSelector, payload: payload});
    }

    function simulateCallback(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory details
    ) external {
        StoredRequest memory stored = _requests[requestId];
        (bool ok,) = stored.callbackAddress
            .call(abi.encodeWithSelector(stored.callbackSelector, requestId, responses, status, details));
        require(ok, "callback failed");
    }

    function getRequestDeposit() external view returns (uint256) {
        return requestDeposit;
    }

    function createAdvancedRequest(uint256, address, bytes4, bytes calldata, uint256, uint256, ConsensusType, uint256)
        external
        payable
        returns (uint256)
    {
        revert("not implemented");
    }

    function getRequest(uint256) external pure returns (Request memory) {
        revert("not implemented");
    }

    function hasRequest(uint256 requestId) external view returns (bool) {
        return requestId < _nextRequestId;
    }

    function getAdvancedRequestDeposit(uint256) external view returns (uint256) {
        return requestDeposit;
    }
}

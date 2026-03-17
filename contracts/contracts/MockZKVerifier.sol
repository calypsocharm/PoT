// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockZKVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external pure returns (bool) {
        // Just return true for mock test
        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./BulletIDOPrivate.sol";

contract BulletIDOPrivateRefund is Ownable {
    using Address for address payable;

    mapping(address => bool) public userRefund;
    BulletIDOPrivate private idoContract;

    constructor(address _idoAddress) {
        idoContract = BulletIDOPrivate(_idoAddress);
    }

    function getUserAmount(address _user) external view returns (uint256, bool){
        return idoContract.userInfo(_user);
    }
}
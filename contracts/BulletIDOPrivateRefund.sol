// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./BulletIDOPrivate.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BulletIDOPrivateRefund is Ownable, ReentrancyGuard {
    using Address for address payable;

    mapping(address => bool) public userRefund;
    BulletIDOPrivate private idoContract;

    constructor(address _idoAddress) {
        idoContract = BulletIDOPrivate(_idoAddress);
    }

    function getUserAmount(address _user) external view returns (uint256, bool){
        return idoContract.userInfo(_user);
    }

    receive() external payable {}

    function claimRefund() public nonReentrant {
        (uint256 amount, bool status) = idoContract.userInfo(msg.sender);
        require(amount > 0, 'zero amount');
        require(userRefund[msg.sender] == false, 'already claim');

        payable(msg.sender).sendValue(amount);
        userRefund[msg.sender] = true;
    }
}
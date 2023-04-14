// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BulletIDOPrivate is Ownable, ReentrancyGuard {
    using Address for address payable;
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    enum Stage {
        None,
        Sale,
        Harvest,
        End
    }

    struct UserInfo {
        uint256 amount; // eth amount provided by user
        bool harvested;
    }

    IERC20 public token;

    bytes32 public merkleRoot;
    address public withdrawAddress;
    uint256 public raisingAmount;
    uint256 public offeringAmount;
    uint256 public totalAmount;
    uint256 public depositLimit; // deposit limit per wallet

    uint256 public startSaleTime;
    uint256 public endSaleTime;
    uint256 public startHarvestTime;
    uint256 public endHarvestTime;

    mapping(address => UserInfo) public userInfo;

    event Deposit(address user, uint256 amount);
    event Harvest(address user, uint256 tokenAmount, uint256 refundAmount);

    constructor(address _token) {
        token = IERC20(_token);
        offeringAmount = 500_000 * 10**18;
        raisingAmount = 5640 * 10**16;
    }

    function setSaleTime(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_startTime < _endTime, "time: start gt end");
        startSaleTime = _startTime;
        endSaleTime = _endTime;
    }

    function setHarvestTime(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_startTime < _endTime, "time: start gt end");
        startHarvestTime = _startTime;
        endHarvestTime = _endTime;
    }

    function setRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function verify(bytes32[] memory _proof) external view returns(bool) {
        return _verify(msg.sender, _proof);
    }

    function _verify(address _user, bytes32[] memory _proof) internal view returns(bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_user));
        return MerkleProof.verify(_proof, merkleRoot, leaf);
    }

    function stage() public view returns(Stage) {
        if (
            startSaleTime == 0 ||
            endSaleTime == 0 ||
            startHarvestTime == 0 ||
            endHarvestTime == 0
        ) {
            return Stage.None;
        }

        if(block.timestamp > endSaleTime && block.timestamp > endHarvestTime) {
            return Stage.End;
        }

        if(block.timestamp > startSaleTime && block.timestamp < endSaleTime) {
            return Stage.Sale;
        }

        if(block.timestamp > startHarvestTime && block.timestamp < endHarvestTime) {
            return Stage.Harvest;
        }

        return Stage.None;
    }

    function deposit(bytes32[] memory _proof) external payable {
        uint256 amount = msg.value;
        UserInfo storage user = userInfo[msg.sender];
        require(stage() == Stage.Sale, "stage: not sale");
        require(amount > 0, "amount: zero");
        require(_verify(msg.sender, _proof), "not in whitelist");

        if(depositLimit > 0) {
            require(user.amount + amount <= depositLimit, "deposit: exceed limit");
        }
        user.amount = user.amount.add(amount);
        totalAmount = totalAmount.add(amount);
        emit Deposit(msg.sender, amount);
    }

    function setDepositLimit(uint256 _amount) external onlyOwner {
        depositLimit = _amount;
    }

    function harvest() public nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(stage() == Stage.Harvest, "stage: not harvest");
        require(user.amount > 0, "user: zero amount");
        require(user.harvested == false, "user: already harvested");
        uint256 offeringTokenAmount = getOfferingAmount(msg.sender);
        uint256 refundingTokenAmount = getRefundingAmount(msg.sender);
        token.safeTransfer(msg.sender, offeringTokenAmount);
        if (refundingTokenAmount > 0) {
            payable(msg.sender).sendValue(refundingTokenAmount);
        }
        user.harvested = true;
        emit Harvest(msg.sender, offeringTokenAmount, refundingTokenAmount);
    }

    function hasHarvest(address _user) external view returns(bool) {
        UserInfo memory user = userInfo[_user];
        return user.harvested;
    }

    // percentage calculation use 6 decimal
    // make sure to div(1e6) after use value from this function
    // 100000 mean 0.1(10%)
    // 1 mean 0.000001(0.0001%)
    // 1000000 mean 1(100%)
    function getUserAllocation(address _user) public view returns(uint256) {
        UserInfo memory user = userInfo[_user];
        return user.amount.mul(1e12).div(totalAmount).div(1e6);
    }

    function getOfferingAmount(address _user) public view returns(uint256) {
        UserInfo memory user = userInfo[_user];
        if (totalAmount > raisingAmount) {
            uint256 allocation = getUserAllocation(_user);
            return offeringAmount.mul(allocation).div(1e6);
        }
        return user.amount.mul(tokenPerEth());
    }

    function tokenPerEth() public view returns(uint256) {
        return offeringAmount.div(raisingAmount);
    }

    function getRefundingAmount(address _user) public view returns(uint256) {
        if (totalAmount <= raisingAmount) {
            return 0;
        }
        UserInfo memory user = userInfo[_user];
        uint256 allocation = getUserAllocation(_user);
        uint256 payAmount = raisingAmount.mul(allocation).div(1e6);
        return user.amount.sub(payAmount);
    }

    function setWithdrawAddress(address _withdrawAddress) external onlyOwner {
        withdrawAddress = _withdrawAddress;
    }

    function withdraw() external onlyOwner {
        require(withdrawAddress != address(0), "withdraw: zero address");
        require(stage() == Stage.End, "stage: not end");
        payable(msg.sender).sendValue(address(this).balance);
    }

    function withdrawToken() external onlyOwner {
        require(withdrawAddress != address(0), "withdraw: zero address");
        require(stage() == Stage.End, "stage: not end");
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }
}
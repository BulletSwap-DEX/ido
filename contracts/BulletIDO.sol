// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract BulletIDO is Ownable {
    using Address for address payable;
    enum Stage {
        None,
        Private,
        Public
    }

    bytes32 public root;
    address public token;
    Stage public stage;
    mapping(address => uint256) private boughtAmountPrivate;
    uint256 public maxBuyPrivate;
    uint256 public minBuyPrivate;
    uint256 private tokenPerEtherPrivate;
    mapping(address => uint256) private boughtAmountPublic;
    uint256 public maxBuyPublic;
    uint256 public minBuyPublic;
    uint256 private tokenPerEtherPublic;

    constructor(address _token) {
      token = _token;
    }

    function privateSale(bytes32[] memory proof) external payable {
      require(stage == Stage.Private, "stage: not private");
      require(_verify(msg.sender, proof), "not in whitelist");
      uint256 tokenAmount = msg.value * tokenPerEther();
      require(boughtAmountPrivate[msg.sender] + msg.value <= maxBuyPrivate, "limit: exceed max");
      require(msg.value > minBuyPrivate, "limit: below min");
      require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "token not available");

      IERC20(token).transfer(msg.sender, tokenAmount);
      boughtAmountPrivate[msg.sender] += msg.value;
    }

    function setTokenPerEtherPrivate(uint256 value) external onlyOwner {
      tokenPerEtherPrivate = value;
    }

    function setMaxBuyPrivate(uint256 amount) external onlyOwner {
      maxBuyPrivate = amount;
    }

    function setMinBuyPrivate(uint256 amount) external onlyOwner {
      minBuyPrivate = amount;
    }

    function publicSale() external payable {
      require(stage == Stage.Public, "stage: not public");
      uint256 tokenAmount = msg.value * tokenPerEther();
      require(boughtAmountPublic[msg.sender] + msg.value <= maxBuyPublic, "limit: exceed max");
      require(msg.value > minBuyPublic, "limit: below min");
      require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "token not available");

      IERC20(token).transfer(msg.sender, tokenAmount);
      boughtAmountPublic[msg.sender] += msg.value;
    }

    function setTokenPerEtherPublic(uint256 value) external onlyOwner {
      tokenPerEtherPublic = value;
    }

    function setMaxBuyPublic(uint256 amount) external onlyOwner {
      maxBuyPublic = amount;
    }

    function setMinBuyPublic(uint256 amount) external onlyOwner {
      minBuyPublic = amount;
    }

    function tokenPerEther() public view returns(uint256) {
      if (stage == Stage.Private) {
        return tokenPerEtherPrivate;
      }
      if (stage == Stage.Public) {
        return tokenPerEtherPublic;
      }

      return 0;
    }

    function setStage(Stage _stage) external onlyOwner {
      stage = _stage;
    }

    function setRoot(bytes32 _root) external onlyOwner {
        root = _root;
    }

    function verify(bytes32[] memory proof) external view returns (bool) {
        return _verify(msg.sender, proof);
    }

    function _verify(address user, bytes32[] memory proof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user));
        return MerkleProof.verify(proof, root, leaf);
    }

    function withdraw() external onlyOwner {
      payable(msg.sender).sendValue(address(this).balance);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function mint() external {
    _mint(msg.sender, 10 * (10 ** decimals()));
  }

  function decimals() public view virtual override returns (uint8) {
    return 6;
  }
}
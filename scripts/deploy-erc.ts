import {ethers} from "hardhat";

async function main() {
  const ERC = await ethers.getContractFactory("BulletERC20");
  const erc = await ERC.deploy("TestB", "TSTB", '10000000');
  await erc.deployed();

  console.log("ERC20 deployed to:", erc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})
import {ethers} from "hardhat";

async function main() {
  const ERC = await ethers.getContractFactory("BulletERC20");
  const erc = await ERC.deploy("Bullets", "BLT", ethers.utils.parseEther((10_000_000).toString()));
  await erc.deployed();

  console.log("ERC20 deployed to:", erc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})
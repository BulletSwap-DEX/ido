import {ethers} from "hardhat";
import { mumbai } from "../address";

async function main() {
  const IDO = await ethers.getContractFactory("BulletIDOPrivate");
  const ido = await IDO.deploy(mumbai.ERC20);
  await ido.deployed();

  console.log("IDO deployed to:", ido.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})
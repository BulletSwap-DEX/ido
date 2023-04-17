import {ethers} from "hardhat";

async function main() {
  const IDO = await ethers.getContractFactory("BulletIDOPrivate");
  const ido = await IDO.deploy('0xcBbd42BE0f69C786ED5C386e9eeE8cBDCE31E9E3');
  await ido.deployed();

  console.log("IDO deployed to:", ido.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})
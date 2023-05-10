import {utils, Wallet} from "zksync-web3";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {Deployer} from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";
import {ethers} from "hardhat";

dotenv.config()
export default async function(hre: HardhatRuntimeEnvironment) {
  console.log("Running deploy script");
  const wallet = new Wallet(process.env.ZKSYNC_PK as string);
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("BulletERC20");
  const contract = await deployer.deploy(artifact, ["Bullets", "BLT", ethers.utils.parseEther((10_000_000).toString())]);
  console.log("deployed to:", contract.address);
}
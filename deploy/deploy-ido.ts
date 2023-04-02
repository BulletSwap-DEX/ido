import {utils, Wallet} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

dotenv.config()
export default async function(hre: HardhatRuntimeEnvironment) {
  console.log("Running deploy script");
  const wallet = new Wallet(process.env.ZKSYNC_PK as string);
  const erc20Address = '0x3d136d7dA30e9Bd5ddc516f1d4e7A3881b11A2c5';
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("BulletIDO");
  const contract = await deployer.deploy(artifact, [erc20Address]);
  console.log('deployed to:', contract.address);
}
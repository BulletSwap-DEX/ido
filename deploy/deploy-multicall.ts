import {utils, Wallet} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

dotenv.config()
export default async function(hre: HardhatRuntimeEnvironment) {
  console.log("Running deploy script");
  const wallet = new Wallet(process.env.ZKSYNC_PK as string);
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Multicall");
  const contract = await deployer.deploy(artifact);
  console.log('deployed to:', contract.address);
}
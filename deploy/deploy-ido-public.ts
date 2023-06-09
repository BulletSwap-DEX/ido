import {Wallet} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";
import {testnet, mainnet} from "../address";

dotenv.config()
export default async function(hre: HardhatRuntimeEnvironment) {
  console.log("Running deploy script: Bullet IDO Public");
  const wallet = new Wallet(process.env.ZKSYNC_PK as string);
  const erc20Address = testnet.ERC20;
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("BulletIDOPublic");
  const contract = await deployer.deploy(artifact, [erc20Address]);
  console.log("deployed to:", contract.address);
}
import {utils, Wallet} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

const erc20Testnet = '0xfe9F89688A666a2Eb1f939e8B138370c44c5273B';
const erc20Mainnet = '0x71fD7DfA7db7094E0f857ad3040f1aFEf76fEf85';

dotenv.config()
export default async function(hre: HardhatRuntimeEnvironment) {
  console.log("Running deploy script");
  const wallet = new Wallet(process.env.ZKSYNC_PK as string);
  const erc20Address = erc20Testnet;
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("BulletIDO");
  const contract = await deployer.deploy(artifact, [erc20Address]);
  console.log('deployed to:', contract.address);
}
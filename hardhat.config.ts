import "@nomicfoundation/hardhat-toolbox";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-chai-matchers";
import "@matterlabs/hardhat-zksync-verify";
import * as dotenv from "dotenv";
dotenv.config();

const config = process.env.ZKSYNC == "true"
  ? {
    solidity: "0.8.17",
    zksolc: {
      version: "1.3.5",
      compilerSource: "binary",
      settings: {},
    },
    defaultNetwork: "zkSyncTestnet",
    networks: {
      zkSyncTestnet : {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification'
      }
    },
    etherscan: {
      apikey: process.env.ETHERSCAN_KEY
    }
  }
  : {
    solidity: "0.8.17",
  }

export default config;

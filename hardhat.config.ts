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
        url: "https://testnet.era.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification'
      },
      zkSyncMainnet : {
        url: "https://mainnet.era.zksync.io",
        ethNetwork: "mainnet",
        zksync: true,
        verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification"
      },
      local: {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    },
  }
  : {
    solidity: "0.8.17",
    networks: {
      mumbai: {
        url: process.env.POLYGON_URL || "",
        accounts: [process.env.ZKSYNC_PK] || ""
      }
    },
    etherscan: {
      apiKey: {
        polygonMumbai: process.env.POLYGONSCAN_KEY || ''
      }
    }
  }

export default config;

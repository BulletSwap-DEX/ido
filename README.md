# ZKSYNC

## how to deploy
make sure script are in `deploy` folder
```bash
npx hardhat deploy-zksync --script <script-name>
```

## how to verify
```bash
npx hardhat verify --network zkSyncTestnet <contract-address> <arguments>
```
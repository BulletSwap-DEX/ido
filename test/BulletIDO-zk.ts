import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "hardhat";
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const accountsPK = [
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110",
  "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3",
  "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e"
]
const provider = Provider.getDefaultProvider();
const accounts = accountsPK.map(user => {
  return new Wallet(user, provider)
})
const [owner, user1, user2] = accounts;

async function deployFixture() {
  const deployer = new Deployer(hre, owner);
  const artifactERC = await deployer.loadArtifact("BulletERC20");
  const bulletERC = await deployer.deploy(artifactERC, ["Bullet", "BLT", ethers.utils.parseEther((10_000_000).toString())]);
  const artifactIDO = await deployer.loadArtifact("BulletIDO");
  const bulletIDO = await deployer.deploy(artifactIDO, [bulletERC.address]);

  const mintTx = await bulletERC.mint(bulletIDO.address, ethers.utils.parseEther("1000"));
  await mintTx.wait();

  const whitelisted = [
    owner.address,
    user1.address
  ]
  const leafNode = whitelisted.map(addr => keccak256(addr));
  const merkleTree = new MerkleTree(leafNode, keccak256, {sortPairs: true});
  const setRootTx = await bulletIDO.setRoot('0x' + merkleTree.getRoot().toString('hex'));
  await setRootTx.wait();

  return {bulletERC, bulletIDO, merkleTree, leafNode};
}

describe("Deployment", function() {
  it("Should verify whitelisted", async function() {
    const {bulletIDO, merkleTree, leafNode} = await deployFixture();

    expect(await bulletIDO.connect(user1).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(true);
    expect(await bulletIDO.connect(user2).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(false);
  })

  it("Should private sale", async function() {
    const { bulletERC, bulletIDO, merkleTree, leafNode } = await deployFixture();
    const setStageTx = await bulletIDO.setStage(1);
    await setStageTx.wait();
    const setMinMaxBuyTx = await bulletIDO.setMinMaxBuyPrivate([ethers.utils.parseEther('0.1'), ethers.utils.parseEther("1")]);
    await setMinMaxBuyTx.wait();
    const setTokenPerEtherTx = await bulletIDO.setTokenPerEtherPrivate(10);
    await setTokenPerEtherTx.wait();
    const privateSaleTx = await bulletIDO.connect(user1).privateSale(merkleTree.getHexProof(leafNode[1]), {value: ethers.utils.parseEther('0.2')});
    await privateSaleTx.wait();
    expect(ethers.utils.formatEther(await bulletERC.balanceOf(bulletIDO.address))).to.equal('998.0');
  })

  it("Should public sale", async function() {
    const { bulletERC, bulletIDO, merkleTree, leafNode } = await deployFixture();
    const setStageTx = await bulletIDO.setStage(2);
    await setStageTx.wait();
    const setMinMaxBuyTx = await bulletIDO.setMinMaxBuyPublic([ethers.utils.parseEther('0.1'), ethers.utils.parseEther("1")]);
    await setMinMaxBuyTx.wait();
    const setTokenPerEtherTx = await bulletIDO.setTokenPerEtherPublic(10);
    await setTokenPerEtherTx.wait();
    const publicSaleTx = await bulletIDO.connect(user1).publicSale({value: ethers.utils.parseEther('0.2')});
    await publicSaleTx.wait();

    expect(ethers.utils.formatEther(await bulletERC.balanceOf(bulletIDO.address))).to.equal('998.0');
  })

  it("Should withdraw", async function() {
    const { bulletIDO } = await deployFixture();
    const setStageTx = await bulletIDO.setStage(2);
    await setStageTx.wait();
    const setMinMaxBuyTx = await bulletIDO.setMinMaxBuyPublic([ethers.utils.parseEther('0.1'), ethers.utils.parseEther("1")]);
    await setMinMaxBuyTx.wait();
    const setTokenPerEtherTx = await bulletIDO.setTokenPerEtherPublic(10);
    await setTokenPerEtherTx.wait();
    const publicSaleTx = await bulletIDO.connect(user1).publicSale({value: ethers.utils.parseEther('0.2')});
    await publicSaleTx.wait();
    expect(await bulletIDO.provider.getBalance(bulletIDO.address)).to.equal(ethers.utils.parseEther('0.2'));
    const setWdAddressTx = await bulletIDO.setWithdrawAddress(owner.address);
    await setWdAddressTx.wait();
    const withdrawTx = await bulletIDO.withdraw();
    await withdrawTx.wait();
    expect(await bulletIDO.provider.getBalance(bulletIDO.address)).to.equal(0);
  })
})
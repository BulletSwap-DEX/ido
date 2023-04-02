import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("IDO", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const BulletERC20 = await ethers.getContractFactory("BulletERC20");
    const bulletERC = await BulletERC20.deploy("Bullet", "BLT");
    const BulletIDO = await ethers.getContractFactory("BulletIDO");
    const bulletIDO = await BulletIDO.deploy(bulletERC.address);
    await bulletERC.mint(bulletIDO.address, ethers.utils.parseEther("1000"));
    let whitelisted = [
      owner.address,
      user1.address,
    ];
    const leafNode = whitelisted.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNode, keccak256, {sortPairs: true});
    await bulletIDO.setRoot('0x' + merkleTree.getRoot().toString('hex'));

    return { bulletERC, bulletIDO, merkleTree, leafNode, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should verify whitelisted", async function () {
      const {bulletIDO, merkleTree, leafNode, user1, user2} = await loadFixture(deployFixture);

      expect(await bulletIDO.connect(user1).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(true);
      expect(await bulletIDO.connect(user2).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(false);
    })

    it("Should private sale", async function () {
      const { bulletERC, bulletIDO, merkleTree, leafNode, user1 } = await loadFixture(deployFixture);
      await bulletIDO.setStage(1);
      await bulletIDO.setMaxBuyPrivate(ethers.utils.parseEther("1"));
      await bulletIDO.setMinBuyPrivate(ethers.utils.parseEther("0.1"));
      await bulletIDO.setTokenPerEtherPrivate(10);
      await bulletIDO.connect(user1).privateSale(merkleTree.getHexProof(leafNode[1]),{value: ethers.utils.parseEther('0.2')});

      expect(ethers.utils.formatEther(await bulletERC.balanceOf(bulletIDO.address))).to.equal('998.0');
      expect(ethers.utils.formatEther(await bulletIDO.provider.getBalance(bulletIDO.address))).to.equal('0.2');
      expect(ethers.utils.formatEther(await bulletERC.balanceOf(user1.address))).to.equal('2.0')
      await expect(bulletIDO.connect(user1).privateSale(
        merkleTree.getHexProof(leafNode[1]),
        {value: ethers.utils.parseEther('0.81')}
      )).to.be.rejectedWith("limit: exceed max");
    })

    it("Should public sale", async function () {
      const { bulletERC, bulletIDO, user1 } = await loadFixture(deployFixture);
      await bulletIDO.setStage(2);
      await bulletIDO.setMaxBuyPublic(ethers.utils.parseEther("1.5"));
      await bulletIDO.setMinBuyPublic(ethers.utils.parseEther("0.2"));
      await bulletIDO.setTokenPerEtherPublic(5);
      await bulletIDO.connect(user1).publicSale({value: ethers.utils.parseEther('0.5')});

      expect(ethers.utils.formatEther(await bulletERC.balanceOf(bulletIDO.address))).to.equal('997.5');
      expect(ethers.utils.formatEther(await bulletIDO.provider.getBalance(bulletIDO.address))).to.equal('0.5');
      expect(ethers.utils.formatEther(await bulletERC.balanceOf(user1.address))).to.equal('2.5');
      await expect(bulletIDO.connect(user1).publicSale(
        {value: ethers.utils.parseEther('1.51')}
      )).to.be.rejectedWith("limit: exceed max");
    })

    it("Should withdraw", async function () {
      const { bulletIDO, user1 } = await loadFixture(deployFixture);
      await bulletIDO.setStage(2);
      await bulletIDO.setMaxBuyPublic(ethers.utils.parseEther("2.1"));
      await bulletIDO.setMinBuyPublic(ethers.utils.parseEther("0.2"));
      await bulletIDO.setTokenPerEtherPublic(1);
      await bulletIDO.connect(user1).publicSale({value: ethers.utils.parseEther('2.0')});
      await expect(bulletIDO.connect(user1).withdraw()).to.be.rejectedWith('Ownable: caller is not the owner');
      expect(ethers.utils.formatEther(await bulletIDO.provider.getBalance(bulletIDO.address))).to.equal('2.0');
      await bulletIDO.withdraw();
      expect(ethers.utils.formatEther(await bulletIDO.provider.getBalance(bulletIDO.address))).to.equal('0.0');
    })
  })
})
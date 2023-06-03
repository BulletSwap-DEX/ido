import { ethers } from "hardhat"
import keccak256 from "keccak256";
const { MerkleTree } = require("merkletreejs");
import {time, loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";

describe("IDO Private", function () {
  async function deployFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    const BulletERC20 = await ethers.getContractFactory("BulletERC20");
    const bulletERC20 = await BulletERC20.deploy("Bullet", "BLT", ethers.utils.parseEther((10_000_000).toString()));
    const BulletIDO = await ethers.getContractFactory("BulletIDOPrivate");
    const bulletIDO = await BulletIDO.deploy(bulletERC20.address);
    await bulletERC20.mint(bulletIDO.address, ethers.utils.parseEther((500_000).toString()));
    let whitelisted = [
      owner.address,
      user1.address,
      user3.address
    ];
    const leafNode = whitelisted.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNode, keccak256, {sortPairs: true});
    await bulletIDO.setRoot('0x' + merkleTree.getRoot().toString('hex'));
    const BulletRefund = await ethers.getContractFactory("BulletIDOPrivateRefund");
    const bulletRefund = await BulletRefund.deploy(bulletIDO.address);

    const ONE_DAY = 24 * 60 * 60;
    return {
      bulletERC20,
      bulletIDO,
      bulletRefund,
      merkleTree,
      leafNode,
      owner,
      user1,
      user2,
      user3,
      ONE_DAY,
    };
  }

  describe("Deployment", function () {
    it("Should deposit on correct stage", async function() {
      const {
        bulletIDO,
        bulletRefund,
        user1,
        merkleTree,
        leafNode,
        ONE_DAY
      } = await loadFixture(deployFixture);
      const proof = merkleTree.getHexProof(leafNode[1]);

      const baseTime = await time.latest();
      const startSale = baseTime + ONE_DAY;
      const endSale = baseTime + (2 * ONE_DAY);
      const startHarvest = baseTime + (3 * ONE_DAY);
      const endHarvest = baseTime + (4 * ONE_DAY);
      await bulletIDO.setSaleTime(startSale, endSale);
      await bulletIDO.setHarvestTime(startHarvest, endHarvest);

      await time.increaseTo(baseTime + ONE_DAY + 1);
      await expect(
        await bulletIDO
          .connect(user1)
          .deposit(proof, {value: ethers.utils.parseEther('1')})
      ).to
        .emit(bulletIDO, "Deposit")
        .withArgs(
          user1.address,
          ethers.utils.parseEther('1')
        );

      await time.increaseTo(baseTime + (2 * ONE_DAY) + 1);
      await expect(
        bulletIDO.connect(user1)
        .deposit(proof, {value: ethers.utils.parseEther('1')})
      ).to.be.rejectedWith("stage: not sale");

      const amount = await bulletRefund.getUserAmount(user1.address);
      console.log('amount', ethers.utils.formatEther(amount[0]));
    })
  })
})
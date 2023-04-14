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

    const ONE_DAY = 24 * 60 * 60;
    return {
      bulletERC20,
      bulletIDO,
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
    it("Should verify whitelisted", async function () {
      const {bulletIDO, merkleTree, leafNode, user1, user2} = await loadFixture(deployFixture);

      expect(ethers.utils.formatEther(await bulletIDO.offeringAmount())).to.equal('500000.0');
      expect(ethers.utils.formatEther(await bulletIDO.raisingAmount())).to.equal('56.4');
      expect(await bulletIDO.connect(user1).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(true);
      expect(await bulletIDO.connect(user2).verify(merkleTree.getHexProof(leafNode[1]))).to.equal(false);
    })

    it("Should get correct stage", async function () {
      const {
        bulletIDO,
        ONE_DAY
      } = await loadFixture(deployFixture);

      const baseTime = await time.latest();
      const startSale = baseTime + ONE_DAY;
      const endSale = baseTime + (2 * ONE_DAY);
      const startHarvest = baseTime + (3 * ONE_DAY);
      const endHarvest = baseTime + (4 * ONE_DAY);

      expect(await bulletIDO.stage()).to.equal(0);
      await bulletIDO.setSaleTime(startSale, endSale);
      await bulletIDO.setHarvestTime(startHarvest, endHarvest);

      // time when sale started
      await time.increaseTo(baseTime + ONE_DAY + 1);
      expect(await bulletIDO.stage()).to.equal(1);

      // time when sale ended
      await time.increaseTo(baseTime + (2 * ONE_DAY) + 1);
      expect(await bulletIDO.stage()).to.equal(0);

      // time when harvest started
      await time.increaseTo(baseTime + (3 * ONE_DAY) + 1);
      expect(await bulletIDO.stage()).to.equal(2);

      // time when harvest ended
      await time.increaseTo(baseTime + (4 * ONE_DAY) + 1);
      expect(await bulletIDO.stage()).to.equal(3);

    })

    it("Should deposit on correct stage", async function() {
      const {
        bulletIDO,
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
    })

    it("Should limit deposit", async function() {
      const {
        bulletIDO,
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
      await bulletIDO.setDepositLimit(ethers.utils.parseEther('2'));

      await time.increaseTo(baseTime + ONE_DAY + 1);
      await bulletIDO.connect(user1).deposit(
        proof,
        {value: ethers.utils.parseEther('1')
      })
      await expect(
        bulletIDO.connect(user1).deposit(
          proof,
          {value: ethers.utils.parseEther('1.1')}
        )
      ).to.be.rejectedWith("deposit: exceed limit");
    })

    it("Should harvest on correct stage - non-overflow", async function() {
      const {
        bulletIDO,
        bulletERC20,
        user1,
        merkleTree,
        leafNode,
        ONE_DAY
      } = await loadFixture(deployFixture);
      const baseTime = await time.latest();
      const startSale = baseTime + ONE_DAY;
      const endSale = baseTime + (2 * ONE_DAY);
      const startHarvest = baseTime + (3 * ONE_DAY);
      const endHarvest = baseTime + (4 * ONE_DAY);
      await bulletIDO.setSaleTime(startSale, endSale);
      await bulletIDO.setHarvestTime(startHarvest, endHarvest);
      await time.increaseTo(baseTime + ONE_DAY + 1);
      await bulletIDO.connect(user1).deposit(
        merkleTree.getHexProof(leafNode[1]),
        {value: ethers.utils.parseEther('1')}
      );
      await time.increaseTo(baseTime + (3*ONE_DAY) + 1);
      await expect(await bulletIDO.connect(user1).harvest())
        .to.emit(bulletIDO, "Harvest")
        .withArgs(
          user1.address,
          ethers.utils.parseEther('8865'),
          0
        );
      expect(await bulletERC20.balanceOf(user1.address))
        .to.equal(ethers.utils.parseEther('8865'));
    });

    it("Should harvest on correct stage - overflow", async function() {
      const {
        bulletIDO,
        bulletERC20,
        user1,
        user3,
        merkleTree,
        leafNode,
        ONE_DAY
      } = await loadFixture(deployFixture);
      const baseTime = await time.latest();
      const startSale = baseTime + ONE_DAY;
      const endSale = baseTime + (2 * ONE_DAY);
      const startHarvest = baseTime + (3 * ONE_DAY);
      const endHarvest = baseTime + (4 * ONE_DAY);
      await bulletIDO.setSaleTime(startSale, endSale);
      await bulletIDO.setHarvestTime(startHarvest, endHarvest);
      await time.increaseTo(baseTime + ONE_DAY + 1);
      await bulletIDO.connect(user1).deposit(
        merkleTree.getHexProof(leafNode[1]),
        {value: ethers.utils.parseEther('1')}
      );
      await bulletIDO.connect(user3).deposit(
        merkleTree.getHexProof(leafNode[2]),
        {value: ethers.utils.parseEther('99')}
      );

      await time.increaseTo(baseTime + (3*ONE_DAY) + 1);
      const refundAmount = (100 - 56.4) * 1 / 100;
      await expect(await bulletIDO.connect(user1).harvest())
        .to.emit(bulletIDO, "Harvest")
        .withArgs(
          user1.address,
          ethers.utils.parseEther('5000'),
          ethers.utils.parseEther(refundAmount.toString())
        );
      expect(await bulletERC20.balanceOf(user1.address))
        .to.equal(ethers.utils.parseEther('5000'));

      await expect(bulletIDO.connect(user1).harvest())
          .to.rejectedWith('user: already harvested');
    })

    it("Should withdraw on correct stage", async function() {
      const {
        bulletIDO,
        bulletERC20,
        owner,
        user1,
        merkleTree,
        leafNode,
        ONE_DAY
      } = await loadFixture(deployFixture);
      const baseTime = await time.latest();
      const startSale = baseTime + ONE_DAY;
      const endSale = baseTime + (2 * ONE_DAY);
      const startHarvest = baseTime + (3 * ONE_DAY);
      const endHarvest = baseTime + (4 * ONE_DAY);
      await bulletIDO.setSaleTime(startSale, endSale);
      await bulletIDO.setHarvestTime(startHarvest, endHarvest);
      await time.increaseTo(baseTime + ONE_DAY + 1);
      await bulletIDO.connect(user1).deposit(
        merkleTree.getHexProof(leafNode[1]),
        {value: ethers.utils.parseEther('1')}
      );
      await time.increaseTo(baseTime + (3*ONE_DAY) + 1);
      await bulletIDO.connect(user1).harvest()

      await bulletIDO.setWithdrawAddress(owner.address);
      await expect(bulletIDO.withdraw()).to.be.rejectedWith('stage: not end');
      await time.increaseTo(baseTime + (4*ONE_DAY) + 1);
      expect(await bulletIDO.provider.getBalance(bulletIDO.address))
        .to.equal(ethers.utils.parseEther('1'));
      await bulletIDO.withdraw();
      expect(await bulletIDO.provider.getBalance(bulletIDO.address))
        .to.equal(0);
      
      expect(await bulletERC20.balanceOf(bulletIDO.address))
        .to.equal(ethers.utils.parseEther((500_000 - 8865).toString()));
      await bulletIDO.withdrawToken();
      expect(await bulletERC20.balanceOf(bulletIDO.address))
        .to.equal(0);
    })
  })
})
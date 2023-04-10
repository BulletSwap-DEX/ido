import { ethers } from "hardhat"
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers"
import {expect} from "chai"

describe("ERC20", function () {
  async function deployFixture() {
    const [owner] = await ethers.getSigners();
    const BulletERC20 = await ethers.getContractFactory("BulletERC20");
    const bulletERC = await BulletERC20.deploy("Bullet", "BLT", ethers.utils.parseEther((10_000_000).toString()));
    return {bulletERC, owner};
  }

  describe("Deployment", function () {
    it("Should mint not exceed cap", async function () {
      const {bulletERC, owner} = await loadFixture(deployFixture);
      await bulletERC.mint(owner.address, ethers.utils.parseEther((10_000_000).toString()));
      expect(await bulletERC.balanceOf(owner.address)).to.equal(ethers.utils.parseEther((10_000_000).toString()));
      await expect(bulletERC.mint(owner.address, 1000)).to.be.rejectedWith('ERC20Capped: cap exceed');
    })

    it("Should not mint or burn on paused", async function () {
      const {bulletERC, owner} = await loadFixture(deployFixture);
      await bulletERC.mint(owner.address, 1000);
      expect(await bulletERC.balanceOf(owner.address)).to.equal(1000);
      await bulletERC.pause();
      await expect(bulletERC.mint(owner.address, 1000)).to.be.rejectedWith('Pausable: paused');
      await expect(bulletERC.burn(1000)).to.be.rejectedWith('Pausable: paused');
      await bulletERC.unpause();
      await bulletERC.burn(1000);
      expect(await bulletERC.balanceOf(owner.address)).to.equal(0);
    })
  })
})
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20Imp", function () {
  // Deploy the contract and set up initial state
  async function deployERC20Fixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ERC20Imp = await ethers.getContractFactory("ERC20Imp");
    const erc20 = await ERC20Imp.deploy("DemoToken", "DTK", ethers.parseEther("1000000"));

    return { erc20, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { erc20 } = await loadFixture(deployERC20Fixture);

      expect(await erc20.name()).to.equal("DemoToken");
      expect(await erc20.symbol()).to.equal("DTK");
    });

    it("Should assign the total supply to the owner", async function () {
      const { erc20, owner } = await loadFixture(deployERC20Fixture);

      const ownerBalance = await erc20.balanceOf(owner.address);
      expect(await erc20.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { erc20, owner, addr1, addr2 } = await loadFixture(deployERC20Fixture);

      // Transfer 100 tokens from owner to addr1
      await erc20.transfer(addr1.address, ethers.parseEther("100"));
      expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));

      // Transfer 50 tokens from addr1 to addr2
      await erc20.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
      expect(await erc20.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const { erc20, owner, addr1 } = await loadFixture(deployERC20Fixture);

      const initialOwnerBalance = await erc20.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner
      await expect(
        erc20.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWith("not enough money");

      // Owner balance shouldn't change
      expect(await erc20.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update allowances after approve", async function () {
      const { erc20, owner, addr1 } = await loadFixture(deployERC20Fixture);

      await erc20.approve(addr1.address, ethers.parseEther("100"));
      expect(await erc20.allowances(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should transfer tokens using transferFrom", async function () {
      const { erc20, owner, addr1, addr2 } = await loadFixture(deployERC20Fixture);

      // Approve addr1 to spend 100 tokens
      await erc20.approve(addr1.address, ethers.parseEther("100"));

      // Transfer 50 tokens from owner to addr2 using addr1
      await erc20.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
      expect(await erc20.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to an account", async function () {
      const { erc20, owner, addr1 } = await loadFixture(deployERC20Fixture);

      // Set addr1 as a minter
      await erc20.setMinter(owner.address, true);

      // Mint 100 tokens to addr1
      await erc20.mint(addr1.address, ethers.parseEther("100"));
      expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if minting exceeds max supply", async function () {
      const { erc20, owner, addr1 } = await loadFixture(deployERC20Fixture);

      // Set addr1 as a minter
      await erc20.setMinter(owner.address, true);

      // Try to mint more than max supply
      await expect(
        erc20.mint(addr1.address, ethers.parseEther("2000000001"))
      ).to.be.revertedWith("max supply exceeded");
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause the contract", async function () {
      const { erc20, owner } = await loadFixture(deployERC20Fixture);

      // Set owner as a pauser
      await erc20.setPauser(owner.address, true);

      // Pause the contract
      await erc20.pause();
      expect(await erc20.paused()).to.equal(true);

      // Unpause the contract
      await erc20.unPause();
      expect(await erc20.paused()).to.equal(false);
    });

    it("Should fail to transfer when paused", async function () {
      const { erc20, owner, addr1 } = await loadFixture(deployERC20Fixture);

      // Set owner as a pauser
      await erc20.setPauser(owner.address, true);

      // Pause the contract
      await erc20.pause();

      // Try to transfer tokens
      await expect(
        erc20.transfer(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Contract is paused");
    });
  });
});
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC721Imp", function () {
  // Deploy the contract and set up initial state
  async function deployERC721Fixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ERC721Imp = await ethers.getContractFactory("ERC721Imp");
    const erc721 = await ERC721Imp.deploy("DemoNFT", "DNFT");

    return { erc721, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { erc721 } = await loadFixture(deployERC721Fixture);

      expect(await erc721.name()).to.equal("DemoNFT");
      expect(await erc721.symbol()).to.equal("DNFT");
    });

    it("Should have zero total supply initially", async function () {
      const { erc721 } = await loadFixture(deployERC721Fixture);

      expect(await erc721.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const { erc721, owner } = await loadFixture(deployERC721Fixture);

      await erc721.mint();
      expect(await erc721.totalSupply()).to.equal(1);
      expect(await erc721.ownerOf(1)).to.equal(owner.address);
      expect(await erc721.balanceOf(owner.address)).to.equal(1);
    });

    it("Should fail if max supply is reached", async function () {
      const { erc721 } = await loadFixture(deployERC721Fixture);

      // Mint up to max supply
      for (let i = 0; i < 100_000; i++) {
        await erc721.mint();
      }

      // Try to mint one more token
      await expect(erc721.mint()).to.be.revertedWith("Max supply reached");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { erc721, owner, addr1 } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Transfer token from owner to addr1
      await erc721.transferFrom(owner.address, addr1.address, tokenId);
      expect(await erc721.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await erc721.balanceOf(owner.address)).to.equal(0);
      expect(await erc721.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should fail if sender is not the owner or approved", async function () {
      const { erc721, owner, addr1, addr2 } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Try to transfer token from owner to addr2 using addr1 (not approved)
      await expect(
        erc721.connect(addr1).transferFrom(owner.address, addr2.address, tokenId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow approved address to transfer token", async function () {
      const { erc721, owner, addr1, addr2 } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Approve addr1 to transfer the token
      await erc721.approve(addr1.address, tokenId);

      // Transfer token from owner to addr2 using addr1
      await erc721.connect(addr1).transferFrom(owner.address, addr2.address, tokenId);
      expect(await erc721.ownerOf(tokenId)).to.equal(addr2.address);
    });
  });

  describe("Approvals", function () {
    it("Should approve an address for a token", async function () {
      const { erc721, owner, addr1 } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Approve addr1 for the token
      await erc721.approve(addr1.address, tokenId);
      expect(await erc721.getApproved(tokenId)).to.equal(addr1.address);
    });

    it("Should fail if approving self", async function () {
      const { erc721, owner } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Try to approve self
      await expect(erc721.approve(owner.address, tokenId)).to.be.revertedWith("Cannot approve self");
    });
  });

  describe("Token URI", function () {
    it("Should return the correct token URI", async function () {
      const { erc721 } = await loadFixture(deployERC721Fixture);

      // Mint a token
      await erc721.mint();
      const tokenId = 1;

      // Check token URI
      expect(await erc721.tokenURI(tokenId)).to.equal("https://metadata.example/1");
    });

    it("Should fail if token does not exist", async function () {
      const { erc721 } = await loadFixture(deployERC721Fixture);

      // Try to get URI for non-existent token
      await expect(erc721.tokenURI(1)).to.be.revertedWith("Token does not exist");
    });
  });
});
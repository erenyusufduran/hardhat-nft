const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFT Unit Tests", function () {
      let basicNft, deployer;

      beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["BasicNft"]);
        basicNft = await ethers.getContract("BasicNft");
      });

      describe("Constructor", () => {
        it("Initialize the NFT correctly.", async function () {
          const name = await basicNft.name();
          const symbol = await basicNft.symbol();
          const tokenCounter = await basicNft.getTokenCounter();
          assert.equal(name, "Dogie");
          assert.equal(symbol, "DOG");
          assert.equal(tokenCounter.toString(), "0");
        });
      });

      describe("Mint NFT", () => {
        it("Allows users to mint an NFT, and updates appropriately", async function () {
          const txResponse = await basicNft.mintNft();
          await txResponse.wait(1);
          const tokenURI = await basicNft.tokenURI(0);
          const tokenCounter = await basicNft.getTokenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await basicNft.TOKEN_URI());
        });
      });
    });

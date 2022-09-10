const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Random IPFS Nft Unit Tests", function () {
      let randomIpfsNft, deployer, vrfCoordinatorV2Mock;

      beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["mocks", "randomipfs"]);
        randomIpfsNft = await ethers.getContract("RandomIpfsNft");
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
      });

      describe("Constructor", function () {
        it("Sets starting values correctly.", async function () {
          const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0);
          assert(dogTokenUriZero.includes("ipfs://"));
        });
      });

      describe("requestNft", () => {
        it("Fails if payment is not send with the request.", async function () {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWith("NeedMoreETHSent");
        });
        it("Reverts if payment amount is less than the mint fee.", async function () {
          const mintFee = await randomIpfsNft.getMintFee();
          await expect(
            randomIpfsNft.requestNft({ value: mintFee.sub(ethers.utils.parseEther("0.001")) })
          ).to.be.revertedWith("NeedMoreETHSent");
        });
        it("Emits an event and kicks off a random word request", async function () {
          const mintFee = await randomIpfsNft.getMintFee();
          await expect(randomIpfsNft.requestNft({ value: mintFee.toString() })).to.emit(randomIpfsNft, "NftRequested");
        });
      });

      describe("fulfillRandomWords", () => {
        it("mints NFT after random number is returned", async function () {
          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once("NftMinted", async () => {
              try {
                const tokenUri = await randomIpfsNft.tokenURI("0");
                const tokenCounter = await randomIpfsNft.getTokenCounter();
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "1");
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            try {
              const fee = await randomIpfsNft.getMintFee();
              const requestNftResponse = await randomIpfsNft.requestNft({
                value: fee.toString(),
              });
              const requestNftReceipt = await requestNftResponse.wait(1);
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestNftReceipt.events[1].args.requestId,
                randomIpfsNft.address
              );
            } catch (e) {
              console.log(e);
              reject(e);
            }
          });
        });
      });

      describe("getBreedFromModdedRng", () => {
        it("Should return pug if moddedRng < 10", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(7);
          assert.equal(0, expectedValue);
        });
        it("Should return shiba-inu if moddedRng is between 10 - 39", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(32);
          assert.equal(1, expectedValue);
        });
        it("Should return bernard if moddedRng is between 40 - 99", async function () {
          const expectedValue = await randomIpfsNft.getBreedFromModdedRng(78);
          assert.equal(2, expectedValue);
        });
        it("Should revert if moddedRng > 99", async function () {
          await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith("RangeOutOfBounds");
        });
      });
    });

const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { deployFixtures } = require('./helpers/fixtures');
const { generateMetadataURI } = require('./helpers/utils');

describe('ProfileNFT', function () {
  describe('Deployment', function () {
    it('Should deploy with correct name and symbol', async function () {
      const { profileNFT } = await loadFixture(deployFixtures);

      expect(await profileNFT.name()).to.equal('VibeConnect Profile');
      expect(await profileNFT.symbol()).to.equal('VIBE');
    });

    it('Should set the deployer as owner', async function () {
      const { profileNFT, owner } = await loadFixture(deployFixtures);

      expect(await profileNFT.owner()).to.equal(owner.address);
    });
  });

  describe('Profile Minting', function () {
    it('Should mint profile NFT to user', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI = generateMetadataURI(1);

      await profileNFT.mintProfile(addr1.address, metadataURI);

      expect(await profileNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await profileNFT.tokenURI(1)).to.equal(metadataURI);
    });

    it('Should emit ProfileMinted event', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI = generateMetadataURI(1);

      await expect(profileNFT.mintProfile(addr1.address, metadataURI))
        .to.emit(profileNFT, 'ProfileMinted')
        .withArgs(addr1.address, 1, metadataURI);
    });

    it('Should prevent minting more than one profile per user', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI1 = generateMetadataURI(1);
      const metadataURI2 = generateMetadataURI(2);

      await profileNFT.mintProfile(addr1.address, metadataURI1);

      await expect(profileNFT.mintProfile(addr1.address, metadataURI2)).to.be.revertedWith(
        'User already has a profile'
      );
    });

    it('Should track profile ID by address', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI = generateMetadataURI(1);

      await profileNFT.mintProfile(addr1.address, metadataURI);

      expect(await profileNFT.getProfileId(addr1.address)).to.equal(1);
    });
  });

  describe('Profile Updates', function () {
    it('Should allow updating profile metadata', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI1 = generateMetadataURI(1);
      const metadataURI2 = generateMetadataURI(2);

      await profileNFT.mintProfile(addr1.address, metadataURI1);
      const tokenId = await profileNFT.getProfileId(addr1.address);

      await profileNFT.updateProfile(tokenId, metadataURI2);

      expect(await profileNFT.tokenURI(tokenId)).to.equal(metadataURI2);
    });

    it('Should emit ProfileUpdated event', async function () {
      const { profileNFT, addr1 } = await loadFixture(deployFixtures);
      const metadataURI1 = generateMetadataURI(1);
      const metadataURI2 = generateMetadataURI(2);

      await profileNFT.mintProfile(addr1.address, metadataURI1);
      const tokenId = await profileNFT.getProfileId(addr1.address);

      await expect(profileNFT.updateProfile(tokenId, metadataURI2))
        .to.emit(profileNFT, 'ProfileUpdated')
        .withArgs(tokenId, metadataURI2);
    });
  });

  describe('Soulbound Restrictions', function () {
    it('Should prevent transferring profile NFT', async function () {
      const { profileNFT, addr1, addr2 } = await loadFixture(deployFixtures);
      const metadataURI = generateMetadataURI(1);

      await profileNFT.mintProfile(addr1.address, metadataURI);
      const tokenId = await profileNFT.getProfileId(addr1.address);

      await expect(
        profileNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId)
      ).to.be.revertedWith('Soulbound: Transfer not allowed');
    });

    it('Should prevent approving profile NFT transfers', async function () {
      const { profileNFT, addr1, addr2 } = await loadFixture(deployFixtures);
      const metadataURI = generateMetadataURI(1);

      await profileNFT.mintProfile(addr1.address, metadataURI);
      const tokenId = await profileNFT.getProfileId(addr1.address);

      await expect(profileNFT.connect(addr1).approve(addr2.address, tokenId)).to.be.revertedWith(
        'Soulbound: Approval not allowed'
      );
    });
  });

  describe('Gas Optimization', function () {
    it('Should mint 100 profiles efficiently', async function () {
      const { profileNFT, addrs } = await loadFixture(deployFixtures);

      const gasUsed = [];
      for (let i = 0; i < Math.min(100, addrs.length); i++) {
        const metadataURI = generateMetadataURI(i + 1);
        const tx = await profileNFT.mintProfile(addrs[i].address, metadataURI);
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
      console.log(`    Average gas per mint: ${avgGas.toString()}`);

      expect(avgGas).to.be.lessThan(200000n); // Should be under 200k gas per mint
    });
  });
});

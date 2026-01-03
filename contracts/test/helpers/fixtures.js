const { ethers } = require('hardhat');

/**
 * Deploy all core VibeConnect contracts for testing
 * @returns {Promise<Object>} Deployed contract instances
 */
async function deployFixtures() {
  const [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

  // Deploy ProfileNFT
  const ProfileNFT = await ethers.getContractFactory('ProfileNFT');
  const profileNFT = await ProfileNFT.deploy();
  await profileNFT.waitForDeployment();

  // Deploy ConnectionNFT
  const ConnectionNFT = await ethers.getContractFactory('ConnectionNFT');
  const connectionNFT = await ConnectionNFT.deploy();
  await connectionNFT.waitForDeployment();

  // Deploy PesoBytes
  const PesoBytes = await ethers.getContractFactory('PesoBytes');
  const pesoBytes = await PesoBytes.deploy();
  await pesoBytes.waitForDeployment();

  return {
    profileNFT,
    connectionNFT,
    pesoBytes,
    owner,
    addr1,
    addr2,
    addr3,
    addrs,
  };
}

/**
 * Deploy EventEntryNFT contract for testing
 * @returns {Promise<Object>} Deployed contract instance and signers
 */
async function deployEventEntryFixtures() {
  const [owner, organizer, attendee1, attendee2, ...addrs] = await ethers.getSigners();

  const EventEntryNFT = await ethers.getContractFactory('EventEntryNFT');
  const eventEntryNFT = await EventEntryNFT.deploy();
  await eventEntryNFT.waitForDeployment();

  return {
    eventEntryNFT,
    owner,
    organizer,
    attendee1,
    attendee2,
    addrs,
  };
}

/**
 * Deploy EventTokenFactory and related contracts for testing
 * @returns {Promise<Object>} Deployed contract instances
 */
async function deployEventTokenFixtures() {
  const [owner, organizer, attendee1, attendee2, ...addrs] = await ethers.getSigners();

  const EventTokenFactory = await ethers.getContractFactory('EventTokenFactory');
  const factory = await EventTokenFactory.deploy();
  await factory.waitForDeployment();

  return {
    factory,
    owner,
    organizer,
    attendee1,
    attendee2,
    addrs,
  };
}

/**
 * Deploy TwinBadge contract for testing
 * @returns {Promise<Object>} Deployed contract instance and signers
 */
async function deployTwinBadgeFixtures() {
  const [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

  const TwinBadge = await ethers.getContractFactory('TwinBadge');
  const twinBadge = await TwinBadge.deploy();
  await twinBadge.waitForDeployment();

  return {
    twinBadge,
    owner,
    addr1,
    addr2,
    addr3,
    addrs,
  };
}

/**
 * Generate 1000 fake attendee addresses for stress testing
 * @param {ethers.Signer[]} signers - Available signers from hardhat
 * @returns {Promise<string[]>} Array of 1000 addresses
 */
async function generate1000Attendees(signers) {
  const attendees = [];

  // Use first 20 signers (if available)
  for (let i = 0; i < Math.min(20, signers.length); i++) {
    attendees.push(await signers[i].getAddress());
  }

  // Generate 980 more fake addresses deterministically
  for (let i = attendees.length; i < 1000; i++) {
    const wallet = ethers.Wallet.createRandom();
    attendees.push(wallet.address);
  }

  return attendees;
}

module.exports = {
  deployFixtures,
  deployEventEntryFixtures,
  deployEventTokenFixtures,
  deployTwinBadgeFixtures,
  generate1000Attendees,
};

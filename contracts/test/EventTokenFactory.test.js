const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { deployEventTokenFixtures } = require('./helpers/fixtures');
const { advanceTime } = require('./helpers/utils');

describe('EventTokenFactory - Auto-Meme Coin Factory', function () {
  describe('Token Creation', function () {
    it('Should create event token with correct ticker ($EVENTNAME)', async function () {
      const { factory, organizer } = await loadFixture(deployEventTokenFixtures);

      const eventId = 'vibe-party-2026';
      const eventName = 'Vibe Party 2026';

      const tx = await factory.connect(organizer).createEventToken(eventId, eventName);
      const receipt = await tx.wait();

      // Get token address from event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'TokenCreated'
      );
      expect(event).to.exist;

      const tokenAddress = event.args.tokenAddress;
      const symbol = event.args.symbol;
      const name = event.args.name;

      // Verify ticker format: $VIBEPARTY2026
      expect(symbol).to.equal('VIBEPARTY2026');
      expect(name).to.equal('Vibe Party 2026 Token');

      // Verify token is stored
      const storedAddress = await factory.getEventToken(eventId);
      expect(storedAddress).to.equal(tokenAddress);
    });

    it('Should generate ticker: uppercase + no spaces', async function () {
      const { factory, organizer } = await loadFixture(deployEventTokenFixtures);

      const testCases = [
        { input: 'eth denver', expected: 'ETHDENVER' },
        { input: 'NFT.NYC 2026!', expected: 'NFTNYC2026' },
        { input: 'Miami Art Week', expected: 'MIAMIARTWEEK' },
        { input: 'Web3 Summit 2026', expected: 'WEB3SUMMIT2026' },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const { input, expected } = testCases[i];
        const eventId = `test-event-${i}`;

        const tx = await factory.connect(organizer).createEventToken(eventId, input);
        const receipt = await tx.wait();

        const event = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === 'TokenCreated'
        );
        expect(event.args.symbol).to.equal(expected);
      }
    });

    it('Should prevent creating duplicate tokens for same event', async function () {
      const { factory, organizer } = await loadFixture(deployEventTokenFixtures);

      const eventId = 'test-event-duplicate';
      const eventName = 'Test Event';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      await expect(
        factory.connect(organizer).createEventToken(eventId, eventName)
      ).to.be.revertedWith('Token already exists for this event');
    });
  });

  describe('Token Minting (One token per attendee)', function () {
    it('Should mint 1 token per attendee', async function () {
      const { factory, organizer, attendee1, attendee2 } =
        await loadFixture(deployEventTokenFixtures);

      const eventId = 'mint-test-event';
      const eventName = 'Mint Test Event';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      // Mint to attendee1
      await factory.connect(organizer).mintTokens(eventId, attendee1.address, 1);

      // Mint to attendee2
      await factory.connect(organizer).mintTokens(eventId, attendee2.address, 1);

      // Verify balances
      const tokenAddress = await factory.getEventToken(eventId);
      const EventToken = await ethers.getContractFactory('EventToken');
      const token = EventToken.attach(tokenAddress);

      const balance1 = await token.balanceOf(attendee1.address);
      const balance2 = await token.balanceOf(attendee2.address);

      expect(balance1).to.equal(ethers.parseEther('1')); // 1 token = 1e18 wei
      expect(balance2).to.equal(ethers.parseEther('1'));
    });

    it('Should track total minted correctly', async function () {
      const { factory, organizer, attendee1, attendee2, addrs } =
        await loadFixture(deployEventTokenFixtures);

      const eventId = 'supply-test-event';
      const eventName = 'Supply Test Event';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      // Mint to 100 attendees
      const attendees = [attendee1, attendee2, ...addrs.slice(0, 98)];

      for (let i = 0; i < attendees.length; i++) {
        await factory.connect(organizer).mintTokens(eventId, attendees[i].address, 1);
      }

      // Check stats
      const { supply, minted } = await factory.getTokenStats(eventId);

      expect(minted).to.equal(100);
      expect(supply).to.equal(100); // No burns yet
    });

    it('Should prevent double-claiming', async function () {
      const { factory, organizer, attendee1 } = await loadFixture(deployEventTokenFixtures);

      const eventId = 'double-claim-test';
      const eventName = 'Double Claim Test';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      // First mint succeeds
      await factory.connect(organizer).mintTokens(eventId, attendee1.address, 1);

      // Second mint should fail
      await expect(
        factory.connect(organizer).mintTokens(eventId, attendee1.address, 1)
      ).to.be.revertedWith('Already claimed');
    });
  });

  describe('24-Hour Burn Mechanism (Real Scarcity)', function () {
    it('Should burn unclaimed tokens after 24 hours', async function () {
      const { factory, organizer, attendee1, attendee2, addrs } =
        await loadFixture(deployEventTokenFixtures);

      console.log('\n    🔥 Testing Auto-Meme Coin burn mechanism...');

      const eventId = 'burn-test-event';
      const eventName = 'Burn Test Event';

      // Create token
      await factory.connect(organizer).createEventToken(eventId, eventName);

      // Mint to 100 attendees
      const attendees = [attendee1, attendee2, ...addrs.slice(0, 98)];

      for (let i = 0; i < attendees.length; i++) {
        await factory.connect(organizer).mintTokens(eventId, attendees[i].address, 1);
      }

      const { supply: supplyBefore } = await factory.getTokenStats(eventId);
      console.log(`    📊 Supply before burn: ${supplyBefore}`);
      expect(supplyBefore).to.equal(100);

      // Only first 70 claim (30 unclaimed)
      const unclaimed = attendees.slice(70); // Last 30 attendees

      // Advance time by 24 hours + 1 minute
      console.log('    ⏰ Advancing 24 hours...');
      await advanceTime(24 * 60 * 60 + 60);

      // Burn unclaimed
      console.log('    🔥 Burning unclaimed tokens...');
      const unclaimedAddresses = unclaimed.map((a) => a.address);
      await factory.connect(organizer).burnUnclaimed(eventId, unclaimedAddresses);

      const { supply: supplyAfter, burned } = await factory.getTokenStats(eventId);
      console.log(`    📊 Supply after burn: ${supplyAfter}`);
      console.log(`    🔥 Total burned: ${burned}`);

      expect(supplyAfter).to.equal(70);
      expect(burned).to.equal(30);

      console.log('    ✅ Real scarcity achieved: supply = exact attendance!');
    });

    it('Should emit TokensBurned event with correct count', async function () {
      const { factory, organizer, attendee1, attendee2, addrs } =
        await loadFixture(deployEventTokenFixtures);

      const eventId = 'event-burn-emission';
      const eventName = 'Burn Event Emission Test';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      // Mint 50 tokens
      const attendees = [attendee1, attendee2, ...addrs.slice(0, 48)];
      for (let i = 0; i < attendees.length; i++) {
        await factory.connect(organizer).mintTokens(eventId, attendees[i].address, 1);
      }

      // Mark last 20 as unclaimed
      const unclaimed = attendees.slice(30).map((a) => a.address);

      await advanceTime(24 * 60 * 60 + 60);

      await expect(factory.connect(organizer).burnUnclaimed(eventId, unclaimed))
        .to.emit(factory, 'TokensBurned')
        .withArgs(eventId, 20);
    });

    it('Should calculate scarcity ratio correctly', async function () {
      const { factory, organizer, attendee1, attendee2, addrs } =
        await loadFixture(deployEventTokenFixtures);

      const eventId = 'scarcity-test-event';
      const eventName = 'Scarcity Test Event';

      await factory.connect(organizer).createEventToken(eventId, eventName);

      // Mint 100 tokens
      const attendees = [attendee1, attendee2, ...addrs.slice(0, 98)];
      for (let i = 0; i < attendees.length; i++) {
        await factory.connect(organizer).mintTokens(eventId, attendees[i].address, 1);
      }

      // Burn 40 (60% remaining)
      const unclaimed = attendees.slice(60).map((a) => a.address);
      await advanceTime(24 * 60 * 60 + 60);
      await factory.connect(organizer).burnUnclaimed(eventId, unclaimed);

      const { scarcityRatio } = await factory.getTokenStats(eventId);

      expect(scarcityRatio).to.equal(60); // 60% remaining
    });
  });

  describe('Real Scarcity: Supply = Exact Crowd Size', function () {
    it('Should achieve exact supply = attendance after burn', async function () {
      const { factory, organizer, attendee1, attendee2, addrs } =
        await loadFixture(deployEventTokenFixtures);

      console.log('\n    🎯 Testing EXACT supply = attendance...');

      const eventId = 'exact-supply-test';
      const eventName = 'Exact Supply Test';

      // Event capacity: 1000
      // Actual attendance: 850
      await factory.connect(organizer).createEventToken(eventId, eventName);

      console.log('    👥 Minting 850 tokens for attendees...');
      const attendees = [attendee1, attendee2, ...addrs.slice(0, 848)];
      for (let i = 0; i < attendees.length; i++) {
        await factory.connect(organizer).mintTokens(eventId, attendees[i].address, 1);

        if ((i + 1) % 250 === 0) {
          console.log(`    ✓ Minted ${i + 1}/850`);
        }
      }

      // All 850 claim (no unclaimed)
      await advanceTime(24 * 60 * 60 + 60);
      await factory.connect(organizer).burnUnclaimed(eventId, []); // Empty unclaimed list

      const { supply, minted } = await factory.getTokenStats(eventId);

      console.log(`    ✅ Final supply: ${supply}`);
      console.log(`    🎯 Exact attendance: ${minted}`);
      console.log('    🔒 ZERO FLUFF: Supply matches reality perfectly!');

      expect(supply).to.equal(850);
      expect(minted).to.equal(850);
    });
  });

  describe('Factory Enumeration', function () {
    it('Should track all deployed tokens', async function () {
      const { factory, organizer } = await loadFixture(deployEventTokenFixtures);

      const events = [
        { id: 'event-1', name: 'Event One' },
        { id: 'event-2', name: 'Event Two' },
        { id: 'event-3', name: 'Event Three' },
      ];

      for (const event of events) {
        await factory.connect(organizer).createEventToken(event.id, event.name);
      }

      const totalTokens = await factory.getTotalTokens();
      expect(totalTokens).to.equal(3);
    });

    it('Should return correct token addresses', async function () {
      const { factory, organizer } = await loadFixture(deployEventTokenFixtures);

      const eventId = 'address-test-event';
      const eventName = 'Address Test Event';

      const tx = await factory.connect(organizer).createEventToken(eventId, eventName);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'TokenCreated'
      );
      const deployedAddress = event.args.tokenAddress;

      const storedAddress = await factory.getEventToken(eventId);

      expect(storedAddress).to.equal(deployedAddress);
    });
  });
});

const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { deployEventEntryFixtures, generate1000Attendees } = require('./helpers/fixtures');
const { advanceTime, batchExecute } = require('./helpers/utils');

/**
 * STRESS TEST: 1000 Ticket Mint & Burn Simulation
 * This test simulates a real-world event scenario:
 * 1. Mint 1000 entry NFTs to attendees
 * 2. Wait 24 hours
 * 3. Burn all unclaimed NFTs
 * 4. Assert that supply drops correctly
 *
 * IF THIS TEST BREAKS, THE BRANCH DIES IN HELL 💀
 */
describe('EventEntry - 1000 Ticket Stress Test', function () {
  // Increase timeout for this heavy test
  this.timeout(300000); // 5 minutes

  describe('Mass Minting (1000 tickets)', function () {
    it('Should mint 1000 event entry NFTs without gas exhaustion', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      console.log('\n    🎫 Generating 1000 fake attendees...');
      const attendees = await generate1000Attendees(addrs);
      expect(attendees.length).to.equal(1000);

      const EVENT_ID = 'stress-test-event-2026';
      const METADATA_BASE = 'ipfs://QmStressTest123/';

      console.log(`    🎪 Creating event: ${EVENT_ID}`);
      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 1000);

      console.log('    ⏳ Minting 1000 NFTs in batches...\n');

      const mintOperations = attendees.map((attendee, index) => async () => {
        const metadataURI = `${METADATA_BASE}${index}.json`;
        return eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendee, metadataURI);
      });

      const startTime = Date.now();
      await batchExecute(mintOperations, 50); // Batch size of 50
      const endTime = Date.now();

      console.log(`\n    ✅ Minted 1000 NFTs in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Verify total supply
      const totalSupply = await eventEntryNFT.getTotalSupply(EVENT_ID);
      expect(totalSupply).to.equal(1000);

      console.log(`    📊 Total Supply: ${totalSupply}`);
    });

    it('Should track all 1000 attendees correctly', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'tracking-test-event-2026';
      const METADATA_BASE = 'ipfs://QmTrackingTest/';

      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 1000);

      const mintOperations = attendees.map((attendee, index) => async () => {
        const metadataURI = `${METADATA_BASE}${index}.json`;
        return eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendee, metadataURI);
      });

      await batchExecute(mintOperations, 50);

      // Verify each attendee has their NFT
      console.log('    🔍 Verifying ownership for all 1000 attendees...');

      for (let i = 0; i < 1000; i++) {
        const balance = await eventEntryNFT.balanceOf(attendees[i]);
        expect(balance).to.be.at.least(1n);

        if ((i + 1) % 250 === 0) {
          console.log(`    ✓ Verified ${i + 1}/1000 attendees`);
        }
      }

      console.log('    ✅ All 1000 attendees verified!');
    });
  });

  describe('24-Hour Burn Mechanism', function () {
    it('Should burn all unclaimed NFTs after 24 hours and reduce supply', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      console.log('\n    🔥 Testing burn mechanism with 1000 tickets...');

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'burn-test-event-2026';
      const METADATA_BASE = 'ipfs://QmBurnTest/';

      // Create event
      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 1000);

      // Mint all 1000 NFTs
      const mintOperations = attendees.map((attendee, index) => async () => {
        const metadataURI = `${METADATA_BASE}${index}.json`;
        return eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendee, metadataURI);
      });

      await batchExecute(mintOperations, 50);

      const supplyBeforeBurn = await eventEntryNFT.getTotalSupply(EVENT_ID);
      console.log(`    📊 Supply before burn: ${supplyBeforeBurn}`);
      expect(supplyBeforeBurn).to.equal(1000);

      // Mark first 700 as claimed (30% will be unclaimed)
      console.log('    ✓ Marking 700 tickets as claimed...');
      const claimOperations = [];
      for (let i = 0; i < 700; i++) {
        claimOperations.push(async () => {
          return eventEntryNFT.connect(organizer).markAsClaimed(EVENT_ID, i + 1);
        });
      }
      await batchExecute(claimOperations, 50);

      // Advance time by 24 hours + 1 minute
      console.log('    ⏰ Advancing time by 24 hours + 1 minute...');
      await advanceTime(24 * 60 * 60 + 60);

      // Burn unclaimed NFTs (should burn 300)
      console.log('    🔥 Burning unclaimed NFTs...');
      const burnTx = await eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID);
      const burnReceipt = await burnTx.wait();

      console.log(`    ⛽ Gas used for burning: ${burnReceipt.gasUsed.toString()}`);

      // Verify supply dropped by 300
      const supplyAfterBurn = await eventEntryNFT.getTotalSupply(EVENT_ID);
      console.log(`    📊 Supply after burn: ${supplyAfterBurn}`);

      expect(supplyAfterBurn).to.equal(700);
      expect(supplyBeforeBurn - supplyAfterBurn).to.equal(300);

      console.log('    ✅ Successfully burned 300 unclaimed NFTs!');
      console.log(`    🎯 Supply reduction: ${supplyBeforeBurn} → ${supplyAfterBurn} (-30%)`);
    });

    it('Should NOT burn before 24 hours have passed', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'early-burn-test-2026';
      const METADATA_BASE = 'ipfs://QmEarlyBurn/';

      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 100);

      // Mint only 100 for this test (faster)
      for (let i = 0; i < 100; i++) {
        const metadataURI = `${METADATA_BASE}${i}.json`;
        await eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendees[i], metadataURI);
      }

      // Try to burn immediately (should fail)
      await expect(eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID)).to.be.revertedWith(
        'Burn period not reached'
      );

      // Advance time by 23 hours (still too early)
      await advanceTime(23 * 60 * 60);

      await expect(eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID)).to.be.revertedWith(
        'Burn period not reached'
      );
    });

    it('Should emit BurnCompleted event with correct count', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'event-emission-test-2026';
      const METADATA_BASE = 'ipfs://QmEventTest/';

      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 100);

      // Mint 100 tickets
      for (let i = 0; i < 100; i++) {
        const metadataURI = `${METADATA_BASE}${i}.json`;
        await eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendees[i], metadataURI);
      }

      // Mark 60 as claimed (40 will be burned)
      for (let i = 0; i < 60; i++) {
        await eventEntryNFT.connect(organizer).markAsClaimed(EVENT_ID, i + 1);
      }

      await advanceTime(24 * 60 * 60 + 60);

      await expect(eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID))
        .to.emit(eventEntryNFT, 'BurnCompleted')
        .withArgs(EVENT_ID, 40);
    });
  });

  describe('Real Scarcity Verification', function () {
    it('Should create provable scarcity: supply = actual attendance', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      console.log('\n    🎯 Testing REAL SCARCITY mechanism...');

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'scarcity-test-2026';
      const METADATA_BASE = 'ipfs://QmScarcity/';

      // Event capacity: 1000
      await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 1000);

      // Actual attendance: 850 people show up
      console.log('    👥 Simulating 850 actual attendees...');
      for (let i = 0; i < 850; i++) {
        const metadataURI = `${METADATA_BASE}${i}.json`;
        await eventEntryNFT.connect(organizer).mintEntry(EVENT_ID, attendees[i], metadataURI);

        if ((i + 1) % 250 === 0) {
          console.log(`    ✓ Minted ${i + 1}/850`);
        }
      }

      // All who showed up claim their NFTs
      console.log('    ✓ All 850 attendees claim their NFTs...');
      for (let i = 0; i < 850; i++) {
        await eventEntryNFT.connect(organizer).markAsClaimed(EVENT_ID, i + 1);

        if ((i + 1) % 250 === 0) {
          console.log(`    ✓ Claimed ${i + 1}/850`);
        }
      }

      await advanceTime(24 * 60 * 60 + 60);

      // Burn should do nothing (all were claimed)
      const supplyBefore = await eventEntryNFT.getTotalSupply(EVENT_ID);
      await eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID);
      const supplyAfter = await eventEntryNFT.getTotalSupply(EVENT_ID);

      expect(supplyAfter).to.equal(850);
      expect(supplyBefore).to.equal(supplyAfter);

      console.log(`    ✅ Final supply = exact crowd size: ${supplyAfter}`);
      console.log('    🔒 REAL SCARCITY ACHIEVED: No fluff, only truth!');
    });
  });

  describe('Performance Benchmarks', function () {
    it('Should complete full lifecycle (mint + burn) under acceptable gas limits', async function () {
      const { eventEntryNFT, organizer, addrs } = await loadFixture(deployEventEntryFixtures);

      console.log('\n    ⚡ Performance benchmark: Full lifecycle gas analysis...');

      const attendees = await generate1000Attendees(addrs);
      const EVENT_ID = 'perf-test-2026';
      const METADATA_BASE = 'ipfs://QmPerf/';

      // Create event
      const createTx = await eventEntryNFT.connect(organizer).createEvent(EVENT_ID, 1000);
      const createReceipt = await createTx.wait();
      console.log(`    📊 Event creation gas: ${createReceipt.gasUsed.toString()}`);

      // Mint 1000
      let totalMintGas = 0n;
      for (let i = 0; i < 1000; i++) {
        const metadataURI = `${METADATA_BASE}${i}.json`;
        const tx = await eventEntryNFT
          .connect(organizer)
          .mintEntry(EVENT_ID, attendees[i], metadataURI);
        const receipt = await tx.wait();
        totalMintGas += receipt.gasUsed;

        if ((i + 1) % 250 === 0) {
          console.log(
            `    ⛽ Minted ${i + 1}/1000 - Avg gas: ${(totalMintGas / BigInt(i + 1)).toString()}`
          );
        }
      }

      console.log(`    📊 Total mint gas for 1000: ${totalMintGas.toString()}`);
      console.log(`    📊 Average gas per mint: ${(totalMintGas / 1000n).toString()}`);

      // Mark 700 as claimed
      let totalClaimGas = 0n;
      for (let i = 0; i < 700; i++) {
        const tx = await eventEntryNFT.connect(organizer).markAsClaimed(EVENT_ID, i + 1);
        const receipt = await tx.wait();
        totalClaimGas += receipt.gasUsed;
      }

      console.log(`    📊 Total claim gas for 700: ${totalClaimGas.toString()}`);

      await advanceTime(24 * 60 * 60 + 60);

      // Burn
      const burnTx = await eventEntryNFT.connect(organizer).burnUnclaimed(EVENT_ID);
      const burnReceipt = await burnTx.wait();
      console.log(`    🔥 Burn gas for 300 NFTs: ${burnReceipt.gasUsed.toString()}`);

      const totalGas = createReceipt.gasUsed + totalMintGas + totalClaimGas + burnReceipt.gasUsed;
      console.log(`\n    💰 TOTAL GAS FOR FULL LIFECYCLE: ${totalGas.toString()}`);

      // Assert gas efficiency
      expect(totalMintGas / 1000n).to.be.lessThan(300000n); // Each mint < 300k gas
    });
  });
});

const { ethers } = require('hardhat');
const { expect } = require('chai');

/**
 * Advance blockchain time by specified seconds
 * @param {number} seconds - Number of seconds to advance
 */
async function advanceTime(seconds) {
  await ethers.provider.send('evm_increaseTime', [seconds]);
  await ethers.provider.send('evm_mine');
}

/**
 * Advance blockchain to a specific timestamp
 * @param {number} timestamp - Target timestamp
 */
async function advanceToTime(timestamp) {
  await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]);
  await ethers.provider.send('evm_mine');
}

/**
 * Get current blockchain timestamp
 * @returns {Promise<number>} Current block timestamp
 */
async function getCurrentTime() {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block.timestamp;
}

/**
 * Expect a transaction to emit an event with specific args
 * @param {Promise} txPromise - Transaction promise
 * @param {string} eventName - Expected event name
 * @param {Array} expectedArgs - Expected event arguments
 */
async function expectEvent(txPromise, eventName, expectedArgs = null) {
  const tx = await txPromise;
  const receipt = await tx.wait();

  const event = receipt.logs.find((log) => {
    try {
      return log.fragment && log.fragment.name === eventName;
    } catch {
      return false;
    }
  });

  expect(event, `Event "${eventName}" not emitted`).to.exist;

  if (expectedArgs) {
    expectedArgs.forEach((arg, index) => {
      expect(event.args[index]).to.equal(arg);
    });
  }

  return event;
}

/**
 * Expect a transaction to revert with a specific error message
 * @param {Promise} txPromise - Transaction promise
 * @param {string} errorMessage - Expected error message
 */
async function expectRevert(txPromise, errorMessage) {
  await expect(txPromise).to.be.revertedWith(errorMessage);
}

/**
 * Generate IPFS-like metadata URI for testing
 * @param {number} tokenId - Token ID
 * @returns {string} Fake IPFS URI
 */
function generateMetadataURI(tokenId) {
  return `ipfs://Qm${ethers.hexlify(ethers.randomBytes(32)).slice(2, 48)}/metadata-${tokenId}.json`;
}

/**
 * Batch execute async operations with progress logging
 * @param {Array<Function>} operations - Array of async functions to execute
 * @param {number} batchSize - Number of operations to run in parallel
 * @returns {Promise<Array>} Results of all operations
 */
async function batchExecute(operations, batchSize = 10) {
  const results = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);

    if ((i + batchSize) % 100 === 0 || i + batchSize >= operations.length) {
      console.log(
        `    Completed ${Math.min(i + batchSize, operations.length)}/${operations.length} operations`
      );
    }
  }

  return results;
}

/**
 * Calculate gas cost in ETH from transaction receipt
 * @param {Object} receipt - Transaction receipt
 * @returns {BigNumber} Gas cost in ETH
 */
function getGasCost(receipt) {
  return receipt.gasUsed * receipt.gasPrice;
}

module.exports = {
  advanceTime,
  advanceToTime,
  getCurrentTime,
  expectEvent,
  expectRevert,
  generateMetadataURI,
  batchExecute,
  getGasCost,
};

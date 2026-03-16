const crypto = require('crypto');
const Transaction = require('./Transaction');

/**
 * A Block bundles verified Transactions and links them chronologically
 * via the SHA-256 hash of the prior block.
 */
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions; // Array of Cryptographic Transactions
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0; // Mathematical puzzle solution
    }

    /**
     * Secures the block data with a SHA-256 fingerprint.
     */
    calculateHash() {
        return crypto.createHash('sha256')
            .update(
                this.previousHash + 
                this.timestamp + 
                JSON.stringify(this.transactions) + 
                this.nonce
            )
            .digest('hex');
    }

    /**
     * Executes the Proof-of-Work algorithm to physically mine this block into existence.
     * This defines the real computational cost of inserting data into BotCash.
     */
    mineBlock(difficulty) {
        // Enforce arbitrary computational work using zeroes, adjusting difficulty
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        console.log(`[Miner Engine] ⛏️ Block Mined Computationally! Hash: ${this.hash.slice(0, 16)}...`);
    }

    /**
     * Verify all transactions inside this block are mathematically signed.
     */
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Block;

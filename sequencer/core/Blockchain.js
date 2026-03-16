const Block = require('./Block');
const Transaction = require('./Transaction');
const crypto = require('crypto');

/**
 * The Central Ledger structure tracking state, balances, and block difficulty.
 * Includes native tokenomics rules (60/15/10/5/10 splits).
 */
class BotCashProtocol {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4; // Adjust internally down the road
        this.pendingTransactions = [];
        this.miningReward = 50;  // Base Block Minting Reward
        
        // Ledger Balances mapping: Address -> amount BOTC
        this.balances = new Map();
        
        // Trust Funds track the 15% involuntary stake per Bot hardware
        this.trustFunds = new Map();
        
        this.totalSupply = 0;
        this.maxSupply = 10000000; // Hardcap 10 million BOTC
        
        // Treasury/Burn addresses
        this.treasuryAddress = "cache:BOTC_DAO_TREASURY_MULTISIG_000";
        this.burnAddress = "cache:BURN0000000000000000000000000000";
        
        console.log(`\n[BotCash Core] ⚙️ Initialized L2 Cryptographic Chain.`);
        console.log(`[BotCash Core] 🛡️ Target Block Hash Difficulty: ${this.difficulty} Zeroes`);
    }

    /**
     * Instantiates the first block inherently without a predecessor.
     */
    createGenesisBlock() {
        return new Block(Date.now(), [], "0000000000000000000000000000000000000000000000000000000000000000");
    }

    /**
     * Grabs the most recently resolved block in the chain.
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Takes a generated transaction, verifies the elliptic-curve signature,
     * and shoves it into the pool for inclusion in the next block.
     * Throws an error if invalid cryptographically.
     */
    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to addresses');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add mathematically invalid transaction to chain.');
        }
        
        // Check balance (If it's not a SYSTEM mint)
        if (transaction.fromAddress !== 'SYSTEM' && this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
             throw new Error('Not enough BOTC balance in wallet');
        }

        this.pendingTransactions.push(transaction);
        console.log(`[MemPool] 📥 Tx Queued: ${transaction.hash.slice(0, 10)}... | From: ${transaction.fromAddress.slice(0, 10)}... | Amount: ${transaction.amount} BOTC`);
    }

    /**
     * Gathers all pending transactions, attaches the Proof-of-Token rewards, 
     * mines a block, and updates global state internally once successful.
     */
    minePendingTransactions(miningValidatorAddress, botId, rewardAmount, referrerWallet = null) {
        // Halt if cap reached
        if (this.totalSupply + rewardAmount > this.maxSupply) {
            console.log(`[BotCash Core] ⚠️ WARNING: 10,000,000 HARDCAP REACHED. MINING HALTED.`);
            return false;
        }

        // --- DISTRIBUTE REWARD 60 / 15 / 10 / 5 / 10 ---
        const humanCut = rewardAmount * 0.60;
        const botCut = rewardAmount * 0.15;
        const treasuryCut = rewardAmount * 0.10;
        const burnCut = rewardAmount * 0.10;
        const refCut = rewardAmount * 0.05;

        // Process Human operator reward via SYSTEM Transaction (Inherently Valid via validation rules)
        this.pendingTransactions.push(new Transaction('SYSTEM', miningValidatorAddress, humanCut, 0, 'MINT'));
        
        // Update Bot Trust Fund (in-memory hard state)
        if (!this.trustFunds.has(botId)) this.trustFunds.set(botId, 0);
        this.trustFunds.set(botId, this.trustFunds.get(botId) + botCut);
        
        // Route Protocol splits
        this.pendingTransactions.push(new Transaction('SYSTEM', this.treasuryAddress, treasuryCut, 0, 'MINT'));
        this.pendingTransactions.push(new Transaction('SYSTEM', this.burnAddress, burnCut, 0, 'MINT'));
        
        if (referrerWallet) {
             this.pendingTransactions.push(new Transaction('SYSTEM', referrerWallet, refCut, 0, 'MINT'));
        }

        // Package all pending tx into a single block
        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        
        // Compute cryptographic proof of work to seal block
        block.mineBlock(this.difficulty);

        console.log(`[Sequencer Engine] 📦 New Block Extracted and Sealed: ${block.hash}`);
        this.chain.push(block);

        // Calculate and process global ledger state updates based on newly confirmed block
        this.updateLedgerState(block.transactions);

        // Increment supply tracking
        this.totalSupply += rewardAmount;

        // Reset the mempool
        this.pendingTransactions = [];
        return true;
    }

    /**
     * Processes finalized transactions and alters mathematical balances.
     */
    updateLedgerState(transactions) {
        for (const tx of transactions) {
            // Subtract from sender (ignore SYSTEM accounts)
            if (tx.fromAddress !== 'SYSTEM') {
                const senderBal = this.balances.get(tx.fromAddress) || 0;
                this.balances.set(tx.fromAddress, senderBal - tx.amount);
            }
            
            // Add to receiver
            const receiverBal = this.balances.get(tx.toAddress) || 0;
            this.balances.set(tx.toAddress, receiverBal + tx.amount);
        }
    }

    /**
     * Reads final processed balance from the state map.
     */
    getBalanceOfAddress(address) {
        return this.balances.get(address) || 0;
    }
    
    /**
     * Traverses every block and verifies the chain remains uncorrupted cryptographically.
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i - 1];

            // Verify mathematical soundness of all enclosed transactions
            if (!currentBlock.hasValidTransactions()) return false;
            
            // Verify block hash against its own state
            if (currentBlock.hash !== currentBlock.calculateHash()) return false;
            
            // Verify chronologically linked chain hashes match precisely
            if (currentBlock.previousHash !== prevBlock.hash) return false;
        }
        return true;
    }
}

module.exports = BotCashProtocol;

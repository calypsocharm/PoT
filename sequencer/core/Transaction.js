const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * Transaction represents a cryptographic transfer of BOTCY.
 * It mandates that only a valid mathematical signature from the sender
 * can authorize movement of funds.
 */
class Transaction {
    constructor(fromAddress, toAddress, amount, nonce = 0, type = 'TRANSFER') {
        this.fromAddress = fromAddress; // 'SYSTEM' for PoT Minting
        this.toAddress = toAddress;     // Wallet address
        this.amount = amount;           // Float amount of BOTCY
        this.nonce = nonce;             // Helps prevent replay attacks
        this.type = type;               // TRANSFER, MINT, ACTIVATE_BOTCY
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
        this.signature = '';            // Elliptic Curve Signature (hex format)
    }

    /**
     * Uses SHA-256 to hash the transaction data structure for verification.
     */
    calculateHash() {
        return crypto.createHash('sha256')
            .update(
                (this.fromAddress || '') + 
                (this.toAddress || '') + 
                this.amount + 
                this.nonce + 
                this.type + 
                this.timestamp
            )
            .digest('hex');
    }

    /**
     * Signs the transaction using an elliptic curve private key (secp256k1).
     * Secures the transfer mathematically.
     */
    signTransaction(signingKey) {
        // System transactions (Mining rewards) do not require a sender signature.
        if (signingKey.getPublic('hex') !== this.fromAddress && this.fromAddress !== 'SYSTEM') {
            throw new Error('You cannot sign transactions for other wallets!');
        }
        
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
        
        // Re-calculate the final hash with the signature attached
        this.hash = crypto.createHash('sha256').update(hashTx + this.signature).digest('hex');
    }

    /**
     * Validates the structural integrity and mathematical signature of this Transaction.
     */
    isValid() {
        if (this.fromAddress === 'SYSTEM') return true; // System mints are inherently valid

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        try {
            const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
            return publicKey.verify(this.calculateHash(), this.signature);
        } catch (e) {
            return false; 
        }
    }
}

module.exports = Transaction;

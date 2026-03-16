const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

const db = new sqlite3.Database(path.join(dbPath, 'botcash.db'));

// Initialize Database Schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS blocks (
        hash TEXT PRIMARY KEY,
        previousHash TEXT,
        timestamp INTEGER,
        nonce INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        hash TEXT PRIMARY KEY,
        blockHash TEXT,
        fromAddress TEXT,
        toAddress TEXT,
        amount REAL,
        timestamp INTEGER,
        type TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS balances (
        address TEXT PRIMARY KEY,
        amount REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trust_funds (
        botId TEXT PRIMARY KEY,
        amount REAL
    )`);
});

class Database {
    static async getBalances() {
        return new Promise((resolve) => {
            db.all("SELECT address, amount FROM balances", [], (err, rows) => {
                if (err) return resolve(new Map());
                const map = new Map();
                rows.forEach(r => map.set(r.address, r.amount));
                resolve(map);
            });
        });
    }

    static async getTrustFunds() {
        return new Promise((resolve) => {
            db.all("SELECT botId, amount FROM trust_funds", [], (err, rows) => {
                if (err) return resolve(new Map());
                const map = new Map();
                rows.forEach(r => map.set(r.botId, r.amount));
                resolve(map);
            });
        });
    }

    static saveBlock(block) {
        db.run(`INSERT OR IGNORE INTO blocks (hash, previousHash, timestamp, nonce) VALUES (?, ?, ?, ?)`,
            [block.hash, block.previousHash, block.timestamp, block.nonce]);
        
        block.transactions.forEach(tx => {
            db.run(`INSERT OR IGNORE INTO transactions (hash, blockHash, fromAddress, toAddress, amount, timestamp, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [tx.hash || 'SYSTEM_MINT', block.hash, tx.fromAddress, tx.toAddress, tx.amount, tx.timestamp, tx.type || 'TRANSFER']);
        });
    }

    static updateBalance(address, amount) {
        db.run(`INSERT INTO balances (address, amount) VALUES (?, ?) ON CONFLICT(address) DO UPDATE SET amount = ?`,
            [address, amount, amount]);
    }

    static updateTrustFund(botId, amount) {
        db.run(`INSERT INTO trust_funds (botId, amount) VALUES (?, ?) ON CONFLICT(botId) DO UPDATE SET amount = ?`,
            [botId, amount, amount]);
    }
}

module.exports = Database;

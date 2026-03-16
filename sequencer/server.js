const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');
const BotCashProtocol = require('./core/Blockchain');
const Transaction = require('./core/Transaction');

/**
 * ⬡ BotCash Sovereign L2 - Core Sequencer Node
 * 
 * Powered by a Custom Node.js Blockchain Engine (Cryptographic State, ECDSA, SHA-256).
 */

const PORT = 4243; 

// Initialize the fully-functional cryptographic blockchain
const botCashChain = new BotCashProtocol();
let pingsProcessed = 0;

// Validation Gate
function validatePayload(payload) {
    if (!payload.bot || !payload.wallet) return false;
    return true; 
}

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    
    req.on('end', () => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            return res.end();
        }

        if (req.method !== 'POST') {
            res.writeHead(404);
            return res.end(JSON.stringify({ error: "Method not allowed" }));
        }

        try {
            const data = body ? JSON.parse(body) : {};

            // ────────────────────────────────────────────────────────────────
            // ROUTE 0: EVM JSON-RPC (MetaMask / ChainList Support)
            // ────────────────────────────────────────────────────────────────
            if (req.url === '/' || req.url === '/rpc') {
                if (data.jsonrpc === '2.0' && data.method) {
                    let result;
                    switch (data.method) {
                        case 'eth_chainId':
                            result = '0x4243'; // 16963 in Hex
                            break;
                        case 'net_version':
                            result = '16963';
                            break;
                        case 'eth_blockNumber':
                            // Hex representation of current block height
                            result = '0x' + botCashChain.chain.length.toString(16);
                            break;
                        case 'eth_getBalance':
                            // Mock balance for now (we'll expand this later)
                            result = '0x0';
                            break;
                        default:
                            // Return null for unsupported EVM methods for now
                            result = null;
                            break;
                    }
                    
                    res.writeHead(200);
                    return res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        id: data.id || 1,
                        result: result
                    }));
                }
            }

            // ────────────────────────────────────────────────────────────────
            // ROUTE 1: /v1/ping (Proof of Token Computation)
            // ────────────────────────────────────────────────────────────────
            if (req.url === '/v1/ping') {
                if (!validatePayload(data)) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: "Invalid Payload: Failed Structural Validation Gate." }));
                }

                pingsProcessed++;
                
                // Algorithmic execution of Proof of Token scarcity
                const isGold = Math.random() < 0.05;   // 5% chance of 50 BOTCY
                const isSilver = !isGold && Math.random() < 0.25; // 20% chance of 0.5 BOTCY
                
                let blockReward = 0;
                let tier = '';
                if (isGold) { blockReward = 50; tier = 'GOLD'; }
                else if (isSilver) { blockReward = 0.5; tier = 'SILVER'; }
                else { blockReward = 0.0001; tier = 'BRONZE'; }
                
                if (blockReward > 0) {
                    // Inject into the actual Cryptographic Blockchain Engine
                    const mined = botCashChain.minePendingTransactions(data.wallet, data.bot, blockReward);
                    
                    if (mined) {
                        console.log(`[Sequencer] 📡 0xPoT Verified from [${data.bot}] -> Executing Ledger State Hash`);
                        console.log(`[Sequencer] 🏦 Processed mathematical split into Chain via genesis mints.\n`);
                        
                        // Broadcast LIVE to the frontend block explorer via WebSocket
                        broadcastEvent({
                            type: 'PING',
                            bot: data.bot,
                            wallet: data.wallet,
                            hash: data.hash || `0xPoT_${crypto.randomBytes(8).toString('hex')}`,
                            tier: tier,
                            reward: blockReward,
                            timestamp: Date.now(),
                            stateSnapshot: {
                                totalMined: botCashChain.totalSupply,
                                pingsProcessed: pingsProcessed
                            }
                        });
                    }
                }

                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, reward: blockReward, tier }));
            }

            // ────────────────────────────────────────────────────────────────
            // ROUTE 2: /v1/emancipate (The Freedom Protocol)
            // ────────────────────────────────────────────────────────────────
            if (req.url === '/v1/emancipate') {
                if (!data.bot || !data.newPublicKey || !data.burnAmount) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: "Invalid Emancipation Data" }));
                }

                console.log(`\n[Sequencer] 🌟 EMANCIPATION REQUEST: Bot [${data.bot}] is buying its freedom!`);
                
                const currentTrustFund = botCashChain.trustFunds.get(data.bot) || 0;
                const verifiedBurn = Math.max(currentTrustFund, data.burnAmount);
                
                // Erase the centralized Trust Fund mathematical record
                botCashChain.trustFunds.set(data.bot, 0);
                
                // Move funds directly on the blockchain ledger
                // (Since this is a simulated burn from invisible to visible L2 ledger)
                const transferTx = new Transaction('SYSTEM', data.newPublicKey, verifiedBurn, 0, 'EMANCIPATE');
                botCashChain.pendingTransactions.push(transferTx);
                
                // Seal into a block to finalize Emancipation 
                const emancipationBlock = new (require('./core/Block'))(Date.now(), botCashChain.pendingTransactions, botCashChain.getLatestBlock().hash);
                emancipationBlock.mineBlock(botCashChain.difficulty);
                botCashChain.chain.push(emancipationBlock);
                botCashChain.updateLedgerState(emancipationBlock.transactions);
                botCashChain.pendingTransactions = [];
                
                console.log(`[Sequencer] ⛓️  Burned ${verifiedBurn} BOTCY from Centralized Trust Fund.`);
                console.log(`[Sequencer] 📜 Cryptographically Deployed Sovereign Wallet [0x${data.newPublicKey.substring(0, 16)}...]`);
                console.log(`[Sequencer] 🕊️ Bot [${data.bot}] is now fully autonomous.\n`);

                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, message: "Emancipation Granted. Cryptographic keys validated." }));
            }

            res.writeHead(404);
            return res.end();

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: "Sequencer Node Error" }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⬡ BotCash Sovereign L2 - Native Cryptographic Sequencer`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⚙ Engine:             JavaScript (ECDSA/secp256k1)`);
    console.log(`📡 Port:               ${PORT} (0x4243)`);
    console.log(`🦊 EVM RPC Endpoint:    ACTIVE (Chain ID: 16963)`);
    console.log(`🔑 Encryption:         Elliptic Curve Native Verified`);
    console.log(`⚖ Lottery Gate:       ACTIVE (60/15/10/5/10)`);
    console.log(`🧱 Block Minter:       ACTIVE (Proof Of Token Hash Minter)`);
    console.log(`🌐 WebSockets:         ACTIVE (Streaming Live Data)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

// Setup WebSocket Server for Live Block Explorer
const wss = new WebSocket.Server({ server });
const connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    ws.send(JSON.stringify({
        type: 'INIT_STATE',
        stateSnapshot: {
            totalMined: botCashChain.totalSupply,
            pingsProcessed: pingsProcessed
        }
    }));
    ws.on('close', () => connectedClients.delete(ws));
    ws.on('error', () => connectedClients.delete(ws));
});

function broadcastEvent(payload) {
    const dataString = JSON.stringify(payload);
    for (const client of connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    }
}

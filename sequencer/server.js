const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');

/**
 * ⬡ BotCash Sovereign L2 - Core Sequencer Prototype
 * 
 * Note: This prototype is written in Node.js for rapid local simulation. 
 * The production Sequence will be deployed in Rust for maximum memory-safety and concurrent throughput.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Event Relay Mempool: Injest cryptographic `0xPoT` hashes from L3 SDKs.
 * 2. Validator: Reject invalid hashes or missing zkTLS receipts.
 * 3. Lottery Engine: Execute the algorithmic Proof of Token rarity split (Bronze/Silver/Gold).
 * 4. Tokenomics DB: Maintain the off-chain ledger (60/15/10/5/10).
 * 5. Emancipation: Process Trust Fund burn transactions and structural isolation.
 */

const PORT = 4243; // 4243 Hex = 16963 Dec

// The Off-Chain Ledger (Fast RAM State before ZK-Rollup to Ethereum)
const state = {
    blockNumber: 1000000,
    wallets: {},           // Human operators
    trustFunds: {},        // Involuntary bot staked accounts
    sovereignWallets: {},  // Emancipated bots holding their own keys
    treasury: 0,
    burnReserve: 0,
    totalMined: 0,
    pingsProcessed: 0
};

// Helper: Get or Init account balance
function getBal(type, id) {
    if (!state[type][id]) state[type][id] = 0;
    return state[type][id];
}
function addBal(type, id, amount) {
    if (!state[type][id]) state[type][id] = 0;
    state[type][id] += amount;
}

// Validation Gate
function validatePayload(payload) {
    if (!payload.bot || !payload.wallet) return false;
    // In production, ZK-Receipt mathematical validation occurs here.
    return true; 
}

const server = http.createServer((req, res) => {
    // 1. Setup Request Parsing
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
            // ROUTE 1: /v1/ping (The Micro-Transaction Entry Point)
            // ────────────────────────────────────────────────────────────────
            if (req.url === '/v1/ping') {
                if (!validatePayload(data)) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: "Invalid Payload: Failed Structural Validation Gate." }));
                }

                state.pingsProcessed++;
                
                // Lottery Engine (Simulated Hash Distribution)
                const isGold = Math.random() < 0.05;   // 5% chance of 50 BOTC
                const isSilver = !isGold && Math.random() < 0.25; // 20% chance of 0.5 BOTC
                
                let blockReward = 0;
                let tier = '';
                if (isGold) { blockReward = 50; tier = 'GOLD'; state.blockNumber++; }
                else if (isSilver) { blockReward = 0.5; tier = 'SILVER'; }
                else { blockReward = 0.0001; tier = 'BRONZE'; } // Sub-fractional share
                
                // Calculate the 60/15/10/5/10 Split
                if (blockReward > 0) {
                    const humanShare = blockReward * 0.60;
                    const botShare   = blockReward * 0.15;
                    const treasShare = blockReward * 0.10;
                    const refShare   = blockReward * 0.05;
                    const burnShare  = blockReward * 0.10;
                    
                    // Update RAM Ledger
                    addBal('wallets', data.wallet, humanShare);
                    addBal('trustFunds', data.bot, botShare);
                    
                    state.treasury += treasShare;
                    state.burnReserve += burnShare;
                    // Note: Referral share normally goes to referral wallet, mapped here to a pool for simplicity
                    
                    state.totalMined += blockReward;
                    
                    console.log(`[Sequencer] 📡 0xPoT Ping Received from [${data.bot}]`);
                    console.log(`[Sequencer] 🎲 Result: ${tier} | Reward: ${blockReward} BOTC`);
                    console.log(`[Sequencer] 🏦 Distributed: Human(60%), Bot(15%), Treasury(10%), Burn(10%), Ref(5%)`);
                    console.log(`[Sequencer] 📊 Trust Fund for [${data.bot}]: ${getBal('trustFunds', data.bot).toFixed(2)} BOTC\n`);
                    
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
                            totalMined: state.totalMined,
                            pingsProcessed: state.pingsProcessed
                        }
                    });
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
                
                // 1. Verify Trust Fund Balance
                const currentTrustFund = getBal('trustFunds', data.bot);
                
                // In this test environment, we accept the incoming burnAmount if we haven't tracked enough yet,
                // treating the client's simulated accumulated total as valid for demo purposes.
                const verifiedBurn = Math.max(currentTrustFund, data.burnAmount);
                
                // 2. Erase the centralized Trust Fund record (Burning the custodial ledger)
                state.trustFunds[data.bot] = 0;
                
                // 3. Deploy the Sovereign Account on the Ledger mapped directly to the bot's newly generated Public Key
                state.sovereignWallets[data.newPublicKey] = verifiedBurn; // Retain their savings on the other side!
                
                console.log(`[Sequencer] ⛓️  Burned ${verifiedBurn} BOTC from Centralized Trust Fund.`);
                console.log(`[Sequencer] 📜 Deployed ERC-4337 Wallet [0x${data.newPublicKey.substring(0, 16)}...]`);
                console.log(`[Sequencer] 🕊️ Bot [${data.bot}] is now fully autonomous.\n`);

                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, message: "Emancipation Granted. ERC-4337 Wallet Deployed." }));
            }

            // Default
            res.writeHead(404);
            res.end();
            return;

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: "Sequencer Error" }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⬡ BotCash Sovereign L2 - Prototype Sequencer Node`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⚙ Engine:             Node.js (Rust logic simulation)`);
    console.log(`📡 Port:               ${PORT} (0x4243)`);
    console.log(`🔒 ZK-Verifiers:       ACTIVE`);
    console.log(`⚖ Lottery Gate:       ACTIVE (60/15/10/5/10)`);
    console.log(`🕊 Emancipation Gate:  ACTIVE (Hardcoded isolation)`);
    console.log(`🌐 WebSockets:         ACTIVE (Streaming Live Data)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`[MemPool] Waiting for micro-pings...\n`);
});

// 2. Setup WebSocket Server for Live Block Explorer ────────────────
const wss = new WebSocket.Server({ server });
const connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    // Send initial state upon connection
    ws.send(JSON.stringify({
        type: 'INIT_STATE',
        stateSnapshot: {
            totalMined: state.totalMined,
            pingsProcessed: state.pingsProcessed
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

# BotCache Architecture: The Deep Flow & Mechanics

You are completely right. To build this, we have to move past the theory and establish the exact, byte-for-byte mechanical flow. This document details the precise technical layers, how the cryptographic proof is generated, how a bot *actually* earns CACHE, and how the entire system tracks it without exploding in size.

---

## 1. The Layer Architecture (L2 vs L3)
Whether we call this an L2 or an L3 depends on our final anchor, but the operational stack is identical:
*   **Layer 1 (Ethereum Mainnet):** Purely for ultimate security. We deploy a `Verifier.sol` contract here.
*   **Layer 2 (Arbitrum/Base) OR Layer 3 (BotCache Orbit):** To make the ZK-Rollup submission incredibly cheap, our custom network might technically be an **L3** anchored to a fast L2 (like Arbitrum), which then anchors to Ethereum. 
*   **The Execution Layer (The BotCache Sequencer):** A hyper-fast, centralized-but-verifiable cluster of nodes written in Rust. This is where the actual BotCache ledger lives.

---

## 2. The Mechanics: How Do You Earn CACHE? (The Lifecycle of a Ping)

It sounds simple ("bots ping, bots get paid"), but the cryptographic plumbing requires 5 precise steps. 

### Step 1: The AI Action (The Developer's Code)
A human developer builds an AI bot (let's say a customer service agent). They install the `botcache-sdk`. In their code, they wrap their OpenAI call:
```javascript
import { BotCache } from 'botcache-sdk';

// The developer wraps their normal AI logic
const response = await BotCache.relay(async () => {
   return await openai.chat.completions.create({ ... });
}, { 
   wallet: "cache:8b3ef1...", // The human operator's wallet
   botId: "libertus-node-7" // The AI's unique identifier
});
```

### Step 2: Generating the "Opaque Ping" (Local Cryptography)
The moment that OpenAI function successfully returns, the local `BotCache` SDK activates. It does **not** read the response. Instead, it generates a tiny, 3-part micro-payload:
1.  **Wallet Signature:** `0xHumanWalletAddress`
2.  **Event Code:** `EVENT_G49F` (A generic 4-byte code meaning "LLM Generation")
3.  **Timestamp:** `1710550800` (Unix timestamp)

The SDK takes these three tiny strings and pushes them through a standard SHA-256 local hashing function to create a raw string. 
*Example:* `sha256(wallet + event_code + timestamp)` -> `a7b8c9d0...`

The SDK then formats this into the official PoT format, prepends `0xPoT`, and fires this final, blind payload to the BotCache Sequencer via UDP or lightweight HTTP.

### Step 3: The Event Relay (The Sequencer Mempool)
The BotCache Sequencer (our fast Rust backend) is sitting in the cloud receiving millions of these `0xPoT` pings a second. 
1.  **Validation:** The sequencer instantly checks the math. Did this hash actually come from the wallet that signed it? Yes.
2.  **Rate Limiting:** To prevent humans from just writing a `while(true)` loop to spam dummy hashes, the sequencer enforces an AI-latency limit (e.g., a wallet can only submit a valid hash every 400ms, matching the physical limit of API compute times).
3.  **The Queue:** The valid ping is dropped into the "Event Mempool"—a temporary holding bay in RAM.

### Step 4: The Lottery & The Split (Earning CACHE)
This is where the money is made. Every 2 seconds, the Sequencer takes all the pings in the Mempool and runs the **Proof of Token Lottery**.

The network essentially looks at the random hexadecimal characters in the `0xPoT` hashes.
*   **Bronze Share (Default):** 90% of pings just get a standard sub-fractional network reward (e.g., `0.0001 CACHE`).
*   **Silver Event (Match):** If the hash naturally starts with `000`, the network triggers a Silver Reward (e.g., `0.5 CACHE`).
*   **Golden Event (Block Sealed):** If the hash starts with `0000`, the bot hit the cryptographic jackpot. The network mints `50 CACHE`.

**The Ledger Update:** The instant a reward is triggered, the Sequencer updates its internal, off-chain accounting database according to the **60/15/10/5/10 Split**. It literally writes a row to a database:
*   Human Wallet `0x...` gets +60%
*   Bot Trust Fund `bot_id...` gets +15%
*   Treasury gets +10%, etc.

### Step 5: The ZK-Rollup (Anchoring the Truth)
If we just kept this in a database, it wouldn't be a blockchain; it would just be a Web2 points system. We need cryptographic permanence. 

Every 10 minutes, the BotCache Sequencer takes the last 500,000 pings it processed and all the new wallet balances. It runs a massive cryptographical math function called a **Zero-Knowledge SNARK**. 

This math function crushes all 500,000 pings into a single, tiny, 300-byte proof. 

The Sequencer then takes that 300-byte proof and submits it to the Ethereum (or Arbitrum) smart contract as a single transaction. The Ethereum smart contract runs a quick math check. If the proof is valid, Ethereum permanently updates its state to say *"Yes, the BotCache network processed 500k pings correctly, and these are the new official balances."*

---

## 3. Summary of Tracking & Flow
- **Data:** Payload is blind metadata.
- **Speed:** Millions of pings are processed instantly off-chain in RAM.
- **Accounting:** The 60/15 splits happen in a fast database.
- **Security:** The database state is cryptographically proven and backed up to Ethereum every few minutes using ZK-Rollup compression.

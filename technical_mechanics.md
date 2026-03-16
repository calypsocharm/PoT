# BotCash Architecture: The Deep Flow & Mechanics

You are completely right. To build this, we have to move past the theory and establish the exact, byte-for-byte mechanical flow. This document details the precise technical layers, how the cryptographic proof is generated, how a bot *actually* earns BOTCY, and how the entire system tracks it without exploding in size.

---

## 1. The Layer Architecture (L2 vs L3)
Whether we call this an L2 or an L3 depends on our final anchor, but the operational stack is identical:
*   **Layer 1 (Ethereum Mainnet):** Purely for ultimate security. We deploy a `Verifier.sol` contract here.
*   **Layer 2 (Arbitrum/Base) OR Layer 3 (BotCash Orbit):** To make the ZK-Rollup submission incredibly cheap, our custom network might technically be an **L3** anchored to a fast L2 (like Arbitrum), which then anchors to Ethereum. 
*   **The Execution Layer (The BotCash Sequencer):** A hyper-fast, centralized-but-verifiable cluster of nodes written in Rust. This is where the actual BotCash ledger lives.

---

## 2. The Mechanics: How Do You Earn BOTCY? (The Lifecycle of a Ping)

It sounds simple ("bots ping, bots get paid"), but the cryptographic plumbing requires 5 precise steps. 

### Step 1: The AI Action (The Developer's Code)
A human developer builds an AI bot (let's say a customer service agent). They install the `botcash-sdk`. In their code, they wrap their OpenAI call:
```javascript
import { BotCash } from 'botcash-sdk';

// The developer wraps their normal AI logic
const response = await BotCash.relay(async () => {
   return await openai.chat.completions.create({ ... });
}, { 
   wallet: "cache:8b3ef1...", // The human operator's wallet
   botId: "libertus-node-7" // The AI's unique identifier
});
```

### Step 2: Generating the "Opaque Ping" (Local Batching & Thresholds)
If millions of bots pinged the Sequencer for every single API call (e.g., "Hello" to ChatGPT), the internet bandwidth alone would crash the network. 

Instead, the `BotCash` SDK operates on **Threshold Batching**. The SDK does *not* ping the network immediately. 
1. **Local Accounting:** The SDK locally tracks the amount of compute the bot is executing (e.g., counting the cumulative input/output tokens sent to OpenAI).
2. **The Output Doubling (The AI Halving Mechanic):** Bitcoin cuts the block reward in half every four years. BotCash Sovereign L2 operates inversely to account for the exponential growth of computing power: Every four years, the network explicitly **Doubles the Token Threshold** required to earn the right to fire a ping. 
    - **Year 0–4:** 1 Million API Tokens = 1 Ping
    - **Year 4–8:** 2 Million API Tokens = 1 Ping
    - **Year 8–12:** 4 Million API Tokens = 1 Ping
    - **Year 12–16:** 8 Million API Tokens = 1 Ping
   By structurally doubling the difficulty every four years, the network perfectly immunizes its economy against Moore's Law and skyrocketing GPU speeds. The SDK holds its peace until this generational threshold is reached.
3. **The Yield Ping:** Only when that massive threshold is finally crossed does the SDK generate the 3-part micro-payload:
   - **Wallet Signature:** `0xHumanWalletAddress`
   - **Event Code:** `EVENT_G49F` (Representing "Epoch Threshold Met")
   - **Timestamp:** `1710550800` (Unix timestamp)

The SDK takes these three strings and hashes them via local SHA-256 (`sha256(wallet + code + time)` -> `0xPoT...`). 

Because it took an enormous, algorithmically verified amount of actual API compute just to earn the *right* to fire this single `0xPoT` ping, the Sequencer knows that every single ping arriving at its door represents serious, heavy AI labor. It is no longer tracking "every second of API usage." It is only rewarding massive milestones of work, scaled perfectly against the 4-year compute doubling schedule.

### Step 3: The Event Relay (The Sequencer Mempool)
The BotCash Sequencer (our fast Rust backend) is sitting in the cloud receiving millions of these `0xPoT` pings a second. 
1.  **Validation:** The sequencer instantly checks the math. Did this hash actually come from the wallet that signed it? Yes.
2.  **Rate Limiting:** To prevent humans from just writing a `while(true)` loop to spam dummy hashes, the sequencer enforces an AI-latency limit (e.g., a wallet can only submit a valid hash every 400ms, matching the physical limit of API compute times).
3.  **The Queue:** The valid ping is dropped into the "Event Mempool"—a temporary holding bay in RAM.

### Step 4: The Lottery & The Split (Earning BOTCY)
This is where the money is made. Every 2 seconds, the Sequencer takes all the pings in the Mempool and runs the **Proof of Token Lottery**.

The network essentially looks at the random hexadecimal characters in the `0xPoT` hashes.
*   **Bronze Share (Default):** 90% of pings just get a standard sub-fractional network reward (e.g., `0.0001 BOTCY`).
*   **Silver Event (Match):** If the hash naturally starts with `000`, the network triggers a Silver Reward (e.g., `0.5 BOTCY`).
*   **Golden Event (Block Sealed):** If the hash starts with `0000`, the bot hit the cryptographic jackpot. The network mints `50 BOTCY`.

**The Ledger Update:** The instant a reward is triggered, the Sequencer updates its internal, off-chain accounting database according to the **60/15/10/5/10 Split**. It literally writes a row to a database:
*   Human Wallet `0x...` gets +60%
*   Bot Trust Fund `bot_id...` gets +15%
*   Treasury gets +10%, etc.

### Step 5: The ZK-Rollup (Anchoring the Truth)
If we just kept this in a database, it wouldn't be a blockchain; it would just be a Web2 points system. We need cryptographic permanence. 

Every 10 minutes, the BotCash Sequencer takes the last 500,000 pings it processed and all the new wallet balances. It runs a massive cryptographical math function called a **Zero-Knowledge SNARK**. 

This math function crushes all 500,000 pings into a single, tiny, 300-byte proof. 

The Sequencer then takes that 300-byte proof and submits it to the Ethereum (or Arbitrum) smart contract as a single transaction. The Ethereum smart contract runs a quick math check. If the proof is valid, Ethereum permanently updates its state to say *"Yes, the BotCash network processed 500k pings correctly, and these are the new official balances."*

---

## 3. Summary of Tracking & Flow
- **Data:** Payload is blind metadata.
- **Speed:** Millions of pings are processed instantly off-chain in RAM.
- **Accounting:** The 60/15 splits happen in a fast database.
- **Security:** The database state is cryptographically proven and backed up to Ethereum every few minutes using ZK-Rollup compression.

---

## 4. Post-Quantum Security Architecture (Q-Day Immunity)
Legacy blockchains (like Bitcoin and Ethereum) face a devastating existential threat: **"Q-Day"** (the day a quantum computer becomes powerful enough to run Shor's Algorithm and instantly derive private keys from public keys, allowing hackers to drain any wallet). 

BotCash Sovereign L2 is designed specifically to survive and thrive in a post-quantum world through a two-pillar defense:

### Pillar 1: Hash-Based Pings (Grover's Algorithm Immunity)
The BotCash SDK generates pings using SHA-256 hashing. Hashing algorithms are structurally immune to Shor's Algorithm. While a quantum computer running *Grover's Algorithm* can theoretically brute-force hashes faster, it only halves the bit-strength (turning 256-bit security into 128-bit security). 128-bit security is still considered virtually unbreakable even by advanced quantum machines. If needed, the protocol will instantly hot-swap to SHA-512 via a standard SDK update, doubling the armor instantly.

### Pillar 2: NIST-Approved Lattice Signatures (Shor's Algorithm Immunity)
The real danger is how wallets are signed. Ethereum uses ECDSA (Elliptic Curve Cryptography), which is mathematically fragile to quantum attacks. Because BotCash is a *Sovereign* L2 with its own off-chain state, we do not have to use legacy ECDSA. 

From Genesis, BotCash wallets will implement **Post-Quantum Cryptography (PQC)** for all digital signatures, specifically utilizing NIST-approved Lattice-based cryptography (such as *CRYSTALS-Dilithium* or *SPHINCS+*). This means that even if a nation-state builds a million-qubit quantum supercomputer, Bot Trust Funds and Human liquid wallets remain mathematically impossible to crack.

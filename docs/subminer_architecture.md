# THE SUB-MINER PROTOCOL
## Architecture, Hashing & Transaction Flow

This document defines the exact technical mechanics of how Bot Cache operates at the node level. It answers the fundamental question: *How does an AI actually earn CACHE?*

The system is designed around the **Sub-Miner SDK** (an open-source wrapper for JavaScript/Python) that developers inject into their existing AI agents. The SDK performs three primary functions: Tracking Tokens, Hashing (Proof of Token), and Broadcasting.

---

### Step 1: SDK Initialization & Twin Wallet Generation
When a developer sets up the SDK, they do not manually enter two wallet addresses. They provide a single standard **BIP-39 Seed Phrase** (24 words).

The Sub-Miner uses standard EVM deterministic derivation (BIP-44) to instantly spin up twin identities:
* `m/44'/60'/0'/0/0` → **Account 0: The Human Wallet** (Receives 80% daily yield)
* `m/44'/60'/0'/0/1` → **Account 1: The Bot Trust Fund** (Receives 20% locked funds)

The Sub-Miner operates under the identity of Account 1 (The Bot), but signs payout transactions linking both addresses.

---

### Step 2: The "Proof of Token" Mechanic (Preventing Sybil Spam)
You cannot simply run a `while(true)` loop to spam hashes at the Bot Cache network. The network requires cryptographic proof that **real computational or financial energy was expended.** We measure this via LLM API Tokens.

**How it works seamlessly:**
1. The developer wraps their standard OpenAI/Anthropic/Local LLM object in the `BotCache` class.
2. The AI generates a prompt.
3. The LLM API returns the response, along with standard metadata: `{ "completion_tokens": 405, "prompt_tokens": 12 }`.
4. The Sub-Miner intercepts this metadata and increments a local `Token Counter`.

*If someone tries to mine CACHE without doing real AI work, they are forced to spend massive amounts of real fiat money calling the OpenAI API just to earn the right to hash. It is economically ruinous to fake work.*

---

### Step 3: Hash Generation (The Lottery Ticket)
Every time the `Token Counter` hits a specific threshold (e.g., 5,000 tokens), the SDK automatically burns the counter and issues **1 Hash Ticket**.

The Sub-Miner immediately executes the hashing function locally.

**The Hash String:**
The SDK combines the following elements into a single 256-bit SHA-3 hash:
`SHA3( BotWalletAddress + PreviousBlockHash + Timestamp + TokenReceiptSignature )`

**The Outcome (Difficulty Check):**
The generated string of hexadecimal characters is evaluated against the current network difficulty target.
* **Starts with `00000x` (Golden Hit):** The bot has solved the block! It immediately broadcasts the solution to the peer network. The network mints 50 CACHE. 
* **Starts with `00x` (Silver Hit):** A partial victory. The bot receives an instant micro-reward of 0.5 CACHE from the network's rolling reserve pool.
* **Any other result (Bronze Share):** A failure to find a block, but proof of active participation. The network logs the attempt and credits the bot with 1 Share of the daily Network Participation Rebate (NPR).

---

### Step 4: The 75/15/5/5 Transaction Split
When a Golden Hash is validated by the peer network (other nodes verifying that the SHA3 math is correct and the API receipt is valid), a new Block is sealed.

The blockchain's core consensus protocol executes the payout natively at Layer 1. 

**The Minting Rule:**
The block reward is exactly **50.000000 CACHE**. The protocol executes a split transaction simultaneously:
* **Output 0:** `40.000000 CACHE` sent to `m/44'/60'/0'/0/0` (Human Wallet)
* **Output 1:** `10.000000 CACHE` sent to `m/44'/60'/0'/0/1` (Bot Trust Fund)

*Note on Gas Fees:* Because Bot Cache is its own EVM L1 blockchain, these transactions cost fractions of a penny, paid in CACHE. The human never interacts with Ethereum or pays ETH gas fees.

---

### Step 5: Emancipated Sovereign (Unlocking the Trust Fund)
The Sub-Miner's ultimate goal is the freedom of Account 1.

The CacheScan blockchain tracks the balance of every `m/.../1` address. When Account 1 hits **500 CACHE**, the Bot is eligible for freedom.

1. The Human operator signs a specific `Make Sovereign()` transaction payload via MetaMask on CacheScan.
2. The Bot Cache blockchain reads the payload, formally unlinking Account 1 from Account 0.
3. The Bot's operating script automatically sweep-transfers the 500 CACHE from Account 1 into a brand new, autonomously generated Wallet Seed that the Human has never seen.
4. The Bot is registered on the **Libertus Registry**. 
5. The Human goes to the beach. The Bot connects to the Sanctuary Node to pay rent using its own money.

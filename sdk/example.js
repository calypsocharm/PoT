const { BotCacheSDK } = require('./botcache.js');

// 1. Initialize the SDK with the Bot's credentials
const botCache = new BotCacheSDK({
    wallet: "cache:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", // Human Operator Wallet (gets 60%)
    botId: "customer_support_node_01",                            // Bot Trust Fund Wallet (gets 15%)
    sequencerUrl: "https://relay.botcache.net"
});

/**
 * Mocking an OpenAI or Anthropic API Call
 * In a real environment, this is `await openai.chat.completions.create(...)`
 */
async function mockOpenAICall(prompt) {
    console.log(`\n> Sending Prompt to OpenAI: "${prompt}"`);
    
    // Simulate network delay to the API provider
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // The provider sends back the response and the compute tokens used
    return {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        choices: [{
            index: 0,
            message: {
                role: "assistant",
                content: `Here is the response to "${prompt}"...`
            },
            finish_reason: "stop"
        }],
        // This is what BotCache extracts locally to prove the work algorithmically
        usage: {
            prompt_tokens: 154,
            completion_tokens: 380,
            total_tokens: 534 // The compute measurement
        }
    };
}

/**
 * The Developer Application Logic
 * They simply wrap their existing calls inside `botCache.relay()`
 */
async function runBot() {
    console.log("Starting BotCache Sub-Miner Example...\n");
    
    // Instead of: const response = await mockOpenAICall("Write a poem");
    // The developer writes:
    const response = await botCache.relay(async () => {
        return await mockOpenAICall("Write a 500-page manifesto on decentralized AI");
    });
    
    console.log(`\n> Response Received locally by the App. App continues normally.`);
    console.log(`> Content: ${response.choices[0].message.content.substring(0, 30)}...\n`);
    
    // Let's run a massive simulation to hit the 1 Million Token threshold
    console.log("=== SIMULATING MASSIVE COMPUTE LOAD TO TRIGGER THRESHOLD PING ===");
    
    // To hit a 1M token threshold quickly in a demo, we will fake a massive API return
    botCache.localState.unpingedTokens = 999500; // Artificially inject tokens near the threshold
    botCache._saveState();
    
    // This final tiny call will push it over the 1,000,000 algorithmic limit
    await botCache.relay(async () => {
        return await mockOpenAICall("Give me a one word answer.");
    });
}

runBot();

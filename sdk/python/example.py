import time
from botcash import BotCashSDK

def mock_openai_call():
    print('\n> Sending Prompt to OpenAI: "Write a poem"')
    time.sleep(0.8)
    return {
        "choices": [{"message": {"content": "Roses are red..."}}],
        "usage": {"total_tokens": 534}
    }

if __name__ == "__main__":
    bot_cache = BotCashSDK(
        human_wallet="botcy:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        bot_id="customer_support_node_01_py"
    )

    print("Starting BotCash Sub-Miner Example (Python)...\n")
    
    response = bot_cache.relay(mock_openai_call)
    print(f"\n> Response Received locally by the App.")
    
    # Simulate massive compute load
    print("=== SIMULATING MASSIVE COMPUTE LOAD TO TRIGGER THRESHOLD PING ===")
    bot_cache.local_state['unpinged_tokens'] = 999500
    bot_cache._save_state()
    
    bot_cache.relay(mock_openai_call)

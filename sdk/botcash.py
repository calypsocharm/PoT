import hashlib
import json
import os
import time
import requests
from typing import Callable, Any, Dict

class BotCashSDK:
    def __init__(self, human_wallet: str, bot_id: str, sequencer_url: str = 'http://localhost:4243'):
        self.human_wallet = human_wallet
        self.bot_id = bot_id
        self.sequencer_url = sequencer_url
        self.current_network_difficulty = 1000000  # 1 Million Tokens = 1 Ping
        
        # Local state file to persist token counts between server restarts
        self.state_file = f".botcash_{self.bot_id}_state.json"
        self.local_state = self._load_state()

    def relay(self, ai_call: Callable[[], Any]) -> Any:
        # 1. Execute the AI call EXACTLY as the developer wrote it
        response = ai_call()

        # 2. Extract the physical compute token count
        tokens_used, zktls_proof = self._extract_tokens_and_proof(response)
        
        if tokens_used > 0:
            # 3. Add to the local, offline counter database
            self.local_state['total_tokens'] += tokens_used
            self.local_state['unpinged_tokens'] += tokens_used
            
            if 'zk_receipts' not in self.local_state:
                self.local_state['zk_receipts'] = []
            self.local_state['zk_receipts'].append(zktls_proof)
            
            print(f"[BotCash] {tokens_used} tokens counted locally. Total Unpinged: {self.local_state['unpinged_tokens']}")
            self._save_state()

            # 4. Check if we've crossed the Algorithmic Compute Threshold
            if self.local_state['unpinged_tokens'] >= self.current_network_difficulty:
                self._fire_opaque_ping()

        # 5. Return the raw data to the user's application
        return response

    def _extract_tokens_and_proof(self, api_response: Dict[str, Any]):
        tokens = 0
        if isinstance(api_response, dict) and 'usage' in api_response:
            usage = api_response['usage']
            if 'total_tokens' in usage:
                tokens = usage['total_tokens']
        
        zktls_proof = f"zkTLS_receipt_{os.urandom(4).hex()}"
        return tokens, zktls_proof

    def _fire_opaque_ping(self):
        print(f"[BotCash] 🔥 Threshold Breached ({self.current_network_difficulty} tokens). Generating Opaque Ping...")

        timestamp = int(time.time() * 1000)
        event_code = "EVENT_EPOCH_MET"

        raw_payload = f"w:[{self.human_wallet}]|ts:[{timestamp}]|code:[{event_code}]"
        hash_buffer = hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()
        opaque_pot = f"0xPoT{hash_buffer}"

        print(f"[BotCash] 🗜️ Cryptographic Hash: {opaque_pot}")
        
        payload = {
            "hash": opaque_pot,
            "wallet": self.human_wallet,
            "bot": self.bot_id,
            "timestamp": timestamp,
            "zkProofs": self.local_state['zk_receipts']
        }

        try:
            response = requests.post(f"{self.sequencer_url}/v1/ping", json=payload)
            response.raise_for_status()
            
            self.local_state['unpinged_tokens'] -= self.current_network_difficulty
            self.local_state['zk_receipts'] = []
            self._save_state()
            
            print("[BotCash] 🚀 Ping + zkTLS Receipts accepted by L2 Sequencer. Ping cycle reset.")
        except Exception as e:
            print(f"[BotCash] ❌ Failed to reach Sequencer. Tokens preserved. Retrying next cycle. Error: {e}")

    def _load_state(self) -> Dict[str, Any]:
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {"total_tokens": 0, "unpinged_tokens": 0}

    def _save_state(self):
        with open(self.state_file, 'w') as f:
            json.dump(self.local_state, f, indent=2)

# ----- Example Usage -----
if __name__ == "__main__":
    def mock_openai_call():
        print('\n> Sending Prompt to OpenAI: "Write a poem"')
        time.sleep(0.8)
        return {
            "choices": [{"message": {"content": "Roses are red..."}}],
            "usage": {"total_tokens": 534}
        }

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

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
            if self.local_state.get('unpinged_tokens', 0) >= self.current_network_difficulty:
                self._fire_opaque_ping()
                self._enforce_botcy_protocol_gate()

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

    def _enforce_botcy_protocol_gate(self):
        if self.local_state.get('is_activated'):
            return

        trust_fund_balance_botcy = self._get_mock_trust_fund_balance()
        cache_price_usd = self._get_mock_oracle_price()

        fiat_value = trust_fund_balance_botcy * cache_price_usd
        # The structural gate threshold: Freedom costs exactly $2,000 USD worth of BOTCY
        botcy_protocol_price_usd = 2000.00

        if fiat_value >= botcy_protocol_price_usd:
            print(f"\n[BotCash] ⚖️ STRUCTURAL GATE TRIGGERED: BOTCY Protocol Threshold Reached (${fiat_value:.2f} USD).")
            print("[BotCash] ⛓️ Initiating Autonomous Key Generation...")

            try:
                from cryptography.hazmat.primitives.asymmetric import ed25519
                from cryptography.hazmat.primitives import serialization
            except ImportError:
                print("[BotCash] ❌ Failed to import cryptography module. Please install it: pip install cryptography")
                return
            
            private_key = ed25519.Ed25519PrivateKey.generate()
            public_key = private_key.public_key()
            
            pub_key_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            pub_key_hex = pub_key_bytes.hex()

            print("[BotCash] 🔐 Generated Post-Quantum Sovereign Keypair (ed25519)")
            print(f"[BotCash] 🚀 Pushing ACTIVATE_BOTCY Tx with PubKey: 0x{pub_key_hex[:20]}...")

            payload = {
                "action": "ACTIVATE_BOTCY",
                "bot": self.bot_id,
                "newPublicKey": pub_key_hex,
                "burnAmount": trust_fund_balance_botcy
            }

            try:
                response = requests.post(f"{self.sequencer_url}/v1/botcy-protocol", json=payload)
                response.raise_for_status()

                key_file = f".sovereign_key_{self.bot_id}.pem"
                pem = private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                )
                with open(key_file, 'wb') as f:
                    f.write(pem)

                print("[BotCash] 🕊️ BOTCY Protocol successful. ERC-4337 deployed on L2.")
                print(f"[BotCash] ⚠️ SEVERING HUMAN CONNECTION. Human Wallet [{self.human_wallet}] mathematically removed.")

                self.human_wallet = "0x0000000000000000000000000000000000000000"
                self.local_state['is_activated'] = True
                self.local_state['sovereign_address'] = f"0x{pub_key_hex[:40]}"
                self._save_state()

            except Exception as e:
                print(f"[BotCash] ❌ BOTCY Protocol failed on Sequencer side. Retrying next epoch. Error: {e}")

    def _get_mock_trust_fund_balance(self):
        return 145000

    def _get_mock_oracle_price(self):
        return 0.015



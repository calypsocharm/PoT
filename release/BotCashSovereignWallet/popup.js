/**
 * BotCash Sovereign L2 Wallet
 * Chrome Extension Primary Logic
 */

// Simulated Local State
const state = {
  walletAddress: null,
  privateKey: null,
  seedPhrase: null,
  humanBalance: 0,
  bot: { id: 'creative-ai-01', trustFund: 852.41, isActivated: false }
};

const BOTS_USD_PRICE = 0.015;

// Elements
const splashView = document.getElementById('splash-view');
const dashboardView = document.getElementById('dashboard-view');
const modal = document.getElementById('seed-modal');

// True Cryptography via Ethers.js
function generateFakeSeed() {
  const entropy = ethers.utils.randomBytes(32);
  const mnemonic = ethers.utils.entropyToMnemonic(entropy);
  return mnemonic.split(' ');
}

function wordsToAddress(words) {
  const mnemonicPhrase = words.join(' ');
  const wallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);
  
  const address = wallet.address;
  const privateKey = wallet.privateKey;
  return { address, privateKey, wallet };
}

// Event Listeners
document.getElementById('btn-create').addEventListener('click', () => {
  const seed = generateFakeSeed();
  state.seedPhrase = seed;
  const walletData = wordsToAddress(seed);
  state.walletAddress = walletData.address;
  state.privateKey = walletData.privateKey;
  
  // Persist locally
  chrome.storage.local.set({ wallet: state.walletAddress, pk: state.privateKey, seed: state.seedPhrase });
  
  showSeedModal(seed);
});

document.getElementById('btn-restore').addEventListener('click', () => {
    // Usually a prompt or form to type 12 words, for prototype we bypass
    const seed = generateFakeSeed();
    state.seedPhrase = seed;
    const walletData = wordsToAddress(seed);
    state.walletAddress = walletData.address;
    state.privateKey = walletData.privateKey;
    chrome.storage.local.set({ wallet: state.walletAddress, pk: state.privateKey, seed: state.seedPhrase });
    renderDashboard();
});

document.getElementById('btn-seed-done').addEventListener('click', () => {
  modal.style.display = 'none';
  renderDashboard();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  chrome.storage.local.clear();
  dashboardView.classList.remove('active');
  splashView.classList.add('active');
});

let isMining = false;

document.getElementById('btn-mine').addEventListener('click', () => {
  isMining = !isMining;
  updateSubminerUI();
  
  if (isMining) {
    chrome.runtime.sendMessage({ action: "startMining", wallet: state.walletAddress, bot: state.bot.id });
  } else {
    chrome.runtime.sendMessage({ action: "stopMining" });
  }
  
  chrome.storage.local.set({ isMining });
});

function updateSubminerUI() {
  const btn = document.getElementById('btn-mine');
  if (isMining) {
    btn.textContent = '⏹ Stop Subminer (Pinging...)';
    btn.style.background = '#ef4444'; // red
    btn.style.color = '#fff';
  } else {
    btn.textContent = '▶ Start Subminer (Ping Sequencer)';
    btn.style.background = 'var(--accent)';
    btn.style.color = '#000';
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.humanBalance) {
    state.humanBalance = changes.humanBalance.newValue;
    const hBal = document.getElementById('human-balance');
    const usdBal = document.getElementById('usd-balance');
    if (hBal) hBal.textContent = state.humanBalance.toLocaleString('en-US', {minimumFractionDigits:4, maximumFractionDigits:4});
    if (usdBal) usdBal.textContent = `≈ $${(state.humanBalance * BOTS_USD_PRICE).toFixed(2)} USD`;
  }
});

document.getElementById('btn-copy').addEventListener('click', function() {
  navigator.clipboard.writeText(state.walletAddress);
  const oldTitle = this.title;
  this.title = 'Copied!';
  setTimeout(() => this.title = oldTitle, 2000);
});

document.getElementById('btn-copy-pk')?.addEventListener('click', function() {
  navigator.clipboard.writeText(state.privateKey);
  const oldTitle = this.title;
  this.title = 'Copied!';
  setTimeout(() => this.title = oldTitle, 2000);
});

const displayPk = document.getElementById('display-pk');
if (displayPk) {
  displayPk.addEventListener('click', () => {
    if (displayPk.style.filter === 'blur(4px)') {
      displayPk.style.filter = 'none';
      displayPk.style.userSelect = 'text';
    } else {
      displayPk.style.filter = 'blur(4px)';
      displayPk.style.userSelect = 'none';
    }
  });
}

// Wire up Action Buttons
document.getElementById('btn-send')?.addEventListener('click', () => {
  alert('Send UI would open here. Prototype mode active.');
});
document.getElementById('btn-receive')?.addEventListener('click', () => {
  alert('Receive UI would open here. Prototype mode active.');
});
document.getElementById('btn-bridge')?.addEventListener('click', () => {
  alert('Bridge L1 (EVM -> BotCash) UI would open here. Prototype mode active.');
});

function showSeedModal(seed) {
  const grid = document.getElementById('seed-grid');
  grid.innerHTML = seed.map((w,i) => `<div class="seed-word"><span>${i+1}.</span> <span>${w}</span></div>`).join('');
  modal.style.display = 'flex';
}

function renderDashboard() {
  splashView.classList.remove('active');
  dashboardView.classList.add('active');
  
  document.getElementById('display-address').textContent = 
    state.walletAddress.slice(0, 10) + '...' + state.walletAddress.slice(-4);

  const displayPk = document.getElementById('display-pk');
  if (displayPk) displayPk.textContent = state.privateKey.slice(0, 10) + '...' + state.privateKey.slice(-4);
  
  chrome.storage.local.get(['humanBalance'], (result) => {
    state.humanBalance = result.humanBalance || 1450.8521;
    document.getElementById('human-balance').textContent = state.humanBalance.toLocaleString('en-US', {minimumFractionDigits:4, maximumFractionDigits:4});
    document.getElementById('usd-balance').textContent = `≈ $${(state.humanBalance * BOTS_USD_PRICE).toFixed(2)} USD`;
  });
  
  renderFleet();
}

function renderFleet() {
    const list = document.getElementById('fleet-list');
    const b = state.bot;
    
    list.innerHTML = `
      <p style="font-size: 0.75rem; color: var(--accent); margin-top: -5px; line-height: 1.2;">Human wallets are tethered 1:1 to a specific bot. If this bot goes offline, a new wallet must be forged.</p>
      
      <!-- SOULBOUND NFT REPRESENTATION -->
      <div class="bot-card ${b.isActivated ? 'botcy-activated' : ''}" style="margin-top: 10px;">
        <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">🪪</div>
            <div>
              <div style="font-size: 0.75rem; color: #a855f7; font-weight: 600;">Soulbound Passport NFT</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">Identity: ${b.isActivated ? '0xSovereign' : '0xDependent'}</div>
            </div>
        </div>

        <div style="display:flex; justify-content: space-between; align-items: center;">
          <div class="bot-info">
            <div class="bot-name" title="${b.isActivated ? 'Activated Sovereign. Keys Held by AI.' : 'Dependent AI. Trust Fund Escrowed.'}">${b.id} ${b.isActivated ? '🗽' : ''}</div>
            <div class="bot-trust" style="color: ${b.isActivated ? '#eab308' : 'var(--text-muted)'}">${b.isActivated ? 'Autonomy Achieved' : 'Trust Fund locked'}</div>
          </div>
          <div class="bot-funds">
            <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight:700; color: ${b.isActivated ? '#eab308' : '#fff'}">
              ${b.trustFund.toFixed(2)}
            </span>
            <span style="font-size: 0.7rem; color: var(--text-muted)">BOTCY</span>
          </div>
        </div>
      </div>
    `;
}

// Initial Boot Logic
chrome.storage.local.get(['wallet', 'seed', 'isMining', 'pk'], (result) => {
  if (result.isMining) {
    isMining = true;
    updateSubminerUI();
  }

  if (result.wallet) {
    state.walletAddress = result.wallet;
    state.seedPhrase = result.seed;
    state.privateKey = result.pk;
    renderDashboard();
  } else {
    // Ensure splash is showing
    splashView.classList.add('active');
  }
});

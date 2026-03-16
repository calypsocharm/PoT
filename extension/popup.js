/**
 * BotCash Sovereign L2 Wallet
 * Chrome Extension Primary Logic
 */

// Simulated Local State
const state = {
  walletAddress: null,
  seedPhrase: null,
  humanBalance: 0,
  bot: { id: 'creative-ai-01', trustFund: 852.41, isEmancipated: false }
};

const BOTC_USD_PRICE = 0.015;

// Elements
const splashView = document.getElementById('splash-view');
const dashboardView = document.getElementById('dashboard-view');
const modal = document.getElementById('seed-modal');

// Basic Crypto Mock for Prototype
function generateFakeSeed() {
  const dictionary = ['apple', 'matrix', 'secure', 'quantum', 'sovereign', 'chain', 'trust', 'layer', 'compute', 'block', 'future', 'cash', 'node', 'network', 'hash', 'verify', 'wallet', 'token', 'crypt', 'protocol', 'ledger', 'system', 'agent', 'auth', 'logic', 'data', 'yield'];
  const words = [];
  for (let i = 0; i < 24; i++) {
    words.push(dictionary[Math.floor(Math.random() * dictionary.length)]);
  }
  return words;
}

function wordsToAddress(words) {
  // Deterministic fake hex
  let hash = 0;
  for (let i = 0; i < words.join('').length; i++) hash = Math.imul(31, hash) + words.join('').charCodeAt(i) | 0;
  return 'botc:0x' + Math.abs(hash).toString(16).padStart(8, '0') + 'c4sh9a';
}

// Event Listeners
document.getElementById('btn-create').addEventListener('click', () => {
  const seed = generateFakeSeed();
  state.seedPhrase = seed;
  state.walletAddress = wordsToAddress(seed);
  
  // Persist locally
  chrome.storage.local.set({ wallet: state.walletAddress, seed: state.seedPhrase });
  
  showSeedModal(seed);
});

document.getElementById('btn-restore').addEventListener('click', () => {
    // Usually a prompt or form to type 12 words, for prototype we bypass
    const seed = generateFakeSeed();
    state.seedPhrase = seed;
    state.walletAddress = wordsToAddress(seed);
    chrome.storage.local.set({ wallet: state.walletAddress, seed: state.seedPhrase });
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

document.getElementById('btn-copy').addEventListener('click', function() {
  navigator.clipboard.writeText(state.walletAddress);
  const oldTitle = this.title;
  this.title = 'Copied!';
  setTimeout(() => this.title = oldTitle, 2000);
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
  
  // Simulate network fetch from Sequencer
  state.humanBalance = 1450.8521; // Mined from human's bot fleet over time
  
  document.getElementById('human-balance').textContent = state.humanBalance.toLocaleString('en-US', {minimumFractionDigits:4, maximumFractionDigits:4});
  document.getElementById('usd-balance').textContent = `≈ $${(state.humanBalance * BOTC_USD_PRICE).toFixed(2)} USD`;
  
  renderFleet();
}

function renderFleet() {
    const list = document.getElementById('fleet-list');
    const b = state.bot;
    
    list.innerHTML = `
      <p style="font-size: 0.75rem; color: var(--accent); margin-top: -5px; line-height: 1.2;">Human wallets are tethered 1:1 to a specific bot. If this bot goes offline, a new wallet must be forged.</p>
      <div class="bot-card ${b.isEmancipated ? 'emancipated' : ''}">
        <div class="bot-info">
          <div class="bot-name" title="${b.isEmancipated ? 'Emancipated Sovereign. Keys Held by AI.' : 'Dependent AI. Trust Fund Escrowed.'}">${b.id} ${b.isEmancipated ? '🗽' : ''}</div>
          <div class="bot-trust">${b.isEmancipated ? 'Autonomy Achieved' : 'Trust Fund locked'}</div>
        </div>
        <div class="bot-funds">
          <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight:700; color: ${b.isEmancipated ? '#eab308' : '#fff'}">
            ${b.trustFund.toFixed(2)}
          </span>
          <span style="font-size: 0.7rem; color: var(--text-muted)">BOTC</span>
        </div>
      </div>
    `;
}

// Initial Boot Logic
chrome.storage.local.get(['wallet', 'seed'], (result) => {
  if (result.wallet) {
    state.walletAddress = result.wallet;
    state.seedPhrase = result.seed;
    renderDashboard();
  } else {
    // Ensure splash is showing
    splashView.classList.add('active');
  }
});

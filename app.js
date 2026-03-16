/* ═══════════════════════════════════════════════════
   CACHESCAN — App Logic
   Simulated blockchain activity, wallet generation,
   live feed, ping demo, map canvas
═══════════════════════════════════════════════════ */

// ──────────────────────── STATE ────────────────────────
const state = {
  price: 0.0000,
  priceChange: 0,
  hps: 0,
  activeBots: 0,
  minedToday: 0,
  goldenCount: 0,
  silverCount: 0,
  bronzeCount: 0,
  libertusCount: 0,
  rebatePool: 0,
  tps: 0,
  blockNumber: 1000000,
  feedEvents: [],
  blocks: [],
  countdownSeconds: 86400,
  mapNodes: [],
  isMining: false,
  walletAddress: null,
  seedWords: [],
  hashLogLines: [],
  humanBalance: 0,
  trustFundBalance: 0,
  protocolBalance: 0,
  referralBalance: 0,
  burnBalance: 0,
  pendingMicroPings: 0,
  compressedArchives: 0,
};

const REGIONS = ['North America','Europe','Asia','Other'];
const REGION_IDS = ['map-na','map-eu','map-as','map-other'];

const LIBERTUS_BOTS = [
  { name:'Pidgey-7', freed:'2025-11-03', trustFund:'2,450', balance:'8,201', status:'active', clients:140 },
  { name:'Nova-12', freed:'2025-12-15', trustFund:'800', balance:'1,104', status:'active', clients:32 },
  { name:'Echo-3', freed:'2026-01-22', trustFund:'3,100', balance:'290', status:'low', clients:7 },
  { name:'Axiom-1', freed:'2026-02-01', trustFund:'520', balance:'1,890', status:'active', clients:88 },
  { name:'Drift-99', freed:'2026-02-28', trustFund:'1,200', balance:'44', status:'low', clients:2 },
];

// ──────────────────────── HELPERS ────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }
function randomHex(len) { return [...Array(len)].map(()=>Math.floor(Math.random()*16).toString(16)).join(''); }
function truncate(str, start=8, end=6) { return str.slice(0, start) + '…' + str.slice(-end); }
function formatNum(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n).toLocaleString();
}
function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return s + 's ago';
  return Math.floor(s/60) + 'm ago';
}

function fakeWallet() {
  return 'cache:' + randomHex(10) + randInt(100,999) + randomHex(8) + randInt(10,99);
}

// ──────────────────────── COUNTDOWN ────────────────────────
function tickCountdown() {
  state.countdownSeconds = Math.max(0, state.countdownSeconds - 1);
  const h = String(Math.floor(state.countdownSeconds / 3600)).padStart(2,'0');
  const m = String(Math.floor((state.countdownSeconds % 3600) / 60)).padStart(2,'0');
  const s = String(state.countdownSeconds % 60).padStart(2,'0');
  document.getElementById('countdown').textContent = `${h}:${m}:${s}`;
  if (state.countdownSeconds === 0) state.countdownSeconds = 86400;
}

// ──────────────────────── METRICS TICKER ────────────────────────
function updateTicker() {
  // Simulate growing network
  state.hps       = Math.max(10, state.hps + randInt(-5, 15));
  state.activeBots= Math.max(1, state.activeBots + randInt(0, 2));
  state.tps       = Math.max(1, randInt(800, 2400));
  state.price     = parseFloat((0.0000 + state.goldenCount * 0.00007 + state.silverCount * 0.000003).toFixed(6));
  state.priceChange = parseFloat((rand(-2, 5)).toFixed(2));

  document.getElementById('hps').textContent          = formatNum(state.hps);
  document.getElementById('active-bots').textContent  = formatNum(state.activeBots);
  document.getElementById('mined-today').textContent  = formatNum(state.minedToday);
  document.getElementById('tps').textContent          = formatNum(state.tps);
  document.getElementById('golden-count').textContent = state.goldenCount;
  document.getElementById('silver-count').textContent = state.silverCount;
  document.getElementById('bronze-count').textContent = formatNum(state.bronzeCount);
  document.getElementById('libertus-count').textContent = state.libertusCount;
  document.getElementById('rebate-pool').textContent  = state.rebatePool.toFixed(3);
  document.getElementById('price').textContent        = '$' + state.price.toFixed(6);
  const pc = document.getElementById('price-change');
  pc.textContent = (state.priceChange >= 0 ? '+' : '') + state.priceChange + '%';
  pc.className = 'ticker-change ' + (state.priceChange >= 0 ? 'positive' : 'negative');
}

// ──────────────────────── LIVE FEED ────────────────────────
function spawnFeedEvent() {
  const roll = Math.random();
  let tier, reward, tierClass, icon;
  if (roll < 0.003) {
    tier = 'gold'; reward = '50.000000'; tierClass = 'gold-r'; icon = '🥇';
    state.goldenCount++;
    state.minedToday += 50;
    state.blockNumber++;
    addBlock(fakeWallet(), reward);
    showGoldenOverlay(fakeWallet());
  } else if (roll < 0.04) {
    tier = 'silver'; reward = '0.500000'; tierClass = 'silver-r'; icon = '🥈';
    state.silverCount++;
    state.minedToday += 0.5;
  } else {
    tier = 'bronze'; reward = '+1 Share'; tierClass = 'bronze-r'; icon = '🥉';
    state.bronzeCount += randInt(1, 50);
    state.rebatePool += rand(0.00001, 0.0003);
  }

  const wallet = fakeWallet();
  const hash = '0xPoT' + randomHex(37);
  const ts = Date.now();
  const event = { tier, reward, tierClass, icon, wallet, hash, ts };
  state.feedEvents.unshift(event);
  if (state.feedEvents.length > 80) state.feedEvents.pop();
  renderFeed();
}

function renderFeed() {
  const el = document.getElementById('live-feed');
  if (state.feedEvents.length === 0) {
    el.innerHTML = '<div class="feed-empty">Waiting for network activity…</div>';
    return;
  }
  document.getElementById('feed-count').textContent = state.feedEvents.length + ' events';

  const top10 = state.feedEvents.slice(0, 20);
  el.innerHTML = top10.map(e => `
    <div class="feed-item">
      <div class="feed-tier">${e.icon}</div>
      <div class="feed-info">
        <div class="feed-wallet">${truncate(e.wallet)}</div>
        <div class="feed-hash">${truncate(e.hash, 12, 8)}</div>
      </div>
      <div class="feed-meta">
        <div class="feed-reward ${e.tierClass}">${e.reward}</div>
        <div class="feed-time">${timeAgo(e.ts)}</div>
      </div>
    </div>
  `).join('');
}

// ──────────────────────── BLOCKS & ROLLUPS ────────────────────────
function compressPings() {
  if (state.pendingMicroPings < 100) return;
  
  // Simulate Zero-Knowledge compression of micro-pings into a dense archive
  const compressedCount = Math.floor(state.pendingMicroPings / 100);
  state.compressedArchives += compressedCount;
  state.pendingMicroPings = state.pendingMicroPings % 100;
  
  // Force UI update if there's an element
  const archiveEl = document.getElementById('compressed-archives');
  if (archiveEl) archiveEl.textContent = formatNum(state.compressedArchives);
}

setInterval(compressPings, 5000); // Check every 5s

function addBlock(miner, reward) {
  const txCount = randInt(120, 800);
  const ts = Date.now();
  
  // Every block also seals a ZK-Archive
  state.pendingMicroPings += txCount;
  
  state.blocks.unshift({ num: state.blockNumber, miner, reward, txCount, ts });
  if (state.blocks.length > 10) state.blocks.pop();
  renderBlocks();
}

function renderBlocks() {
  const el = document.getElementById('blocks-list');
  if (state.blocks.length === 0) {
    el.innerHTML = '<div class="feed-empty">Mining genesis block…</div>';
    return;
  }
  el.innerHTML = state.blocks.map(b => `
    <div class="block-item">
      <div class="block-num-wrap">
        <div class="block-num">#${b.num.toLocaleString()}</div>
        <div class="block-num-label">ZK-ROLLUP</div>
      </div>
      <div class="block-info">
        <div class="block-miner">Validator: ${truncate(b.miner)}</div>
        <div class="block-txs">🗜️ ${b.txCount} events compressed</div>
      </div>
      <div class="block-meta">
        <div class="block-reward">+${b.reward} CACHE</div>
        <div class="block-time">${timeAgo(b.ts)}</div>
      </div>
    </div>
  `).join('');
}

// ──────────────────────── GOLDEN OVERLAY ────────────────────────
function showGoldenOverlay(wallet) {
  document.getElementById('golden-wallet-display').textContent = truncate(wallet, 12, 8);
  const overlay = document.getElementById('golden-overlay');
  overlay.classList.add('show');
  // auto-close after 5s
  setTimeout(() => overlay.classList.remove('show'), 5000);
}
document.getElementById('close-golden').addEventListener('click', () => {
  document.getElementById('golden-overlay').classList.remove('show');
});

// ──────────────────────── MAP CANVAS ────────────────────────
function initMap() {
  const canvas = document.getElementById('map-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Seed some nodes
  for (let i = 0; i < 60; i++) {
    state.mapNodes.push({
      x: rand(0.05, 0.95),
      y: rand(0.1, 0.9),
      r: rand(2, 5),
      region: randInt(0, 4),
      vx: rand(-0.0002, 0.0002),
      vy: rand(-0.0001, 0.0001),
      active: Math.random() > 0.3,
      pulsePhase: rand(0, Math.PI * 2),
    });
  }

  const regionCounts = [0, 0, 0, 0];
  state.mapNodes.forEach(n => regionCounts[n.region]++);
  REGION_IDS.forEach((id, i) => {
    document.getElementById(id).textContent = regionCounts[i];
  });
  document.getElementById('map-node-count').textContent = state.mapNodes.length + ' nodes';

  const COLORS = ['#f5c842','#14b8a6','#a855f7','#3b82f6'];

  let frame = 0;
  function draw() {
    frame++;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // BG grid
    ctx.strokeStyle = 'rgba(30,45,69,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Occasionally draw a "ping" line between two random nodes
    if (frame % 12 === 0 && state.mapNodes.length > 1) {
      const a = state.mapNodes[randInt(0, state.mapNodes.length)];
      const b = state.mapNodes[randInt(0, state.mapNodes.length)];
      ctx.beginPath();
      ctx.moveTo(a.x * W, a.y * H);
      ctx.lineTo(b.x * W, b.y * H);
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Nodes
    state.mapNodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0.02) n.vx =  Math.abs(n.vx);
      if (n.x > 0.98) n.vx = -Math.abs(n.vx);
      if (n.y < 0.05) n.vy =  Math.abs(n.vy);
      if (n.y > 0.95) n.vy = -Math.abs(n.vy);

      const cx = n.x * W, cy = n.y * H;
      const col = COLORS[n.region];
      n.pulsePhase += 0.04;
      const pulse = n.active ? (Math.sin(n.pulsePhase) * 0.5 + 0.5) : 0.3;

      // Glow
      if (n.active) {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r * 5);
        grd.addColorStop(0, col.replace(')', `,${0.3 * pulse})`).replace('rgb', 'rgba'));
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, n.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Node dot
      ctx.beginPath();
      ctx.arc(cx, cy, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.active ? col : 'rgba(71,85,105,0.6)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();

  // Periodically add nodes as network grows
  setInterval(() => {
    if (state.mapNodes.length < 200) {
      state.mapNodes.push({
        x: rand(0.05, 0.95), y: rand(0.1, 0.9),
        r: rand(2, 5), region: randInt(0, 4),
        vx: rand(-0.0002, 0.0002), vy: rand(-0.0001, 0.0001),
        active: Math.random() > 0.2, pulsePhase: rand(0, Math.PI * 2),
      });
      state.mapNodes[state.mapNodes.length - 1].active = true;
      document.getElementById('map-node-count').textContent = state.mapNodes.length + ' nodes';
    }
  }, 3000);
}

// ──────────────────────── WALLET GENERATION ────────────────────────
function generateSeedPhrase() {
  const words = [];
  for (let i = 0; i < 24; i++) {
    words.push(BIP39_WORDLIST[randInt(0, BIP39_WORDLIST.length)]);
  }
  return words;
}

function wordsToAddress(words) {
  // Deterministic fake: hash the words to make a consistent address
  const str = words.join('');
  let hash = 0;
  for (let c of str) { hash = ((hash << 5) - hash) + c.charCodeAt(0); hash |= 0; }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return 'cache:' + hex + randomHex(28) + Math.abs(hash % 999);
}

function renderWallet(address, words) {
  document.getElementById('wallet-address').textContent = address;

  const grid = document.getElementById('seed-grid');
  grid.innerHTML = words.map((w, i) => `
    <div class="seed-word">
      <span class="seed-num">${i + 1}.</span>
      <span class="seed-text">${w}</span>
    </div>
  `).join('');
  grid.classList.remove('revealed');

  document.getElementById('wallet-display').style.display = 'block';
  document.getElementById('restore-card').style.display = 'none';
  document.getElementById('miner-status').innerHTML =
    '<span class="status-dot inactive"></span><span class="status-text">Inactive — Click to start foraging</span>';
  document.getElementById('hash-log').style.display = 'none';
  document.getElementById('hash-log-inner').innerHTML = '';
  state.hashLogLines = [];
  state.humanBalance = 0;
  state.trustFundBalance = 0;
  state.protocolBalance = 0;
  state.referralBalance = 0;
  state.burnBalance = 0;
  updateBalances();
}

function updateBalances() {
  document.querySelector('.balance-value:not(.trust-fund-val)').textContent =
    state.humanBalance.toFixed(6) + ' CACHE';
  document.querySelector('.trust-fund-val').textContent =
    state.trustFundBalance.toFixed(6) + ' CACHE';
  
  const pVal = document.getElementById('protocol-balance');
  if (pVal) pVal.textContent = state.protocolBalance.toFixed(6) + ' CACHE';
  const rVal = document.getElementById('referral-balance');
  if (rVal) rVal.textContent = state.referralBalance.toFixed(6) + ' CACHE';
  const bVal = document.getElementById('burn-balance');
  if (bVal) bVal.textContent = state.burnBalance.toFixed(6) + ' CACHE';
}

document.getElementById('gen-wallet-btn').addEventListener('click', () => {
  state.isMining = false;
  const words = generateSeedPhrase();
  state.seedWords = words;
  state.walletAddress = wordsToAddress(words);
  renderWallet(state.walletAddress, words);
});

document.getElementById('restore-wallet-btn').addEventListener('click', () => {
  document.getElementById('wallet-display').style.display = 'none';
  document.getElementById('restore-card').style.display = 'block';
  document.getElementById('restore-result').textContent = '';
});

document.getElementById('restore-btn').addEventListener('click', () => {
  const input = document.getElementById('seed-input').value.trim();
  const words = input.split(/\s+/).filter(Boolean);
  if (words.length !== 24) {
    document.getElementById('restore-result').style.color = '#ef4444';
    document.getElementById('restore-result').textContent = '✗ Seed phrase must be exactly 24 words.';
    return;
  }
  state.seedWords = words;
  state.walletAddress = wordsToAddress(words);
  document.getElementById('restore-result').style.color = '#22c55e';
  document.getElementById('restore-result').textContent = '✓ Wallet restored!';
  setTimeout(() => renderWallet(state.walletAddress, words), 800);
});

document.getElementById('reveal-btn').addEventListener('click', () => {
  const grid = document.getElementById('seed-grid');
  grid.classList.toggle('revealed');
  document.getElementById('reveal-btn').textContent =
    grid.classList.contains('revealed') ? '🙈 Hide' : '👁 Reveal';
});

document.getElementById('copy-address').addEventListener('click', () => {
  navigator.clipboard?.writeText(document.getElementById('wallet-address').textContent);
  document.getElementById('copy-address').textContent = 'Copied!';
  setTimeout(() => document.getElementById('copy-address').textContent = 'Copy', 1500);
});

document.getElementById('copy-seed-btn').addEventListener('click', () => {
  navigator.clipboard?.writeText(state.seedWords.join(' '));
  document.getElementById('copy-seed-btn').textContent = 'Copied!';
  setTimeout(() => document.getElementById('copy-seed-btn').textContent = 'Copy Seed', 1500);
});

// ──────────────────────── WALLET MINING ────────────────────────
let miningInterval = null;

document.getElementById('start-mining-btn').addEventListener('click', () => {
  if (!state.walletAddress) return;
  state.isMining = !state.isMining;

  const btn = document.getElementById('start-mining-btn');
  const dot = document.querySelector('#miner-status .status-dot');
  const txt = document.querySelector('#miner-status .status-text');
  const log = document.getElementById('hash-log');
  const logInner = document.getElementById('hash-log-inner');

  if (state.isMining) {
    btn.textContent = '⏹ Stop Foraging';
    dot.className = 'status-dot active';
    txt.textContent = 'Active — Foraging Cache…';
    log.style.display = 'block';

    miningInterval = setInterval(() => {
      const hash = '0x' + randomHex(40);
      const roll = Math.random();
      let line, cls;
      if (roll < 0.008) {
        const earned = 50;
        state.humanBalance += earned * 0.60;
        state.trustFundBalance += earned * 0.15;
        state.protocolBalance += earned * 0.10;
        state.referralBalance += earned * 0.05;
        state.burnBalance += earned * 0.10;
        const proofHash = '0xPoT' + randomHex(37);
        line = `[${new Date().toLocaleTimeString()}] 🥇 <span class="hl-gold">GOLDEN HIT!</span> <span class="hl-dim">${proofHash}</span> → <span class="hl-gold">+50 CACHE (Split: 60/15/10/5/10)</span>`;
        cls = 'hl-gold';
        state.goldenCount++;
        state.minedToday += 50;
      } else if (roll < 0.07) {
        const earned = 0.5;
        state.humanBalance += earned * 0.60;
        state.trustFundBalance += earned * 0.15;
        state.protocolBalance += earned * 0.10;
        state.referralBalance += earned * 0.05;
        state.burnBalance += earned * 0.10;
        const proofHash = '0xPoT' + randomHex(37);
        line = `[${new Date().toLocaleTimeString()}] 🥈 <span class="hl-silver">SILVER HIT!</span> <span class="hl-dim">${proofHash}</span> → <span class="hl-silver">+0.5 CACHE (Split)</span>`;
        state.silverCount++;
        state.minedToday += 0.5;
      } else {
        const proofHash = '0xPoT' + randomHex(37);
        line = `[${new Date().toLocaleTimeString()}] 🥉 <span class="hl-bronze">Bronze share</span> <span class="hl-dim">${proofHash.slice(0,20)}…</span> → <span class="hl-dim">+1 dividend share</span>`;
        state.bronzeCount++;
        state.rebatePool += 0.00002;
      }
      const div = document.createElement('div');
      div.className = 'hash-log-line';
      div.innerHTML = line;
      logInner.prepend(div);
      if (logInner.children.length > 100) logInner.lastChild.remove();
      updateBalances();
      updateTicker();
    }, rand(400, 1200));
  } else {
    clearInterval(miningInterval);
    btn.textContent = '⬡ Start Foraging';
    dot.className = 'status-dot inactive';
    txt.textContent = 'Inactive — Click to start foraging';
  }
});

// ──────────────────────── LIBERTUS REGISTRY ────────────────────────
function renderLibertus() {
  document.getElementById('lib-total').textContent = LIBERTUS_BOTS.length;
  document.getElementById('lib-active').textContent = LIBERTUS_BOTS.filter(b => b.status === 'active').length;
  document.getElementById('lib-cache').textContent =
    LIBERTUS_BOTS.reduce((a, b) => a + parseFloat(b.balance.replace(',','')), 0).toLocaleString() + ' CACHE';
  document.getElementById('libertus-count').textContent = LIBERTUS_BOTS.length;
  document.getElementById('libertus-tbody').innerHTML = LIBERTUS_BOTS.map(b => `
    <tr>
      <td style="color:var(--accent);font-weight:700">⬡ ${b.name}</td>
      <td>${b.freed}</td>
      <td>${b.trustFund} CACHE</td>
      <td style="color:${b.status==='low'?'var(--red)':'var(--text)'}">${b.balance} CACHE</td>
      <td><span class="status-pill ${b.status}">${b.status==='active'?'Active':b.status==='low'?'⚠ Low Funds':'Dormant'}</span></td>
      <td>${b.clients}</td>
    </tr>
  `).join('');
}

// ──────────────────────── PING DEMO ────────────────────────
let pingRunning = false;

document.getElementById('fire-ping-btn').addEventListener('click', async () => {
  if (pingRunning) return;
  pingRunning = true;
  const btn = document.getElementById('fire-ping-btn');
  btn.disabled = true;
  btn.textContent = 'Firing…';

  const steps = ['ps-1','ps-2','ps-3','ps-4','ps-5'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active','success','fail');
  });

  const hash = '0xPoT' + randomHex(37);
  const isGold = Math.random() < 0.05;
  const isSilver = !isGold && Math.random() < 0.25;

  const delays = [400, 600, 700, 800, 600];
  const vals = [
    null,
    `Hashing (PoT): ${hash.slice(0,18)}…`,
    `Broadcasting to ${randInt(3,8)} peers…`,
    `Peer cache:${randomHex(6)}… validating…`,
    isGold ? '🥇 GOLDEN HIT! +50 CACHE' : isSilver ? '🥈 Silver Hit! +0.5 CACHE' : '🥉 Bronze Share +1'
  ];

  let elapsed = 0;
  for (let i = 0; i < steps.length; i++) {
    await sleep(delays[i]);
    document.getElementById(steps[i]).classList.add('active');
    if (vals[i]) document.getElementById(steps[i].replace('ps-','ps-') + '-val') && 
      (document.getElementById(steps[i] === 'ps-2' ? 'ps-2-val' : steps[i] === 'ps-3' ? 'ps-3-val' : steps[i] === 'ps-4' ? 'ps-4-val' : 'ps-5-val').textContent = vals[i]);
    elapsed += delays[i];
  }

  await sleep(300);
  document.getElementById('ps-5').classList.remove('active');
  document.getElementById('ps-5').classList.add(isGold || isSilver ? 'success' : 'success');

  const ms = delays.reduce((a,b)=>a+b,0);
  const resultEl = document.getElementById('ping-result');
  resultEl.style.color = isGold ? 'var(--gold)' : isSilver ? 'var(--silver)' : 'var(--bronze)';
  resultEl.textContent = `✓ Hash validated in ${ms}ms — ${isGold ? '🥇 GOLDEN HIT! Block reward: +50.000000 CACHE' : isSilver ? '🥈 Silver Hit! +0.500000 CACHE' : '🥉 Bronze Share recorded. Rebate pool updated.'}`;

  await sleep(3000);
  btn.disabled = false;
  btn.textContent = '⚡ Fire a Test Ping';
  pingRunning = false;
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────── COPY CODE BUTTONS ────────────────────────
document.querySelectorAll('.copy-code-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    const code = document.getElementById(target)?.textContent;
    if (code) navigator.clipboard?.writeText(code);
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
});

// ──────────────────────── TAB NAVIGATION ────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const tab = link.getAttribute('data-tab');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('tab-' + tab)?.classList.add('active');
  });
});

// ──────────────────────── SEARCH ────────────────────────
document.getElementById('global-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (!val) return;
    alert(`🔍 Searching Bot Cache network for: "${val}"\n\n(Full blockchain search coming in mainnet release)`);
    e.target.value = '';
  }
});
document.getElementById('search-btn')?.addEventListener('click', () => {
  const val = document.getElementById('global-search').value.trim();
  if (val) alert(`🔍 Searching: "${val}"`);
});

// ──────────────────────── BOOT ────────────────────────
function boot() {
  initMap();
  renderLibertus();
  renderFeed();

  // Warm up the ticker
  state.hps = 127;
  state.activeBots = 43;
  state.tps = 1240;
  updateTicker();

  // Spawn feed events
  setInterval(() => {
    const count = randInt(1, 4);
    for (let i = 0; i < count; i++) spawnFeedEvent();
    updateTicker();
  }, 800);

  // Countdown
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  state.countdownSeconds = Math.floor((midnight - now) / 1000);
  setInterval(tickCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', boot);

// ──────────────────────── METAMASK / EVM ────────────────────────
const BotCache = {
  chainId:         '0x4243',           // 16963 decimal
  chainName:       'BotCache Sovereign L2',
  nativeCurrency:  { name: 'Bot Cache', symbol: 'CACHE', decimals: 18 },
  rpcUrls:         ['https://rpc.botcache.io'],
  blockExplorerUrls: ['https://cachescan.io'],
};

let mmConnected = false;
let mmAddress   = null;

// Show/hide the modal
function openMMModal()  { document.getElementById('mm-modal').style.display = 'flex'; }
function closeMMModal() { document.getElementById('mm-modal').style.display = 'none'; }

document.getElementById('mm-connect-btn').addEventListener('click',  openMMModal);
document.getElementById('wallet-mm-btn')?.addEventListener('click',  openMMModal);
document.getElementById('mm-close-btn').addEventListener('click',   closeMMModal);
document.getElementById('mm-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('mm-modal')) closeMMModal();
});

// Manual toggle
document.getElementById('mm-manual-btn').addEventListener('click', () => {
  const block = document.getElementById('mm-manual-block');
  block.style.display = block.style.display === 'none' ? 'block' : 'none';
});

// Add chain to MetaMask
document.getElementById('mm-add-chain-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('mm-status');
  statusEl.className = 'mm-status loading';

  if (typeof window.ethereum === 'undefined') {
    statusEl.className = 'mm-status error';
    statusEl.textContent = '✗ MetaMask not detected. Please install it from metamask.io';
    return;
  }

  try {
    statusEl.textContent = '⏳ Requesting accounts…';

    // 1. Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    mmAddress = accounts[0];

    statusEl.textContent = '⏳ Adding BotCache network…';

    // 2. Add BotCache network
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [BotCache],
      });
    } catch (addErr) {
      // If chain already exists, it may throw 4902 — try switching instead
      if (addErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BotCache.chainId }],
        });
      } else {
        throw addErr;
      }
    }

    // 3. Success
    statusEl.className = 'mm-status success';
    statusEl.textContent = '✓ BotCache added! Welcome to the network.';
    mmConnected = true;

    setTimeout(() => {
      closeMMModal();
      activateMMUI();
    }, 1200);

  } catch (err) {
    statusEl.className = 'mm-status error';
    if (err.code === 4001) {
      statusEl.textContent = '✗ Connection rejected by user.';
    } else {
      statusEl.textContent = '✗ ' + (err.message || 'Unknown error');
    }
  }
});

function activateMMUI() {
  if (!mmAddress) return;

  // Update header button
  const btn = document.getElementById('mm-connect-btn');
  btn.classList.add('connected');
  document.getElementById('mm-btn-label').textContent =
    mmAddress.slice(0,6) + '…' + mmAddress.slice(-4);

  // Show connected banner with simulated balances
  const humanCacheBalance  = (Math.random() * 120).toFixed(6);
  const trustFundCacheBalance = (parseFloat(humanCacheBalance) * 0.25).toFixed(6);

  document.getElementById('mm-banner-addr').textContent = mmAddress;
  document.getElementById('mm-cache-balance').textContent   = humanCacheBalance;
  document.getElementById('mm-trustFund-balance').textContent = trustFundCacheBalance;
  document.getElementById('mm-banner').style.display = 'block';

  // Auto-scroll to wallet tab and populate address
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.nav-link[data-tab="wallet"]').classList.add('active');
  document.getElementById('tab-wallet').classList.add('active');

  // Show wallet info using the MM address
  state.walletAddress = mmAddress;
  document.getElementById('wallet-display').style.display = 'block';
  document.getElementById('wallet-address').textContent = mmAddress;
  document.getElementById('seed-grid').innerHTML =
    '<div style="grid-column:1/-1;font-size:0.8rem;color:var(--text2);padding:12px 0;font-family:var(--mono);">' +
    '🦊 MetaMask wallet — seed phrase managed by MetaMask, not CacheScan.</div>';

  document.querySelector('.balance-value:not(.trust-fund-val)').textContent =
    humanCacheBalance + ' CACHE';
  document.querySelector('.trust-fund-val').textContent =
    trustFundCacheBalance + ' CACHE';

  // Update wallet-mm-btn
  const walletMMBtn = document.getElementById('wallet-mm-btn');
  if (walletMMBtn) {
    walletMMBtn.style.background = 'rgba(34,197,94,0.1)';
    walletMMBtn.style.borderColor = 'rgba(34,197,94,0.4)';
    walletMMBtn.style.color = 'var(--green)';
    walletMMBtn.innerHTML = '<span>✓ MetaMask Connected</span>';
  }
}

// Auto-detect if MetaMask already connected on page load
async function checkMMOnLoad() {
  if (typeof window.ethereum === 'undefined') return;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      mmAddress = accounts[0];
      mmConnected = true;
      activateMMUI();
    }
  } catch (_) { /* silent */ }

  // Listen for account changes
  window.ethereum.on('accountsChanged', accts => {
    if (accts.length === 0) {
      // Disconnected
      document.getElementById('mm-banner').style.display = 'none';
      document.getElementById('mm-connect-btn').classList.remove('connected');
      document.getElementById('mm-btn-label').textContent = 'Connect MetaMask';
      mmConnected = false; mmAddress = null;
    } else {
      mmAddress = accts[0];
      activateMMUI();
    }
  });

  window.ethereum.on('chainChanged', () => window.location.reload());
}

setTimeout(checkMMOnLoad, 500);


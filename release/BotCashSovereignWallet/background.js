// Service worker for BotCash Wallet
// Runs background tasks such as polling the sequencer for network updates or incoming transactions.

chrome.runtime.onInstalled.addListener(() => {
    console.log("BotCash Sovereign Wallet Extension Installed.");
});

// E.g., poll the sequencer every 5 minutes
chrome.alarms.create("pollSequencer", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pollSequencer") {
        // Here we would safely query rpc.botcash.io for wallet balance updates
        // To update the extension badge text with new earnings.
        console.log("Background service: Polling BotCash sequencer...");
    }
});

let miningInterval = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startMining") {
        if (miningInterval) clearInterval(miningInterval);
        console.log("Starting subminer for", request.wallet, request.bot);
        
        // Ping every 1.5 seconds to make it visible quickly
        miningInterval = setInterval(() => {
            pingSequencer(request.wallet, request.bot);
        }, 1500); 
    } else if (request.action === "stopMining") {
        if (miningInterval) clearInterval(miningInterval);
        miningInterval = null;
        console.log("Stopped subminer");
    }
});

async function pingSequencer(wallet, bot) {
    try {
        const hashStr = Array.from({length: 37}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const hash = '0xPoT' + hashStr;
        
        const res = await fetch("http://localhost:4243/v1/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bot: bot,
                wallet: wallet,
                hash: hash
            })
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        
        if (data.reward && data.reward > 0) {
            chrome.storage.local.get(['humanBalance'], (result) => {
                let current = result.humanBalance || 1450.8521;
                chrome.storage.local.set({ humanBalance: current + data.reward * 0.6 });
            });
        }
    } catch (e) {
        // Silent catch for sequencer not running
    }
}

// Resume mining if left ON
chrome.storage.local.get(['isMining', 'wallet'], (result) => {
    if (result.isMining && result.wallet) {
        console.log("Resuming subminer after reload...");
        // Assuming bot is creative-ai-01
        if (!miningInterval) {
           miningInterval = setInterval(() => {
               pingSequencer(result.wallet, 'creative-ai-01');
           }, 1500); 
        }
    }
});

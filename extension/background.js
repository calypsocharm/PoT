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

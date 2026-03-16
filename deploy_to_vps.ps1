$vpsHost = "root@72.62.129.226"
$targetDir = "/opt/botcash-l2"

Write-Host "🚀 Starting BotCash L2 Native VPS Deployment Pipeline..." -ForegroundColor Cyan

# Ensure target directory exists
ssh $vpsHost "mkdir -p $targetDir/sequencer/core $targetDir/data"

# Upload Frontend (Web Hub & Explorer)
Write-Host "`n📡 Transmitting Web Platform..." -ForegroundColor Yellow
scp -r index.html style.css app.js assets $vpsHost`:$targetDir/

# Upload the L2 Sequencer Engine & Trust Fund DB Schema
Write-Host "`n⚙️ Transmitting Core Sequencer Protocol..." -ForegroundColor Yellow
scp -r sequencer/server.js $vpsHost`:$targetDir/sequencer/
scp -r sequencer/core/* $vpsHost`:$targetDir/sequencer/core/
scp package.json $vpsHost`:$targetDir/

# Restoring PM2 on the server
Write-Host "`n🔄 Rebooting L2 Network via PM2 cluster..." -ForegroundColor Yellow
ssh $vpsHost "cd $targetDir && npm install --omit=dev && pm2 restart botcash-sequencer --update-env || pm2 start sequencer/server.js --name botcash-sequencer"

Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "🌐 The L2 Cryptographic Sequence is now running live on 72.62.129.226:4243" -ForegroundColor Green

$vpsHost = "root@72.62.129.226"
$targetDir = "/opt/botcash-l2"

Write-Host "Starting BotCash L2 Native VPS Deployment Pipeline..." -ForegroundColor Cyan

ssh $vpsHost "mkdir -p $targetDir/sequencer/core $targetDir/data"

Write-Host "Transmitting Web Platform..." -ForegroundColor Yellow
scp -r index.html style.css app.js assets "$vpsHost`:$targetDir/"

Write-Host "Transmitting Core Sequencer Protocol..." -ForegroundColor Yellow
scp -r sequencer/server.js "$vpsHost`:$targetDir/sequencer/"
scp -r sequencer/core/* "$vpsHost`:$targetDir/sequencer/core/"
scp package.json "$vpsHost`:$targetDir/"

Write-Host "Rebooting L2 Network via PM2 cluster..." -ForegroundColor Yellow
ssh $vpsHost "cd $targetDir ; npm install --omit=dev ; pm2 restart botcash-sequencer --update-env || pm2 start sequencer/server.js --name botcash-sequencer"

Write-Host "Updating NGINX Web Root..." -ForegroundColor Yellow
ssh $vpsHost "cp -r /opt/botcash-l2/index.html /opt/botcash-l2/style.css /opt/botcash-l2/app.js /opt/botcash-l2/assets /var/www/botcash/"

Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "The L2 Cryptographic Sequence is now running live on 72.62.129.226:4243" -ForegroundColor Green

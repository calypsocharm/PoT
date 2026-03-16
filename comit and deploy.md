# Full Website Commit and VPS Deployment Guide

This document outlines the step-by-step process of saving your changes locally, pushing them to GitHub, and pulling them onto the live VPS server to update the BotCash network.

## 1. Local Commit and Push
When you are ready to apply changes you made on your local machine, run the following commands in the `botcache-scan` directory using your Terminal/PowerShell:

```powershell
# 1. Add all changed files to staging
git add .

# 2. Commit the changes with a descriptive message
git commit -m "Your descriptive commit message here"

# 3. Push the changes to the central GitHub repository
git push origin main
```

## 2. Connect to the Live VPS
You need to SSH into your VPS (Virtual Private Server) where the live application is hosted:

```bash
# Replace <SERVER_IP> with the actual IP address of your VPS
ssh root@<SERVER_IP>
```
*(If you use a different user, like `ubuntu` or `pidgey`, replace `root` with that username)*

## 3. Pull Updates on the VPS
Once you are logged into the server, navigate to your live application folder. According to your `botcash.io.conf`, this is located at `/var/www/botcash`.

```bash
# Navigate to the website root directory
cd /var/www/botcash

# Pull the latest code you just pushed to GitHub
git pull origin main
```

## 4. Install Dependencies (If Applicable)
If you've added anything new to `package.json`, install the new Node.js packages:
```bash
npm install
```

## 5. Restart the Application
Since your API and WebSocket services run in the background (configured behind Nginx to proxy `127.0.0.1:4243`), you need to restart the Node.js application.

If you are using PM2 to manage your Node process (e.g. `sequencer/server.js` or `app.js`), run:
```bash
# To find out the exact name of the process if you don't know it:
pm2 status

# Restart the process (replace 'botcash' with the actual process name or ID)
pm2 restart botcash
```

If you modified the `botcash.io.conf` Nginx file, be sure to restart Nginx as well:
```bash
sudo systemctl restart nginx
```

## 6. Verify Deployment
Finally, verify that your changes are live:
1. Load `https://botcash.io` in the browser.
2. Check the PM2 logs to ensure no errors crashed the application: `pm2 logs botcash`

# Full Website Commit and VPS Deployment Guide

**VPS IP:** `72.62.129.226`
**VPS User:** `root`
**Live site root:** `/var/www/botcash`
**GitHub repo:** `https://github.com/calypsocharm/PoT.git`

---

## 1. Local Commit and Push (Save to GitHub)

Run in the `botcashescan` directory:

```powershell
git add .
git commit -m "Your descriptive commit message here"
git push origin main
```

---

## 2a. Deploy via SCP (Recommended — bypasses git auth issues)

Copy changed files directly to the VPS:

```powershell
# Copy the main site file
scp index.html root@72.62.129.226:/var/www/botcash/index.html

# Copy CSS if changed
scp style.css root@72.62.129.226:/var/www/botcash/style.css

# Copy JS if changed
scp app.js root@72.62.129.226:/var/www/botcash/app.js
scp bip39.js root@72.62.129.226:/var/www/botcash/bip39.js

# Copy everything at once (full sync)
scp -r * root@72.62.129.226:/var/www/botcash/
```

No restart needed — Nginx serves static files immediately after copy.

---

## 2b. Deploy via SSH + Git Pull (if GitHub auth is configured on VPS)

```bash
ssh root@72.62.129.226
cd /var/www/botcash
git config --global --add safe.directory /var/www/botcash
git pull origin main
```

---

## 3. Restart Services (only if server-side JS changed)

```bash
ssh root@72.62.129.226
pm2 status
pm2 restart botcash
```

If Nginx config changed:
```bash
sudo systemctl restart nginx
```

---

## 4. Verify Deployment

Open **https://botcash.io** and confirm changes are live.

Check PM2 logs if anything looks broken:
```bash
ssh root@72.62.129.226 "pm2 logs botcash --lines 20"
```


## 1. Local Commit and Push
When you are ready to apply changes you made on your local machine, run the following commands in the `botcashescan` directory using your Terminal/PowerShell:

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

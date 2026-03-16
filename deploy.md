# Git Workflow and Deployment Guide

Use these standard commands to save your progress and update the live site via GitHub.

## 1. Commit and Push (Save to GitHub)

Run these commands in your PowerShell or terminal in the `botcashescan` folder:

```powershell
git add .
git commit -m "Update BotCash Sovereign L2 integration and analysis docs"
git push origin main
```

## 2. Status Check

If you ever need to check what files are changed before committing:

```powershell
git status
```

## 3. Pulling Latest Changes

If you've made changes on github.com directly and need them locally:

```powershell
git pull origin main
```

# Automated Deployment Setup Guide

## Overview
I've created GitHub Actions workflows that will automatically deploy both frontend and backend whenever you push to GitHub's `main` branch.

---

## Step 1: Deploy Backend to Render (First Time)

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize GitHub access

### 1.2 Create Backend Service
1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Configure:
   - **Name**: `nexus-dashboard-server`
   - **Runtime**: Node
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```
   MONGODB_URI = <your-mongodb-connection-string>
   NODE_ENV = production
   PORT = 10000
   CORS_ORIGIN = https://nexus-dashboard-client.vercel.app
   ```
5. Click **Create Web Service**

### 1.3 Get Render Deploy Hook
1. Go to Render Dashboard → Your Service → Settings
2. Scroll to **"Deploy Hook"**
3. Click **"Create Deploy Hook"**
4. Name it: `github-actions`
5. Copy the generated URL (looks like: `https://api.render.com/deploy/...`)

### 1.4 Add to GitHub Secrets
1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Add:
   - Name: `RENDER_DEPLOY_HOOK_ID` → value: (the ID part from the URL)
   - Name: `RENDER_DEPLOY_HOOK_KEY` → value: (the key part from the URL)

### 1.5 Get Backend URL
After deployment, your Render URL will be:
```
https://nexus-dashboard-server.onrender.com
```

---

## Step 2: Deploy Frontend to Vercel (First Time)

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize GitHub access

### 2.2 Create Frontend Project
1. Click **"Add New"** → **"Project"**
2. Select your GitHub repository
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL = https://nexus-dashboard-server.onrender.com
   ```
5. Click **Deploy**

### 2.3 Get Vercel Tokens
1. Go to https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `github-actions`
4. Scope: **Full Account**
5. Copy the token

### 2.4 Get Vercel Project Info
1. Go to your Vercel Dashboard
2. Click on your project
3. Settings → General
4. Copy:
   - **ORG ID**: (from URL or settings)
   - **Project ID**: (from settings)

### 2.5 Add to GitHub Secrets
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click **"New repository secret"**
3. Add:
   - Name: `VERCEL_TOKEN` → value: (the token you copied)
   - Name: `VERCEL_ORG_ID` → value: (your org ID)
   - Name: `VERCEL_PROJECT_ID` → value: (your project ID)

### 2.6 Get Frontend URL
After deployment, your Vercel URL will be:
```
https://nexus-dashboard-client.vercel.app
```

---

## Step 3: Update CORS Configuration

### Update Render Backend
1. Go to Render Dashboard → Your Service → Environment
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN = https://nexus-dashboard-client.vercel.app
   ```
3. Service will auto-redeploy

### Update Vercel Frontend (if needed)
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update `VITE_API_URL` to your Render URL:
   ```
   VITE_API_URL = https://nexus-dashboard-server.onrender.com
   ```
3. Redeploy: Click **Deployments** → Click latest → **Redeploy**

---

## Step 4: Enable Automatic Deployments

Now push your code to GitHub:

```bash
git add .
git commit -m "Setup deployment workflows"
git push origin main
```

The GitHub Actions will:
1. ✅ Automatically run when you push to `main`
2. ✅ Deploy backend to Render if `server/` files changed
3. ✅ Deploy frontend to Vercel if `client/` files changed
4. ✅ Skip deployment if only docs/other files changed

---

## Testing the Deployment

### Test Backend
```bash
curl https://nexus-dashboard-server.onrender.com/orders
```

### Test Frontend
Open in browser:
```
https://nexus-dashboard-client.vercel.app
```

---

## GitHub Secrets Checklist

| Secret Name | Where to Find | Used For |
|-------------|--------------|----------|
| `RENDER_DEPLOY_HOOK_ID` | Render Settings → Deploy Hook URL (first part) | Trigger Render deployment |
| `RENDER_DEPLOY_HOOK_KEY` | Render Settings → Deploy Hook URL (second part) | Authenticate Render deployment |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | Authenticate with Vercel |
| `VERCEL_ORG_ID` | Vercel Settings → General | Identify your organization |
| `VERCEL_PROJECT_ID` | Vercel Settings → General | Identify your project |

---

## Monitoring Deployments

### GitHub Actions Logs
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click the workflow that just ran
4. See real-time logs

### Render Logs
1. Go to Render Dashboard → Service → Logs
2. Check for errors or deployment status

### Vercel Logs
1. Go to Vercel Dashboard → Deployments
2. Click the deployment to see build logs

---

## Troubleshooting

### Backend not deploying?
- Check Render Deploy Hook is correct
- Verify GitHub Secrets are set
- Check Render logs for errors

### Frontend not deploying?
- Verify Vercel tokens are correct
- Check `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- See Vercel deployment logs

### CORS Errors?
- Ensure `CORS_ORIGIN` in Render matches Vercel URL exactly
- Check frontend is sending requests to correct URL
- Verify `VITE_API_URL` environment variable is set

---

## Live URLs (After Deployment)

```
Frontend: https://nexus-dashboard-client.vercel.app
Backend:  https://nexus-dashboard-server.onrender.com
```

Both services will automatically update whenever you push to GitHub's `main` branch!

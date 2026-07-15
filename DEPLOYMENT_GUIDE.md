# Nexus Dashboard Deployment Guide

## Overview
This guide covers deploying the Nexus Dashboard application to:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Express.js + MongoDB)

---

## Prerequisites

Before deployment, ensure you have:
1. GitHub account with your project repositories
2. [Vercel account](https://vercel.com/signup) (free)
3. [Render account](https://render.com/signup) (free)
4. MongoDB Atlas account or MongoDB connection string
5. Git installed locally

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare the Server
1. Ensure your `server/.env` file is not committed to Git
2. Verify `server/render.yaml` is in your repository
3. Commit all changes to your GitHub repository

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the server directory:
   - **Name**: `nexus-dashboard-server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add Environment Variables in Render dashboard:
   ```
   PORT: 10000
   NODE_ENV: production
   MONGODB_URI: <your-mongodb-connection-string>
   CORS_ORIGIN: https://nexus-dashboard-client.vercel.app
   ```

### Step 3: Configure MongoDB
- Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- Create a cluster and get connection string
- Add connection string to Render environment variables

### Step 4: Get Server URL
- After deployment, Render will provide a public URL
- Example: `https://nexus-dashboard-server.onrender.com`
- Save this for frontend configuration

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare the Client
1. Verify `client/vercel.json` is in your repository
2. Update your React environment variable references in the code:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
   ```

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Configure the project:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL: https://nexus-dashboard-server.onrender.com
   ```
6. Click "Deploy"

### Step 3: Verify Deployment
1. Wait for Vercel to complete the build
2. You'll get a URL like: `https://nexus-dashboard-client.vercel.app`
3. Test the application in the browser

---

## Part 3: Post-Deployment Configuration

### Update CORS Settings
If the frontend and backend domains change:
1. Update `CORS_ORIGIN` in Render environment variables
2. Update `VITE_API_URL` in Vercel environment variables
3. Redeploy both services

### Environment Variables Summary

**Render (Backend)**
| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `10000` | Required for Render |
| `NODE_ENV` | `production` | - |
| `MONGODB_URI` | Your connection string | Required |
| `CORS_ORIGIN` | Frontend Vercel URL | Update with actual URL |

**Vercel (Frontend)**
| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | Backend Render URL | Update with actual URL |

---

## Connecting Server and Client

### In your Express server (`index.js`):
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Your routes here...
```

### In your React client:
```javascript
// src/api/client.js or similar
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true
});
```

---

## Monitoring and Troubleshooting

### View Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Deployments → Logs

### Common Issues

**CORS Errors**
- Check `CORS_ORIGIN` matches frontend URL exactly
- Ensure `credentials: true` is set appropriately

**MongoDB Connection Failures**
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist includes Render servers
- Test connection locally first

**Build Failures**
- Check logs on Vercel/Render dashboard
- Verify all dependencies in package.json
- Test `npm install && npm run build` locally

---

## Free Tier Limitations

**Render (Free Tier)**
- Services spin down after 15 minutes of inactivity
- Takes ~30 seconds to wake up
- Limited computing resources

**Vercel (Free Tier)**
- Free bandwidth and deployments
- Good for most applications

### Upgrading (Optional)
- Render: Upgrade to Starter Plan ($7/month) for always-on service
- Vercel: Upgrade for additional analytics and features

---

## Continuous Deployment

Both Render and Vercel automatically deploy when you push to your GitHub repository's main branch. To control this:
- Configure branch deployment rules in service settings
- Use pull requests for staging/preview deployments

---

## Summary Checklist

- [ ] MongoDB URI obtained from MongoDB Atlas
- [ ] Server environment variables added to Render
- [ ] Frontend environment variables added to Vercel
- [ ] render.yaml committed to repository
- [ ] vercel.json committed to repository
- [ ] GitHub repositories connected to both services
- [ ] CORS configuration matches frontend URL
- [ ] API client in React configured to use VITE_API_URL
- [ ] Both services deployed and tested
- [ ] Application accessible at Vercel URL

---

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Express.js CORS Guide](https://expressjs.com/en/resources/middleware/cors.html)

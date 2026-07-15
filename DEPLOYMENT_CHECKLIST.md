# Quick Start Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Get MongoDB Connection String
- [ ] Create account at https://www.mongodb.com/cloud/atlas
- [ ] Create a free cluster
- [ ] Get connection string
- [ ] Test connection locally

### 2. Prepare Server
- [ ] Create `.env` file (based on `.env.example`)
- [ ] Add MONGODB_URI
- [ ] Test locally: `node index.js`
- [ ] Commit `render.yaml` to GitHub

### 3. Prepare Client
- [ ] Verify API URL is configured for environment variables
- [ ] Commit `vercel.json` to GitHub
- [ ] Test build locally: `npm run build`

---

## 🚀 Deployment Steps

### Backend (Render)
```
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Select /server directory
5. Add environment variables:
   - PORT: 10000
   - NODE_ENV: production
   - MONGODB_URI: <your-connection-string>
   - CORS_ORIGIN: https://nexus-dashboard-client.vercel.app (update after frontend deploy)
6. Create service
7. Wait for deployment (~3 min)
8. Copy public URL
```

### Frontend (Vercel)
```
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repo
4. Root Directory: client
5. Add environment variable:
   - VITE_API_URL: <render-backend-url>
6. Deploy
7. Wait for build (~2 min)
8. Copy Vercel URL
```

### Final Configuration
```
1. Go back to Render dashboard
2. Update CORS_ORIGIN to Vercel URL
3. Service will redeploy
4. Test app at Vercel URL
```

---

## 🔗 After Deployment

### URLs to Update
- **Backend URL**: https://nexus-dashboard-server.onrender.com (or your Render URL)
- **Frontend URL**: https://nexus-dashboard-client.vercel.app (or your Vercel URL)

### Test the Application
1. Open frontend URL in browser
2. Check console for API errors
3. Test all Socket.io connections
4. Verify database operations work

---

## 📝 Commands Reference

### Local Testing
```bash
# Terminal 1 - Server
cd server
npm install
node index.js

# Terminal 2 - Client
cd client
npm install
npm run dev
```

### Build for Production
```bash
cd client
npm run build
```

---

## ⚠️ Important Notes

- **Free Tier**: Render services sleep after 15 min of inactivity (first request takes ~30s)
- **CORS**: Must match exactly - including protocol and domain
- **MongoDB**: Free Atlas tier supports up to 512MB
- **Environment Variables**: Set these only on the hosting platform, NOT in Git

---

## 💬 Need Help?

Check logs:
- **Render Logs**: Dashboard → Service → Logs
- **Vercel Logs**: Dashboard → Project → Deployments → Logs

See DEPLOYMENT_GUIDE.md for detailed instructions.

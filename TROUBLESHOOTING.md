# Nexus Dashboard - Troubleshooting Guide

## Issue: Dashboard shows "Waiting for order activity..." and graphs are empty

### Root Causes:
1. Backend server is not running or not accessible
2. Client is connecting to wrong API URL
3. Database has no orders yet
4. CORS configuration mismatch

---

## Quick Diagnosis

### 1. Check Backend Server Status
Your backend should be deployed on **Render**. 

**To verify:**
- Go to your Render dashboard
- Check if the service `nexus-dashboard-server` is running
- Click on the service and check the logs
- Visit the health check URL: `https://your-render-app.onrender.com/` (should return `{"status":"ok"}`)

### 2. Check Client Environment Variable
Your frontend on **Vercel** needs to know the backend URL.

**To fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/update: `VITE_API_URL` = `https://your-render-app.onrender.com`
3. **Important:** No trailing slash!
4. Redeploy the frontend after adding the variable

### 3. Check CORS Configuration
In `server/index.js`, the CORS origin should match your Vercel frontend URL.

**Current setting in render.yaml:**
```yaml
CORS_ORIGIN: https://nexus-dashboard-client.vercel.app
```

Make sure this matches your actual Vercel domain!

### 4. Add Initial Data to Database
Even if everything is connected, you need orders in the database to see graphs.

**Two options:**

#### Option A: Run simulator locally (pointed at deployed server)
```bash
cd server
npm install
# Edit simulate.js and change the URL to your deployed backend
node simulate.js
```

#### Option B: Create orders manually via API
```bash
curl -X POST https://your-render-app.onrender.com/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Product",
    "city": "Mumbai",
    "amount": 5000
  }'
```

---

## Complete Deployment Checklist

### Backend (Render)
- [x] Service created and running
- [ ] Environment variable `MONGODB_URI` set to your MongoDB connection string
- [ ] Environment variable `CORS_ORIGIN` set to your Vercel frontend URL
- [ ] Health check at `/` returns success
- [ ] Can create orders via POST /orders
- [ ] Can fetch orders via GET /orders

### Frontend (Vercel)
- [x] Project deployed
- [ ] Environment variable `VITE_API_URL` set to Render backend URL
- [ ] Can access the dashboard URL
- [ ] Browser console shows no CORS errors
- [ ] Status indicator shows "Live" (not "connecting" or "disconnected")

### Database (MongoDB Atlas)
- [x] Cluster created
- [x] Database user created with password
- [ ] IP whitelist allows connections (0.0.0.0/0 for all IPs)
- [ ] Connection string is correct in Render environment variables

---

## Testing Steps

### 1. Test Backend Health
```bash
curl https://your-render-app.onrender.com/
# Should return: {"status":"ok","message":"Nexus Dashboard Server is running","timestamp":"..."}
```

### 2. Test Creating an Order
```bash
curl -X POST https://your-render-app.onrender.com/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Wireless Mouse",
    "city": "Bengaluru",
    "amount": 1299
  }'
```

### 3. Test Fetching Orders
```bash
curl https://your-render-app.onrender.com/orders
# Should return an array of orders (may be empty initially)
```

### 4. Check Frontend Console
Open your deployed Vercel app and open browser DevTools (F12):
- **Console tab:** Look for connection errors or CORS issues
- **Network tab:** Check if API calls are going to the correct URL
- Should see WebSocket connection to your backend

---

## Common Error Messages and Fixes

### "Failed to load initial orders"
- Backend is not running or URL is wrong
- Check `VITE_API_URL` environment variable in Vercel
- Check Network tab in browser DevTools

### Status shows "disconnected"
- WebSocket connection failed
- CORS issue - check `CORS_ORIGIN` in Render
- Backend server might be sleeping (Render free tier)

### "Waiting for order activity..."
- This is **normal** if database is empty!
- Create some test orders using the simulator or curl commands above
- Graphs will appear once orders start flowing

### CORS Error in Browser Console
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Fix:**
1. Go to Render dashboard
2. Update `CORS_ORIGIN` environment variable to match your exact Vercel URL
3. Restart the service

---

## URLs to Remember

Replace these with your actual URLs:

- **Frontend (Vercel):** `https://nexus-dashboard-client.vercel.app`
- **Backend (Render):** `https://nexus-dashboard-server.onrender.com`
- **MongoDB:** Your Atlas cluster connection string

---

## Quick Start with Test Data

To quickly populate your dashboard with test data:

1. **Clone your repo locally**
2. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Edit `simulate.js` line 29:** Change the URL to your deployed backend:
   ```javascript
   const res = await axios.post("https://your-render-app.onrender.com/orders", order);
   ```

4. **Run the simulator:**
   ```bash
   node simulate.js
   ```

5. **Watch your dashboard come alive!** The simulator will create realistic orders every 4 seconds.

---

## Still Having Issues?

1. Check all environment variables are set correctly
2. Check Render logs for backend errors
3. Check browser console for frontend errors
4. Verify MongoDB connection string is correct
5. Make sure Render service is not sleeping (free tier sleeps after 15 minutes of inactivity)

**Render Free Tier Note:** The first request after sleeping might take 30-60 seconds to wake up the server.

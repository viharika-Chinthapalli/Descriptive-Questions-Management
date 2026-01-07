# Deployment Guidelines - Free Tier

Simple, step-by-step guide to deploy the Question Bank Management System for **FREE** using Render (backend) and Vercel (frontend).

## 🎯 Recommended Free Deployment

- **Backend**: Render (free tier, easy Node.js deployment)
- **Storage**: JSON file storage (included) OR Supabase PostgreSQL (optional)
- **Frontend**: Vercel (free tier, perfect for React/Vite)

**Why this combination?**

- ✅ All platforms offer generous free tiers
- ✅ Render is simple and easy to use (no Docker needed)
- ✅ JSON storage works out of the box (no database setup needed)
- ✅ Optional Supabase provides reliable free PostgreSQL database
- ✅ Automatic deployments from GitHub
- ✅ Easy setup, no credit card required
- ✅ No CLI tools needed - everything through web interface

---

## Prerequisites

### Required Software

- **Node.js 16+ and npm** (for both backend and frontend)
- **Git** (for version control)

### Required Accounts (Free)

- **GitHub account** (to host your code)
- **Render account** (for backend - free tier)
- **Vercel account** (for frontend - free tier)
- **Supabase account** (optional - only if using database instead of JSON storage)

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Verify Package.json

Make sure your `backend-express/package.json` has a start script:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. **No credit card required** for free tier

### 2.2 Create New Web Service

1. In your Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository from the list

### 2.3 Configure Backend Service

Fill in the service configuration:

1. **Name**: `question-bank-backend` (or any name you prefer)
2. **Region**: Choose closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
3. **Branch**: `main` (or your default branch)
4. **Root Directory**: `backend-express`
5. **Runtime**: `Node` (auto-detected)
6. **Build Command**: `npm install` (or leave empty, Render auto-detects)
7. **Start Command**: `npm start` (or `node server.js`)

### 2.4 Set Environment Variables

In the **Environment Variables** section, add:

- **Key**: `PORT`

  - **Value**: `8000` (Render will set this automatically, but you can specify it)
  - **Note**: Render automatically provides `PORT` environment variable, but setting it explicitly is fine

- **Key**: `NODE_ENV`
  - **Value**: `production`

**Optional**: Add more environment variables if needed:

- `SIMILARITY_THRESHOLD` (default: 0.85)
- `FRONTEND_URL` (we'll set this after frontend deployment)

### 2.5 Choose Plan

1. Select **"Free"** plan
2. Review the settings:
   - **Auto-Deploy**: `Yes` (deploys automatically on git push)
   - **Health Check Path**: `/health` (optional, but recommended)

### 2.6 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying your app
3. Wait 3-5 minutes for the first deployment
4. You'll see build logs in real-time

### 2.7 Get Your Backend URL

After deployment completes, you'll see:

- **Service URL**: `https://question-bank-backend.onrender.com` (or similar)
- **Status**: Should show "Live"

**Save this URL** - you'll need it for the frontend.

### 2.8 Verify Backend is Running

Test your backend:

1. Visit the service URL: `https://your-app-name.onrender.com/health`
2. You should see:
   ```json
   { "status": "ok", "message": "Server is running" }
   ```

Or test with curl:

```bash
curl https://your-app-name.onrender.com/health
```

**Note**: Free tier services on Render spin down after 15 minutes of inactivity. The first request after spin-down may take 30-60 seconds to wake up the service.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. **No credit card required** for free tier

### 3.2 Import Project

1. Click **"Add New Project"**
2. Import your GitHub repository
3. Vercel will detect it's a Vite/React project

### 3.3 Configure Frontend

1. **Root Directory**: Set to `frontend-react`
2. **Framework Preset**: Vite (auto-detected)
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `dist` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

### 3.4 Set Environment Variable

1. In **Environment Variables** section, add:

   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your Render backend URL (from Step 2.7)
     - Example: `https://question-bank-backend.onrender.com`

2. **Important**: Make sure to add this for all environments (Production, Preview, Development)

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment (1-2 minutes)
3. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Backend CORS (Optional)

If you want to restrict CORS to your frontend URL:

1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to **"Environment"** tab
4. Add environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-app.vercel.app` (your Vercel frontend URL)
5. Click **"Save Changes"** - Render will automatically redeploy

6. Update `server.js` to use this environment variable for CORS (if needed):
   ```javascript
   const corsOptions = {
     origin: process.env.FRONTEND_URL || "*",
     credentials: true,
   };
   app.use(cors(corsOptions));
   ```

### 4.2 Verify Connection

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Try adding a question
3. Check browser console for any errors
4. If you see CORS errors, wait a minute for Render to finish redeploying

---

## Step 5: Verify Deployment

### 5.1 Test Backend Endpoints

Test your backend API:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Get questions (should return empty array initially)
curl https://your-app-name.onrender.com/api/questions
```

### 5.2 Test Frontend

1. Visit your frontend URL
2. Try adding a question
3. Check if it appears in the list
4. Test similarity checking
5. Verify all features work

**Note**: First request to Render backend after inactivity may take 30-60 seconds (free tier spin-up time).

---

## ✅ Deployment Complete!

Your application is now live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://question-bank-backend.onrender.com`
- **API Base**: `https://question-bank-backend.onrender.com/api`
- **Health Check**: `https://question-bank-backend.onrender.com/health`

---

## 🔄 Continuous Deployment

### Render

Render automatically deploys when you push to GitHub:

- Auto-deploys on push to main branch (if enabled)
- You can trigger manual deployments from the dashboard
- View deployment logs in real-time

To update your app:

1. Make changes locally
2. Commit and push to GitHub
3. Render automatically detects changes and redeploys
4. Monitor deployment in Render dashboard

### Vercel

Vercel automatically deploys when you push to GitHub:

- Auto-deploys on push to main branch
- Creates preview deployments for pull requests

To update your app:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically redeploys

---

## 🐛 Troubleshooting

### Backend Issues (Render)

**Deployment failed**

- Check Render build logs in the dashboard
- Verify `package.json` has all dependencies
- Ensure Node.js version is 16+ (Render auto-detects)
- Check that `start` script exists in `package.json`
- Verify `server.js` exists in `backend-express` directory
- Check that root directory is set to `backend-express`

**App not responding / 502 errors**

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds to wake up
- This is normal for free tier - subsequent requests are fast
- Check service status in Render dashboard
- View logs: Service → **"Logs"** tab

**Service keeps spinning down**

- Free tier limitation - services sleep after 15 minutes of inactivity
- Consider upgrading to paid plan for always-on service
- Or use a service like UptimeRobot to ping your service every 10 minutes

**Port issues**

- Render automatically sets `PORT` environment variable
- Ensure `server.js` uses `process.env.PORT || 8000`
- Don't hardcode port numbers

**JSON file storage issues**

- Check logs: Service → **"Logs"** tab
- Verify `data` directory is writable
- Free tier has ephemeral filesystem - data may be lost on redeploy
- Consider using Render's persistent disk (paid feature) or Supabase

**Build timeout**

- Free tier has build timeout limits
- Optimize your build process
- Remove unnecessary dependencies
- Use `npm ci` instead of `npm install` in build command

**Environment variables not working**

- Verify variables are set in Render dashboard: Service → **"Environment"** tab
- Check variable names match exactly (case-sensitive)
- Redeploy after adding/changing environment variables

### Frontend Issues

**Failed to fetch / API errors**

- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check that backend URL is accessible (visit in browser)
- Ensure backend is deployed and running
- Test backend directly: `https://your-app.onrender.com/health`
- Check browser console for CORS errors
- **Note**: First request to Render backend may take 30-60 seconds (spin-up time)

**404 on routes**

- This is normal for SPAs - Vercel handles this automatically via `vercel.json`
- If issues persist, check `frontend-react/vercel.json` exists

**Environment variable not working**

- Vite requires `VITE_` prefix for environment variables
- Rebuild after adding environment variables (Vercel does this automatically)
- Check that variable is set for the correct environment (Production/Preview/Development)

**Build fails**

- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel auto-detects)

---

## 📊 Monitoring

### Render

- **Logs**: Service → **"Logs"** tab (real-time)
- **Metrics**: Service → **"Metrics"** tab (CPU, Memory, Requests)
- **Events**: Service → **"Events"** tab (deployment history)
- **Status**: Service dashboard shows current status

### Vercel

- **Logs**: Project → **Deployments** → Click deployment → **Logs**
- **Analytics**: Project → **Analytics** tab (if enabled)
- **Functions**: Project → **Functions** tab (if using serverless functions)

---

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` files to GitHub
2. **Secrets**: Render environment variables are encrypted and secure
3. **HTTPS**: All platforms provide HTTPS automatically
4. **CORS**: Backend allows requests from any origin (update if needed for production)
5. **JSON Storage**: Data on free tier is ephemeral - may be lost on redeploy

---

## 💰 Free Tier Limits

### Render Free Tier

- 750 hours/month (enough for 1 service running 24/7)
- 512MB RAM
- Services spin down after 15 minutes of inactivity
- 30-60 second spin-up time after inactivity
- Ephemeral filesystem (data may be lost on redeploy)
- Build timeout: 45 minutes
- Sufficient for POC and small projects

**Note**: If you need persistent storage, consider:

- Upgrading to paid plan ($7/month) for persistent disk
- Using Supabase for database storage (free tier available)

### Vercel Free Tier

- Unlimited deployments
- 100GB bandwidth per month
- Automatic HTTPS
- Perfect for React/Vite apps

**Note**: All platforms are generous for POC projects. If you exceed limits, you'll be notified.

---

## 📝 Quick Reference

### Backend URLs

- **API Base**: `https://question-bank-backend.onrender.com`
- **Health Check**: `https://question-bank-backend.onrender.com/health`
- **API Endpoints**: `https://question-bank-backend.onrender.com/api/questions`

### Frontend URLs

- **App**: `https://your-app.vercel.app`

### Environment Variables

**Render (Backend)** - Set in dashboard: Service → **"Environment"** tab:

- `PORT=8000` (optional, Render sets this automatically)
- `NODE_ENV=production` (optional)
- `FRONTEND_URL=https://your-app.vercel.app` (optional, for CORS)
- `SIMILARITY_THRESHOLD=0.85` (optional)

**Vercel (Frontend)** - Set in dashboard:

- `VITE_API_BASE_URL=https://question-bank-backend.onrender.com`

### Useful Render Dashboard Features

- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and request metrics
- **Events**: View deployment history
- **Environment**: Manage environment variables
- **Settings**: Configure service settings
- **Manual Deploy**: Trigger manual deployments

---

## 🆘 Need Help?

1. Check Render logs: Service → **"Logs"** tab
2. Check Vercel logs for frontend issues
3. Verify all environment variables are set in Render dashboard
4. Ensure both services are deployed and running
5. Test backend directly: Visit `https://your-app.onrender.com/health`
6. Check browser console for frontend errors
7. Verify environment variables are set correctly
8. **Note**: First request to Render backend may take 30-60 seconds (spin-up time)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Vercel account created
- [ ] `package.json` has `start` script

### Backend (Render)

- [ ] Logged in to Render
- [ ] Web service created
- [ ] Root directory set to `backend-express`
- [ ] Build command configured (or auto-detected)
- [ ] Start command set to `npm start`
- [ ] Environment variables set (`PORT`, `NODE_ENV`)
- [ ] Free plan selected
- [ ] Auto-deploy enabled
- [ ] Backend deployed successfully
- [ ] Backend URL copied
- [ ] Health check works (`/health` endpoint)

### Frontend (Vercel)

- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend-react`
- [ ] `VITE_API_BASE_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied

### Connection

- [ ] `FRONTEND_URL` environment variable set in Render (optional)
- [ ] Frontend can connect to backend
- [ ] No CORS errors
- [ ] Application working end-to-end
- [ ] All features tested
- [ ] Understand free tier spin-down behavior

---

## 🔄 Alternative: Using Supabase Database (Optional)

If you prefer using a PostgreSQL database instead of JSON file storage:

### Setup Supabase

1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Set `DATABASE_URL` environment variable in Render:
   - Go to Service → **"Environment"** tab
   - Add: `DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

### Update Backend Code

You'll need to modify `backend-express/services/storage.js` to use PostgreSQL instead of JSON files. This requires:

- Installing `pg` package: `npm install pg`
- Updating storage service to use database queries
- Creating database tables/schema

**Note**: The current implementation uses JSON file storage, which works perfectly for POC and small projects. However, on Render's free tier, the filesystem is ephemeral, so data may be lost on redeploy. For production, consider using Supabase.

---

## 💡 Tips for Free Tier

1. **Spin-down behavior**: Free tier services sleep after 15 minutes. First request takes 30-60 seconds.
2. **Keep service awake**: Use services like UptimeRobot (free) to ping your service every 10 minutes
3. **Persistent storage**: Consider Supabase for database if you need data persistence
4. **Monitor usage**: Check Render dashboard for hours remaining in your free tier
5. **Optimize builds**: Remove unnecessary dependencies to speed up deployments

---

**Last Updated**: 2024-12-19

# Deployment Guidelines - Free Tier

Simple, step-by-step guide to deploy the Question Bank Management System for **FREE** using Fly.io (backend) and Vercel (frontend).

## 🎯 Recommended Free Deployment

- **Backend**: Fly.io (free tier, fast deployments)
- **Storage**: JSON file storage (included) OR Supabase PostgreSQL (optional)
- **Frontend**: Vercel (free tier, perfect for React/Vite)

**Why this combination?**

- ✅ All platforms offer generous free tiers
- ✅ Fly.io is fast and reliable (much faster than Render)
- ✅ JSON storage works out of the box (no database setup needed)
- ✅ Optional Supabase provides reliable free PostgreSQL database
- ✅ No timeout limits (important for ML similarity detection)
- ✅ Automatic deployments from GitHub
- ✅ Easy setup, no credit card required

---

## Prerequisites

### Required Software

- **Node.js 16+ and npm** (for both backend and frontend)
- **Git** (for version control)
- **Fly CLI** (we'll install this in the steps)

### Required Accounts (Free)

- **GitHub account** (to host your code)
- **Fly.io account** (for backend - free tier)
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

### 1.2 Environment Variables

The backend will get environment variables from Fly.io. The frontend will get them from Vercel.

---

## Step 2: Deploy Backend to Fly.io

### 2.1 Install Fly CLI

**Windows (PowerShell)**:

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Mac/Linux**:

```bash
curl -L https://fly.io/install.sh | sh
```

**Or download from**: https://fly.io/docs/hands-on/install-flyctl/

### 2.2 Create Fly.io Account

1. Go to https://fly.io
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended) or email
4. **No credit card required** for free tier

### 2.3 Login to Fly.io

Open terminal/command prompt and run:

```bash
fly auth login
```

This will open your browser to authenticate.

### 2.4 Initialize Fly.io App

1. Navigate to your backend directory:

   ```bash
   cd backend-express
   ```

2. Initialize Fly.io app:

   ```bash
   fly launch
   ```

3. Follow the prompts:
   - **App name**: `question-bank-backend` (or any name, Fly will suggest one)
   - **Organization**: Choose your personal organization
   - **Region**: Choose closest to you (e.g., `iad` for US East, `lhr` for London)
   - **PostgreSQL**: Type `n` (we're using JSON storage or Supabase)
   - **Redis**: Type `n` (not needed)
   - **Deploy now**: Type `n` (we'll set environment variables first)

### 2.5 Create fly.toml Configuration

Fly.io should have created a `fly.toml` file. Verify it exists and update if needed. It should look like:

```toml
app = "question-bank-backend"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"
  NODE_ENV = "production"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services]]
  protocol = "tcp"
  internal_port = 8000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[vm]]
  memory_mb = 256
  cpu_kind = "shared"
  cpus = 1
```

**Note**: If `fly.toml` wasn't created, create it manually in the `backend-express` directory.

### 2.6 Create Dockerfile (Required for Fly.io)

Create a `Dockerfile` in the `backend-express` directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory for JSON storage
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]
```

### 2.7 Create .dockerignore (Optional but Recommended)

Create a `.dockerignore` file in `backend-express`:

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
*.md
.DS_Store
```

### 2.8 Set Environment Variables

Set the required environment variables:

```bash
fly secrets set PORT="8000"
fly secrets set NODE_ENV="production"
```

**Optional**: If you want to set a frontend URL for CORS (we'll update this after frontend deployment):

```bash
# We'll set this after frontend is deployed
# fly secrets set FRONTEND_URL="https://your-app.vercel.app"
```

### 2.9 Deploy

Deploy your backend:

```bash
fly deploy
```

This will:

1. Build your Docker image
2. Deploy it to Fly.io
3. Show you the deployment URL (e.g., `https://question-bank-backend.fly.dev`)

**Note**: First deployment takes 2-3 minutes. Subsequent deployments are faster.

### 2.10 Get Your Backend URL

After deployment, you'll see your backend URL. It will be:

```
https://your-app-name.fly.dev
```

**Save this URL** - you'll need it for the frontend.

### 2.11 Verify Backend is Running

Test your backend:

```bash
curl https://your-app-name.fly.dev/health
```

Or visit in your browser: `https://your-app-name.fly.dev/health`

You should see:

```json
{ "status": "ok", "message": "Server is running" }
```

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
   - **Value**: Your Fly.io backend URL (from Step 2.10)
     - Example: `https://question-bank-backend.fly.dev`

2. **Important**: Make sure to add this for all environments (Production, Preview, Development)

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment (1-2 minutes)
3. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Backend CORS (Optional)

If you want to restrict CORS to your frontend URL:

1. Go back to your terminal
2. Navigate to backend directory (if not already there):

   ```bash
   cd backend-express
   ```

3. Set the `FRONTEND_URL` secret:

   ```bash
   fly secrets set FRONTEND_URL="https://your-app.vercel.app"
   ```

   Replace with your actual Vercel frontend URL.

4. Update `server.js` to use this environment variable for CORS (if needed)

### 4.2 Verify Connection

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Try adding a question
3. Check browser console for any errors
4. If you see CORS errors, check that CORS is properly configured in `server.js`

---

## Step 5: Verify Deployment

### 5.1 Test Backend Endpoints

Test your backend API:

```bash
# Health check
curl https://your-app-name.fly.dev/health

# Get questions (should return empty array initially)
curl https://your-app-name.fly.dev/api/questions
```

### 5.2 Test Frontend

1. Visit your frontend URL
2. Try adding a question
3. Check if it appears in the list
4. Test similarity checking
5. Verify all features work

---

## ✅ Deployment Complete!

Your application is now live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://question-bank-backend.fly.dev`
- **API Base**: `https://question-bank-backend.fly.dev/api`
- **Health Check**: `https://question-bank-backend.fly.dev/health`

---

## 🔄 Continuous Deployment

### Fly.io

Fly.io doesn't auto-deploy from GitHub by default. To deploy updates:

```bash
cd backend-express
fly deploy
```

Or set up GitHub Actions for automatic deployment (optional).

### Vercel

Vercel automatically deploys when you push to GitHub:

- Auto-deploys on push to main branch
- Creates preview deployments for pull requests

To update your app:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically redeploys
4. For backend, run `fly deploy` in the `backend-express` directory

---

## 🐛 Troubleshooting

### Backend Issues

**Deployment failed**

- Check Fly.io logs: `fly logs`
- Verify `package.json` has all dependencies
- Ensure Node.js version is 16+
- Check `fly.toml` configuration is correct
- Verify `Dockerfile` exists and is correct

**App not responding**

- Check if app is running: `fly status`
- View logs: `fly logs`
- Restart app: `fly apps restart question-bank-backend`
- Check if app woke up (free tier apps sleep after inactivity)

**Port issues**

- Verify `PORT` environment variable is set: `fly secrets list`
- Check `fly.toml` has correct `internal_port = 8000`
- Ensure `server.js` uses `process.env.PORT || 8000`

**JSON file storage issues**

- Check logs: `fly logs`
- Verify `data` directory exists in Dockerfile
- Check file permissions (should be writable)

### Frontend Issues

**Failed to fetch / API errors**

- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check that backend URL is accessible (visit in browser)
- Ensure backend is deployed and running
- Test backend directly: `https://question-bank-backend.fly.dev/health`
- Check browser console for CORS errors

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

### Fly.io

- **Logs**: `fly logs` (real-time)
- **Status**: `fly status`
- **Metrics**: `fly metrics` or dashboard at fly.io
- **SSH**: `fly ssh console` (access app shell)

### Vercel

- **Logs**: Project → **Deployments** → Click deployment → **Logs**
- **Analytics**: Project → **Analytics** tab (if enabled)
- **Functions**: Project → **Functions** tab (if using serverless functions)

---

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` files to GitHub
2. **Secrets**: Fly.io secrets are encrypted and secure
3. **HTTPS**: All platforms provide HTTPS automatically
4. **CORS**: Backend allows requests from any origin (update if needed for production)
5. **JSON Storage**: Data is stored in Fly.io volume (persists across deployments)

---

## 💰 Free Tier Limits

### Fly.io Free Tier

- 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB persistent volume storage
- 160GB outbound data transfer
- Apps sleep after 5 minutes of inactivity (wake on request)
- Sufficient for POC and small projects

### Vercel Free Tier

- Unlimited deployments
- 100GB bandwidth per month
- Automatic HTTPS
- Perfect for React/Vite apps

**Note**: All platforms are generous for POC projects. If you exceed limits, you'll be notified.

---

## 📝 Quick Reference

### Backend URLs

- **API Base**: `https://question-bank-backend.fly.dev`
- **Health Check**: `https://question-bank-backend.fly.dev/health`
- **API Endpoints**: `https://question-bank-backend.fly.dev/api/questions`

### Frontend URLs

- **App**: `https://your-app.vercel.app`

### Environment Variables

**Fly.io (Backend)** - Set with `fly secrets set`:

- `PORT=8000` (optional, defaults to 8000)
- `NODE_ENV=production` (optional)
- `FRONTEND_URL=https://your-app.vercel.app` (optional, for CORS)

**Vercel (Frontend)** - Set in dashboard:

- `VITE_API_BASE_URL=https://question-bank-backend.fly.dev`

### Useful Fly.io Commands

```bash
# Deploy
fly deploy

# View logs
fly logs

# Check status
fly status

# List secrets
fly secrets list

# Set secret
fly secrets set KEY="value"

# Remove secret
fly secrets unset KEY

# SSH into app
fly ssh console

# Restart app
fly apps restart question-bank-backend

# Scale app
fly scale count 1

# View app info
fly info
```

### Useful Vercel Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

---

## 🆘 Need Help?

1. Check Fly.io logs: `fly logs`
2. Check Vercel logs for frontend issues
3. Verify all secrets are set: `fly secrets list`
4. Ensure both services are deployed and running
5. Test backend directly: Visit `https://question-bank-backend.fly.dev/health`
6. Check browser console for frontend errors
7. Verify environment variables are set correctly

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Fly.io CLI installed
- [ ] Fly.io account created
- [ ] Vercel account created

### Backend (Fly.io)

- [ ] Logged in to Fly.io (`fly auth login`)
- [ ] App initialized (`fly launch`)
- [ ] `fly.toml` created/verified
- [ ] `Dockerfile` created
- [ ] `.dockerignore` created (optional)
- [ ] Secrets set (`PORT`, `NODE_ENV`)
- [ ] Backend deployed successfully (`fly deploy`)
- [ ] Backend URL copied
- [ ] Health check works (`/health` endpoint)

### Frontend (Vercel)

- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend-react`
- [ ] `VITE_API_BASE_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied

### Connection

- [ ] `FRONTEND_URL` secret set in Fly.io (optional)
- [ ] Frontend can connect to backend
- [ ] No CORS errors
- [ ] Application working end-to-end
- [ ] All features tested

---

## 🔄 Alternative: Using Supabase Database (Optional)

If you prefer using a PostgreSQL database instead of JSON file storage:

### Setup Supabase

1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Set `DATABASE_URL` secret in Fly.io:
   ```bash
   fly secrets set DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
   ```

### Update Backend Code

You'll need to modify `backend-express/services/storage.js` to use PostgreSQL instead of JSON files. This requires:

- Installing `pg` package: `npm install pg`
- Updating storage service to use database queries
- Creating database tables/schema

**Note**: The current implementation uses JSON file storage, which works perfectly for POC and small projects.

---

**Last Updated**: 2024-12-19

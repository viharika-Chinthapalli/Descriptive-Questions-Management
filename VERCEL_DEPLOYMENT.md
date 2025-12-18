# Vercel Deployment Guide

Complete guide for deploying both frontend and backend to Vercel.

## 📋 Overview

This guide covers deploying:
- **Frontend**: React + Vite application
- **Backend**: FastAPI application (as serverless functions)

## ⚠️ Important Considerations

### Backend Limitations on Vercel

1. **Function Timeout**: 
   - Free tier: 10 seconds max
   - Pro tier: 60 seconds max
   - Consider this for similarity detection operations

2. **Cold Starts**: 
   - First request may be slower (loading ML models)
   - Sentence transformers model loads on first request

3. **Package Size**:
   - Large dependencies (sentence-transformers, torch) may require optimization
   - Consider using Vercel's Pro plan for larger deployments

### Recommended Alternative

For production with heavy ML workloads, consider:
- **Backend**: Deploy to Railway, Render, or Fly.io (better for long-running processes)
- **Frontend**: Deploy to Vercel (perfect for React/Vite)

However, this guide shows how to deploy both to Vercel if preferred.

---

## 🚀 Part 1: Deploy Backend to Vercel

### Step 1: Prepare Backend for Vercel

1. **Create `vercel.json` in the `backend` folder:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app/main.py"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.9"
  }
}
```

2. **Create `api/index.py` wrapper** (Vercel expects this structure):

Create `backend/api/index.py`:
```python
"""Vercel serverless function entry point."""
from app.main import app

# Export the FastAPI app for Vercel
handler = app
```

3. **Update `vercel.json` to use the correct entry point:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 3: Deploy Backend

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Follow prompts:**
   - Link to existing project? **No** (first time)
   - Project name: `question-bank-backend`
   - Directory: `.` (current directory)
   - Override settings? **No**

5. **Set environment variables:**
```bash
vercel env add DATABASE_URL
# Paste your Supabase connection string when prompted

vercel env add SIMILARITY_THRESHOLD
# Enter: 0.85 (or your preferred value)
```

6. **Deploy to production:**
```bash
vercel --prod
```

7. **Note your backend URL:**
   - Example: `https://question-bank-backend.vercel.app`
   - This will be needed for frontend configuration

### Step 4: Update CORS for Production

The backend CORS settings need to include your Vercel frontend URL. This is handled automatically if you set the `FRONTEND_URL` environment variable (see below).

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Create `vercel.json` in `frontend-react` folder** (optional - Vercel auto-detects Vite):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. **Update `frontend-react/src/config.js`** to use environment variable:

The config already supports `VITE_API_BASE_URL`. We'll set this in Vercel.

### Step 2: Deploy Frontend

1. **Navigate to frontend folder:**
```bash
cd frontend-react
```

2. **Login to Vercel (if not already):**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Follow prompts:**
   - Link to existing project? **No** (first time)
   - Project name: `question-bank-frontend`
   - Directory: `.` (current directory)
   - Override settings? **No**

5. **Set environment variable:**
```bash
vercel env add VITE_API_BASE_URL
# Enter your backend URL: https://question-bank-backend.vercel.app
```

6. **Deploy to production:**
```bash
vercel --prod
```

7. **Note your frontend URL:**
   - Example: `https://question-bank-frontend.vercel.app`

### Step 3: Update Backend CORS

1. **Go back to backend project:**
```bash
cd ../backend
```

2. **Add frontend URL to environment:**
```bash
vercel env add FRONTEND_URL
# Enter: https://question-bank-frontend.vercel.app
```

3. **Redeploy backend:**
```bash
vercel --prod
```

---

## 🔧 Part 3: Alternative - Deploy via Vercel Dashboard

### Backend Deployment

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your Git repository
4. **Root Directory**: Set to `backend`
5. **Framework Preset**: Other
6. **Build Command**: Leave empty (Vercel auto-detects Python)
7. **Output Directory**: Leave empty
8. **Install Command**: `pip install -r requirements.txt`
9. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `SIMILARITY_THRESHOLD`: `0.85`
   - `FRONTEND_URL`: Your frontend Vercel URL (after deploying frontend)
10. Click **Deploy**

### Frontend Deployment

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your Git repository
4. **Root Directory**: Set to `frontend-react`
5. **Framework Preset**: Vite (auto-detected)
6. **Build Command**: `npm run build` (auto-detected)
7. **Output Directory**: `dist` (auto-detected)
8. Add environment variable:
   - `VITE_API_BASE_URL`: Your backend Vercel URL
9. Click **Deploy**

---

## 🔐 Environment Variables Summary

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:password@...` |
| `SIMILARITY_THRESHOLD` | Similarity threshold (optional) | `0.85` |
| `FRONTEND_URL` | Frontend Vercel URL for CORS | `https://question-bank-frontend.vercel.app` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://question-bank-backend.vercel.app` |

---

## 📝 Update Code for Production CORS

The backend needs to read the `FRONTEND_URL` environment variable. Update `backend/app/main.py`:

```python
# Get frontend URL from environment (for production)
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

# Build CORS origins list
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Add production frontend URL if provided
if FRONTEND_URL:
    cors_origins.append(FRONTEND_URL)
    # Also add without trailing slash
    if FRONTEND_URL.endswith("/"):
        cors_origins.append(FRONTEND_URL.rstrip("/"))
    else:
        cors_origins.append(FRONTEND_URL + "/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

---

## 🧪 Testing Deployment

### Test Backend

1. Visit: `https://your-backend.vercel.app/health`
   - Should return: `{"status": "healthy"}`

2. Visit: `https://your-backend.vercel.app/docs`
   - Should show FastAPI Swagger documentation

3. Test API endpoint:
```bash
curl https://your-backend.vercel.app/api/questions
```

### Test Frontend

1. Visit: `https://your-frontend.vercel.app`
2. Try adding a question
3. Check browser console for errors
4. Verify API calls are going to the correct backend URL

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Function timeout"**
- Solution: Optimize similarity detection or upgrade to Vercel Pro
- Consider moving backend to Railway/Render for better timeout limits

**Error: "Module not found"**
- Solution: Ensure all dependencies are in `requirements.txt`
- Check that `vercel.json` points to correct entry point

**Error: "Database connection failed"**
- Solution: Verify `DATABASE_URL` is set correctly in Vercel dashboard
- Check Supabase project is not paused
- Ensure SSL is enabled (handled automatically in code)

**Error: "CORS error"**
- Solution: Verify `FRONTEND_URL` environment variable is set
- Check backend CORS configuration includes frontend URL
- Ensure frontend is using correct `VITE_API_BASE_URL`

### Frontend Issues

**Error: "Failed to fetch"**
- Solution: Check `VITE_API_BASE_URL` is set correctly
- Verify backend is deployed and accessible
- Check browser console for specific error

**Error: "404 on routes"**
- Solution: Ensure `vercel.json` has proper rewrites for SPA routing

**Error: "Environment variable not found"**
- Solution: Vite requires `VITE_` prefix for environment variables
- Rebuild after adding environment variables

---

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to your main branch if you connected via Git.

### Manual Deployment

```bash
# Backend
cd backend
vercel --prod

# Frontend
cd frontend-react
vercel --prod
```

### Preview Deployments

Every pull request gets a preview deployment automatically.

---

## 📊 Monitoring

1. **Vercel Dashboard**: Monitor function invocations, errors, and performance
2. **Logs**: View real-time logs in Vercel dashboard
3. **Analytics**: Enable Vercel Analytics for frontend performance

---

## ✅ Deployment Checklist

### Backend
- [ ] `vercel.json` created in backend folder
- [ ] `api/index.py` wrapper created
- [ ] `DATABASE_URL` environment variable set
- [ ] `SIMILARITY_THRESHOLD` environment variable set (optional)
- [ ] `FRONTEND_URL` environment variable set
- [ ] CORS configuration updated to use `FRONTEND_URL`
- [ ] Backend deployed successfully
- [ ] Health check endpoint works
- [ ] API documentation accessible

### Frontend
- [ ] `vercel.json` created (optional, auto-detected)
- [ ] `VITE_API_BASE_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] Frontend loads without errors
- [ ] API calls work correctly
- [ ] CORS errors resolved

### Testing
- [ ] Backend health check passes
- [ ] Frontend can connect to backend
- [ ] Add question functionality works
- [ ] Search functionality works
- [ ] Similarity check works
- [ ] Usage history works

---

## 🎉 Success!

Your application should now be live on Vercel!

- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`
- **API Docs**: `https://your-backend.vercel.app/docs`

---

## 💡 Tips

1. **Custom Domains**: Add custom domains in Vercel dashboard
2. **Environment Variables**: Use different values for preview vs production
3. **Performance**: Monitor cold start times and optimize if needed
4. **Costs**: Free tier is generous, but monitor usage if scaling

---

## 🔗 Additional Resources

- [Vercel Python Documentation](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)
- [Vercel Vite Documentation](https://vercel.com/docs/frameworks/vite)
- [FastAPI on Vercel](https://vercel.com/guides/deploying-fastapi-with-vercel)


# 🚀 Quick Start: Production Deployment

## Step 1: Choose Your Database Provider

### Recommended: Supabase (Free & Easy) ⭐

1. **Sign up**: https://supabase.com (free account)
2. **Create project**: Click "New Project"
3. **Get connection string**:
   - Go to Settings → Database
   - Copy "Connection string" → "URI"
   - Replace `[YOUR-PASSWORD]` with your database password

### Alternative Options:
- **Neon**: https://neon.tech (free PostgreSQL)
- **Railway**: https://railway.app (free tier available)
- **Render**: https://render.com (free tier available)

---

## Step 2: Configure Your Application

### Create `.env` file in project root:

```env
# Database Connection (from Step 1)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Similarity Threshold
SIMILARITY_THRESHOLD=0.85

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=False
```

**Important**: Replace `YOUR_PASSWORD` with your actual database password!

---

## Step 3: Install Dependencies

```bash
# Install all dependencies including PostgreSQL driver
pip install -r requirements.txt
```

This will install `psycopg2-binary` for PostgreSQL support.

---

## Step 4: Initialize Database

```bash
# Test connection and create tables
python setup_database.py
```

Or manually:
```bash
python -c "from app.database import init_db; init_db()"
```

---

## Step 5: Test Locally

```bash
# Start the server
python run.py
```

Visit: http://localhost:8000

---

## Step 6: Deploy to Cloud

### Option A: Render.com

1. **Connect GitHub repository**
2. **Create Web Service**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Add Environment Variables**:
   - `DATABASE_URL` (from Step 1)
   - `SIMILARITY_THRESHOLD=0.85`
4. **Deploy!**

### Option B: Railway.app

1. **Connect GitHub repository**
2. **Add PostgreSQL** (Railway auto-creates `DATABASE_URL`)
3. **Deploy!** (Railway auto-detects FastAPI)

### Option C: Heroku

1. **Install Heroku CLI**
2. **Create app**: `heroku create your-app-name`
3. **Add PostgreSQL**: `heroku addons:create heroku-postgresql:mini`
4. **Deploy**: `git push heroku main`

---

## Step 7: Configure Frontend

Update frontend to point to your deployed backend:

**For React Frontend** (`frontend-react/.env`):
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

**For HTML Frontend** (`frontend/app.js`):
```javascript
const API_BASE = "https://your-backend.onrender.com/api";
```

---

## ✅ Verification Checklist

- [ ] Database connection tested successfully
- [ ] Tables created (questions, question_usage)
- [ ] Backend running locally
- [ ] Can add/search questions
- [ ] Backend deployed to cloud
- [ ] Frontend configured with backend URL
- [ ] Multiple users can access and see shared data

---

## 🆘 Troubleshooting

### "Could not connect to database"
- Check DATABASE_URL is correct
- Verify password is correct
- Check if database is accessible from your network

### "Module not found: psycopg2"
- Run: `pip install psycopg2-binary`

### "Tables already exist"
- This is normal! Tables are created automatically
- Run `python setup_database.py` to verify

---

## 📚 More Information

- **Detailed Guide**: See `PRODUCTION_DEPLOYMENT.md`
- **Multi-User Info**: See `MULTI_USER_ACCESS.md`
- **General Setup**: See `README.md`

---

**You're ready to deploy!** 🎉









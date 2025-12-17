# Production Deployment Guide

This guide helps you deploy the Question Bank Management System for multiple users with a proper production database.

## 🎯 Quick Start: Choose Your Database

### Option 1: Free Cloud PostgreSQL (Recommended) ⭐

**Best for:** Production deployment with multiple users

**Free Options:**
- **Supabase** (Recommended) - Free tier: 500MB database, unlimited API requests
- **Neon** - Free tier: 3GB storage, serverless PostgreSQL
- **Railway** - Free tier: $5 credit/month
- **Render** - Free tier available

### Option 2: Self-Hosted PostgreSQL

**Best for:** Full control, enterprise deployments

### Option 3: SQLite (Development Only)

**Best for:** Testing, single-user, development
**⚠️ Not recommended for production with multiple users**

---

## 🚀 Step-by-Step: Supabase Setup (Recommended)

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project

### Step 2: Get Database Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Configure Your Application

1. Create a `.env` file in your project root:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   SIMILARITY_THRESHOLD=0.85
   HOST=0.0.0.0
   PORT=8000
   DEBUG=False
   ```

2. Install PostgreSQL driver:
   ```bash
   pip install psycopg2-binary
   ```

3. Initialize the database:
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

### Step 4: Deploy Backend

Deploy to your preferred platform (Render, Railway, Heroku, etc.) with the `.env` variables.

---

## 🚀 Step-by-Step: Neon Setup

### Step 1: Create Neon Account

1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project

### Step 2: Get Connection String

1. In your Neon dashboard, click on your project
2. Go to **Connection Details**
3. Copy the connection string (it includes SSL)

### Step 3: Configure Application

Same as Supabase (Step 3 above), but use the Neon connection string.

---

## 🚀 Step-by-Step: Railway Setup

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up (GitHub login available)

### Step 2: Create PostgreSQL Database

1. Create a new project
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway automatically creates the database

### Step 3: Get Connection String

1. Click on your PostgreSQL service
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value

### Step 4: Deploy Backend

1. Add your backend code to Railway
2. Add environment variable: `DATABASE_URL` (Railway auto-provides this)
3. Deploy!

---

## 📋 Environment Variables Checklist

Create a `.env` file with these variables:

```env
# Required: Database Connection
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Similarity Threshold (default: 0.85)
SIMILARITY_THRESHOLD=0.85

# Optional: Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Optional: CORS (for production, specify your frontend URL)
# CORS_ORIGINS=https://your-frontend.com
```

---

## 🔧 Local PostgreSQL Setup (Self-Hosted)

### Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for `postgres` user

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE question_bank;
CREATE USER question_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE question_bank TO question_user;
\q
```

### Configure Application

```env
DATABASE_URL=postgresql://question_user:your_secure_password@localhost:5432/question_bank
```

---

## 🧪 Testing Database Connection

After setting up your database, test the connection:

```bash
# Test connection and create tables
python -c "from app.database import init_db, DATABASE_URL; print(f'Connecting to: {DATABASE_URL}'); init_db(); print('✅ Database initialized successfully!')"
```

---

## 📊 Database Comparison

| Database | Free Tier | Concurrent Users | Best For |
|----------|-----------|------------------|----------|
| **Supabase** | 500MB, Unlimited API | 100+ | Production, Easy setup |
| **Neon** | 3GB storage | 100+ | Production, Serverless |
| **Railway** | $5/month credit | 100+ | Production, Simple |
| **SQLite** | Unlimited | 1-10 | Development only |
| **PostgreSQL (Self-hosted)** | Free | Unlimited | Enterprise, Full control |

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong passwords** for database
3. **Enable SSL** for production databases (most cloud providers do this automatically)
4. **Restrict CORS** to your frontend domain in production
5. **Use environment variables** for all sensitive data
6. **Regular backups** - Most cloud providers offer automatic backups

---

## 🚨 Troubleshooting

### Connection Errors

**Error: "could not connect to server"**
- Check if database is running
- Verify connection string is correct
- Check firewall/network settings

**Error: "password authentication failed"**
- Verify password in connection string
- Check if user has correct permissions

**Error: "database does not exist"**
- Create the database first
- Verify database name in connection string

### Migration from SQLite to PostgreSQL

If you have existing SQLite data:

1. **Export data from SQLite:**
   ```bash
   python -c "
   import sqlite3
   import csv
   conn = sqlite3.connect('question_bank.db')
   cursor = conn.cursor()
   cursor.execute('SELECT * FROM questions')
   with open('questions_export.csv', 'w', newline='') as f:
       writer = csv.writer(f)
       writer.writerow([i[0] for i in cursor.description])
       writer.writerows(cursor.fetchall())
   conn.close()
   "
   ```

2. **Set up PostgreSQL** (follow steps above)

3. **Initialize PostgreSQL database:**
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

4. **Import data** (you may need a custom script for this)

---

## 📞 Need Help?

- Check the main `README.md` for general setup
- Check `DEPLOYMENT.md` for deployment options
- Review error logs for specific issues

---

## ✅ Deployment Checklist

- [ ] Database provider chosen and account created
- [ ] Database connection string obtained
- [ ] `.env` file created with `DATABASE_URL`
- [ ] PostgreSQL driver installed (`psycopg2-binary`)
- [ ] Database initialized (`init_db()`)
- [ ] Connection tested successfully
- [ ] Backend deployed with environment variables
- [ ] Frontend configured to point to backend
- [ ] CORS configured for production
- [ ] Security settings reviewed

---

**Ready to deploy!** 🎉


# What is Session Mode Pooler?

## Connection Pooling in Supabase

Supabase offers **Connection Pooling** to manage database connections efficiently. There are two modes:

### 1. **Session Mode** (Port 6543) - Recommended
- **What it is**: A connection pooler that maintains a pool of database connections
- **Port**: 6543
- **Use case**: Best for most applications, especially if direct connection fails
- **Format**: `postgresql://postgres.[PROJECT-REF]:password@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### 2. **Transaction Mode** (Port 6543)
- Similar to Session mode but optimized for transactions
- Same port (6543) but different connection behavior

### 3. **Direct Connection** (Port 5432)
- Connects directly to PostgreSQL without pooling
- May have DNS issues on some networks
- Format: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

## Where to Find Session Mode Connection String

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on your project from the list

3. **Navigate to Database Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **Database** in the settings menu

4. **Find Connection Pooling Section**
   - Scroll down to find **"Connection Pooling"** section
   - You'll see different connection modes listed

5. **Get Session Mode Connection String**
   - Look for **"Session mode"** (it will show port 6543)
   - You'll see a connection string like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Click the **"Copy"** button next to it

6. **Replace Password Placeholder**
   - The connection string will have `[YOUR-PASSWORD]` or similar placeholder
   - Get your actual database password from the same page (scroll up to "Database password")
   - Replace `[YOUR-PASSWORD]` with your actual password
   - If password has special characters, URL-encode them:
     ```bash
     python encode_password.py "YOUR_PASSWORD"
     ```

## Visual Guide

```
Supabase Dashboard
├── Your Project
    ├── Settings (gear icon)
        ├── Database
            ├── Connection string (Direct - port 5432)
            ├── Connection Pooling ← LOOK HERE
            │   ├── Session mode (port 6543) ← USE THIS
            │   └── Transaction mode (port 6543)
            └── Database password (scroll up to find this)
```

## Why Use Session Mode Pooler?

✅ **More reliable**: Better DNS resolution  
✅ **Better performance**: Connection pooling reduces overhead  
✅ **Recommended by Supabase**: Works better for most applications  
✅ **Avoids DNS issues**: Direct connection sometimes fails with DNS errors  

## Your Current Situation

You're currently using:
- ✅ Connection Pooler (correct choice)
- ✅ Session mode format (correct)
- ❌ But authentication is failing

This means you need to:
1. Get a **fresh connection string** from Supabase dashboard
2. Make sure the **password is correct**
3. Make sure the **project reference** in username matches your project

## Quick Check

To verify you're looking at the right place:
- Connection string should contain: `pooler.supabase.com`
- Port should be: `6543`
- Username should be: `postgres.[PROJECT-REF]` (not just `postgres`)




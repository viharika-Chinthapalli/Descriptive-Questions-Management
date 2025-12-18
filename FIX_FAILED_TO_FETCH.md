# Fix "Failed to fetch" Error

## Problem

The error "Failed to fetch" means the frontend cannot connect to the backend API.

## Current Status

- ✅ Frontend: Running on port 3000
- ❌ Backend: NOT running on port 8000

## Solution

### Step 1: Start the Backend

**Open a NEW terminal** (keep the frontend terminal running) and run:

```powershell
# Make sure you're in the project directory
cd "C:\Users\Viharika\OneDrive\Desktop\Descriptive POC"

# Activate virtual environment (if not already)
.venv\Scripts\Activate.ps1

# Start the backend
python run.py
```

**You should see:**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:app.main:Application starting with database: postgresql://...
INFO:app.main:Database initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 2: Verify Backend is Running

**In another terminal**, test the backend:

```powershell
python -c "import requests; r = requests.get('http://localhost:8000/health'); print('Backend is running!' if r.status_code == 200 else 'Error')"
```

Or visit in browser: http://localhost:8000/health

### Step 3: Test Frontend Connection

Once backend is running, refresh your frontend browser page (http://localhost:3000).

The "Failed to fetch" error should be gone.

## Quick Check

Run this to see what's running:

```powershell
# Check backend (port 8000)
netstat -ano | findstr :8000

# Check frontend (port 3000)
netstat -ano | findstr :3000
```

**Expected:**
- Port 8000: Should show LISTENING (backend)
- Port 3000: Should show LISTENING (frontend)

## Common Issues

### 1. Backend Won't Start

**Error: Address already in use**
- Another process is using port 8000
- Solution: Change port in `.env`: `PORT=8001`
- Or kill the process using port 8000

**Error: Database connection failed**
- Check `.env` file has correct `DATABASE_URL`
- Run: `python test_supabase_auth.py`

### 2. Frontend Still Shows "Failed to fetch"

**Check:**
1. Backend is actually running (see Step 2)
2. Browser console for detailed error
3. Network tab in browser DevTools
4. CORS errors (should be fixed, but check)

**Try:**
- Hard refresh: Ctrl+Shift+R
- Clear browser cache
- Check browser console for specific error

### 3. Proxy Not Working

If Vite proxy isn't working, you can use direct connection:

**Create `.env` file in `frontend-react/` directory:**
```
VITE_API_BASE_URL=http://localhost:8000
```

Then restart the frontend dev server.

## Complete Setup Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Database connected (check backend logs)
- [ ] No errors in browser console
- [ ] Can access http://localhost:8000/health
- [ ] Can access http://localhost:3000

## Still Having Issues?

1. **Check backend logs** for errors
2. **Check browser console** (F12) for detailed errors
3. **Verify CORS** - backend should allow localhost:3000
4. **Test API directly**: http://localhost:8000/api/questions




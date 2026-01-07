# Quick Start Guide

## ✅ Current Status

- ✅ Database Connection: Working
- ✅ Database Tables: Created
- ❌ Backend Server: Needs to be started

## 🚀 Start the Backend

**In your current terminal, run:**

```powershell
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

**Keep this terminal open** - the backend needs to keep running.

## 🧪 Test the Connection

**Open a NEW terminal** (keep the backend running in the first one) and run:

```powershell
python test_full_connection.py
```

**Expected result:**
```
✅ Database Connection: PASS
✅ Database Tables: PASS
✅ Backend API: PASS
✅ API Endpoint: PASS
```

## 🌐 Start the Frontend

**In a THIRD terminal**, run:

```powershell
cd frontend-react
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## 📱 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ⚠️ Important Notes

1. **Keep the backend terminal open** - closing it will stop the server
2. **Keep the frontend terminal open** - closing it will stop the dev server
3. **Use Ctrl+C** to stop either server when needed

## 🔧 Troubleshooting

### Backend won't start?

1. Check if port 8000 is in use:
   ```powershell
   netstat -ano | findstr :8000
   ```

2. Check for errors in the terminal output

3. Verify database connection:
   ```powershell
   python test_supabase_auth.py
   ```

### Frontend can't connect to backend?

1. Make sure backend is running on port 8000
2. Check browser console for errors
3. Verify CORS settings in `app/main.py`

## ✅ All Set!

Once both servers are running:
- Backend: http://localhost:8000 ✅
- Frontend: http://localhost:3000 ✅

You can now use the application!








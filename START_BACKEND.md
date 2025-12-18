# How to Start the Backend

## Quick Start

1. **Open a terminal** in the project directory
2. **Activate virtual environment** (if not already activated):
   ```powershell
   .venv\Scripts\Activate.ps1
   ```

3. **Start the backend**:
   ```powershell
   python run.py
   ```

4. **You should see**:
   ```
   INFO:     Started server process [xxxxx]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   ```

## Verify Backend is Running

In another terminal, test the connection:
```powershell
python test_full_connection.py
```

Or test manually:
```powershell
python -c "import requests; r = requests.get('http://localhost:8000/health'); print(r.json())"
```

## Troubleshooting

### Backend Won't Start

1. **Check if port 8000 is already in use**:
   ```powershell
   netstat -ano | findstr :8000
   ```
   If something is using port 8000, either:
   - Stop that process
   - Change port in `.env` file: `PORT=8001`

2. **Check for errors in startup**:
   - Look for error messages when running `python run.py`
   - Common issues:
     - Database connection errors (check `.env` file)
     - Missing dependencies (run `pip install -r requirements.txt`)

3. **Check database connection**:
   ```powershell
   python test_supabase_auth.py
   ```

### Backend Starts But API Fails

1. **Check database tables exist**:
   ```powershell
   python verify_tables.py
   ```

2. **Initialize database if needed**:
   ```powershell
   python setup_database.py
   ```

## Running Backend in Background (Windows)

If you want to run the backend in the background:

```powershell
Start-Process python -ArgumentList "run.py" -WindowStyle Hidden
```

To stop it later:
```powershell
Get-Process python | Where-Object {$_.Path -like "*Descriptive POC*"} | Stop-Process
```

## Next Steps

Once backend is running:

1. **Start frontend** (in another terminal):
   ```powershell
   cd frontend-react
   npm run dev
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs




# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Backend will be available at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd backend
python run.py


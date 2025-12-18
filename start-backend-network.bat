@echo off
echo ========================================
echo Starting Question Bank Backend
echo ========================================
echo.
echo The backend will be accessible from other devices on your network.
echo.
echo Finding your IP address...
ipconfig | findstr /i "IPv4"
echo.
echo Share the IP address above with other users.
echo They should use: http://YOUR_IP:8000
echo.
echo Starting backend server...
echo Press Ctrl+C to stop the server.
echo.
cd backend
python run.py



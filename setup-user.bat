@echo off
echo ========================================
echo Question Bank Frontend Setup
echo ========================================
echo.
echo This script will configure the frontend to connect to the backend server.
echo.
set /p PC_IP="Enter the backend server IP address (e.g., 192.168.1.100): "
echo.
echo Creating .env file with configuration...
echo VITE_API_BASE_URL=http://%PC_IP%:8000 > frontend-react\.env
echo.
echo Configuration saved!
echo.
echo Next steps:
echo 1. Navigate to frontend-react folder: cd frontend-react
echo 2. Install dependencies: npm install
echo 3. Start the frontend: npm run dev
echo.
pause



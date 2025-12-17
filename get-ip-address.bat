@echo off
echo ========================================
echo Finding Your PC's IP Address
echo ========================================
echo.
echo Your IP addresses:
echo.
ipconfig | findstr /i "IPv4"
echo.
echo Use the IP address shown above (usually under WiFi or Ethernet adapter)
echo Share this IP with other users so they can connect to the backend.
echo.
pause



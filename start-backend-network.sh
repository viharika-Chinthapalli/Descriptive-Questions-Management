#!/bin/bash

echo "========================================"
echo "Starting Question Bank Backend"
echo "========================================"
echo ""
echo "The backend will be accessible from other devices on your network."
echo ""
echo "Finding your IP address..."
if command -v ip &> /dev/null; then
    ip addr show | grep -E "inet [0-9]" | awk '{print $2}' | cut -d/ -f1
elif command -v ifconfig &> /dev/null; then
    ifconfig | grep -E "inet [0-9]" | awk '{print $2}'
fi
echo ""
echo "Share the IP address above with other users."
echo "They should use: http://YOUR_IP:8000"
echo ""
echo "Starting backend server..."
echo "Press Ctrl+C to stop the server."
echo ""
python3 run.py



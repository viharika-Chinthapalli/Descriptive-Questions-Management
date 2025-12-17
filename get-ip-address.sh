#!/bin/bash

echo "========================================"
echo "Finding Your PC's IP Address"
echo "========================================"
echo ""
echo "Your IP addresses:"
echo ""

if command -v ip &> /dev/null; then
    ip addr show | grep -E "inet [0-9]" | awk '{print $2}' | cut -d/ -f1
elif command -v ifconfig &> /dev/null; then
    ifconfig | grep -E "inet [0-9]" | awk '{print $2}'
else
    echo "Could not find IP address. Please check your network settings."
fi

echo ""
echo "Use the IP address shown above (usually starts with 192.168.x.x or 10.x.x.x)"
echo "Share this IP with other users so they can connect to the backend."
echo ""



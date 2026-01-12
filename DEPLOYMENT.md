# Deployment Guide - Multi-User Access

This guide explains how to make the Question Bank Management System accessible to multiple users on different laptops.

## Option 1: Local Network Deployment (Quick Setup)

This allows users on the same network (WiFi/LAN) to access the backend running on your PC.

### Step 1: Find Your PC's IP Address

#### Windows:
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).

#### Linux/Mac:
```bash
ifconfig
# or
ip addr show
```

You'll see something like `192.168.1.100` or `10.0.0.5`

### Step 2: Configure Backend to Accept Network Connections

The backend is already configured to accept connections from any IP (`0.0.0.0`), so you just need to:

1. **Allow Firewall Access (Windows)**:
   - Open Windows Defender Firewall
   - Click "Allow an app or feature through Windows Defender Firewall"
   - Click "Change Settings" → "Allow another app"
   - Browse to your Python executable or add port 8000
   - Or run this in PowerShell (as Administrator):
   ```powershell
   New-NetFirewallRule -DisplayName "Question Bank API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

2. **Start the Backend**:
   ```bash
   python run.py
   ```
   The backend will be accessible at `http://YOUR_IP:8000`

### Step 3: Configure Frontend for Each User

Each user needs to:

1. **Clone/Copy the frontend-react folder** to their laptop

2. **Create a `.env` file** in `frontend-react/`:
   ```env
   VITE_API_BASE_URL=http://YOUR_PC_IP:8000
   ```
   Replace `YOUR_PC_IP` with your actual IP address (e.g., `http://192.168.1.100:8000`)

3. **Install dependencies**:
   ```bash
   cd frontend-react
   npm install
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

5. **Access the application** at `http://localhost:3000`

### Step 4: Share Your IP Address

Share your PC's IP address with all users. They'll need to update their `.env` file with this IP.

**Note**: If your IP changes (common with DHCP), you'll need to update everyone's `.env` files.

---

## Option 2: Cloud Deployment (Recommended for Production)

Deploy the backend to a cloud service so it's accessible from anywhere.

### Option 2A: Free Cloud Services

#### Render.com (Free Tier Available)

1. **Create account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     ```
     DATABASE_URL=sqlite:///./question_bank.db
     SIMILARITY_THRESHOLD=0.85
     ```

3. **Get the deployment URL** (e.g., `https://question-bank.onrender.com`)

4. **Update frontend `.env`**:
   ```env
   VITE_API_BASE_URL=https://question-bank.onrender.com
   ```

#### Railway.app (Free Trial)

1. **Create account** at https://railway.app

2. **Deploy from GitHub**:
   - Connect repository
   - Railway auto-detects Python
   - Add environment variables

3. **Get deployment URL** and update frontend

#### PythonAnywhere (Free Tier)

1. **Create account** at https://www.pythonanywhere.com

2. **Upload your code** via Files tab

3. **Configure Web App**:
   - Set source code directory
   - Set WSGI file
   - Add environment variables

4. **Get your domain** (e.g., `yourusername.pythonanywhere.com`)

### Option 2B: Self-Hosted VPS

If you have a VPS (DigitalOcean, AWS EC2, etc.):

1. **SSH into your server**

2. **Install dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip nginx
   pip3 install -r requirements.txt
   ```

3. **Set up systemd service** (`/etc/systemd/system/question-bank.service`):
   ```ini
   [Unit]
   Description=Question Bank API
   After=network.target

   [Service]
   User=youruser
   WorkingDirectory=/path/to/your/app
   Environment="PATH=/usr/bin:/usr/local/bin"
   ExecStart=/usr/local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

4. **Start the service**:
   ```bash
   sudo systemctl start question-bank
   sudo systemctl enable question-bank
   ```

5. **Configure Nginx** as reverse proxy (optional but recommended)

---

## Option 3: Docker Deployment (Advanced)

### Backend Docker Setup

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./question_bank.db:/app/question_bank.db
    environment:
      - DATABASE_URL=sqlite:///./question_bank.db
      - SIMILARITY_THRESHOLD=0.85
```

Run:
```bash
docker-compose up -d
```

---

## Quick Setup Script for Users

Create a setup script for easy distribution:

### `setup-user.bat` (Windows)
```batch
@echo off
echo Setting up Question Bank Frontend...
echo.
set /p PC_IP="Enter the backend server IP address: "
echo VITE_API_BASE_URL=http://%PC_IP%:8000 > .env
echo.
echo Configuration saved! Run 'npm install' then 'npm run dev'
pause
```

### `setup-user.sh` (Linux/Mac)
```bash
#!/bin/bash
echo "Setting up Question Bank Frontend..."
echo ""
read -p "Enter the backend server IP address: " PC_IP
echo "VITE_API_BASE_URL=http://${PC_IP}:8000" > .env
echo ""
echo "Configuration saved! Run 'npm install' then 'npm run dev'"
```

---

## Troubleshooting

### Backend not accessible from other devices

1. **Check firewall settings** - Ensure port 8000 is open
2. **Verify IP address** - Make sure you're using the correct IP
3. **Check network** - Ensure all devices are on the same network
4. **Test connection** - Try accessing `http://YOUR_IP:8000/health` from another device's browser

### CORS Errors

The backend is already configured to allow all origins (`allow_origins=["*"]`), so CORS should work. If you still see errors, check:
- Backend is running
- Correct IP/URL in frontend `.env`
- Network connectivity

### Database Location

For local network deployment, the database stays on your PC. For cloud deployment, consider:
- Using PostgreSQL instead of SQLite
- Setting up database backups
- Using cloud database services (Supabase, PlanetScale, etc.)

---

## Security Considerations

1. **For Production**:
   - Change CORS to specific origins
   - Add authentication/authorization
   - Use HTTPS
   - Set up rate limiting
   - Use environment variables for secrets

2. **For Local Network**:
   - Consider adding basic authentication
   - Limit access to trusted network only
   - Regularly update dependencies

---

## Recommended Approach

- **Development/Testing**: Use Option 1 (Local Network)
- **Production**: Use Option 2 (Cloud Deployment) with Render.com or Railway.app
- **Enterprise**: Use Option 3 (Docker) or Option 2B (VPS)










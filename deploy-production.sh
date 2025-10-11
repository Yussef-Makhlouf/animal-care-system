#!/bin/bash

# ========================================
#   AHCP Production Deployment Script
#   Linux/Unix Deployment Automation
# ========================================

set -e  # Exit on error

echo ""
echo "========================================"
echo "   AHCP Production Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}WARNING: Running as root!${NC}"
    echo "Consider using a non-root user with sudo privileges."
    echo ""
fi

echo "[1/10] Stopping existing processes..."
pkill -f node || true
sleep 2
echo -e "${GREEN}✓${NC} Stopped existing processes"

echo ""
echo "[2/10] Checking MongoDB service..."
if ! systemctl is-active --quiet mongod; then
    echo "Starting MongoDB service..."
    sudo systemctl start mongod
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to start MongoDB!${NC}"
        echo "Please start MongoDB manually and run this script again."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} MongoDB is running"

echo ""
echo "[3/10] Installing/Updating Backend dependencies..."
cd ahcp-backend
npm install --production
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install backend dependencies!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"

echo ""
echo "[4/10] Checking environment configuration..."
if [ ! -f .env ]; then
    if [ -f production.env ]; then
        echo "Copying production.env to .env..."
        cp production.env .env
    else
        echo -e "${RED}ERROR: No environment configuration found!${NC}"
        echo "Please create .env file with production settings."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Environment configuration ready"

echo ""
echo "[5/10] Running database seeds (if needed)..."
node seed.js || true
echo -e "${GREEN}✓${NC} Database initialization complete"

cd ..

echo ""
echo "[6/10] Building Frontend..."
cd ahcp-dashboard
npm install --production
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install frontend dependencies!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

echo "Building Next.js application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to build frontend!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Frontend built successfully"

cd ..

echo ""
echo "[7/10] Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✓${NC} Logs directory ready"

echo ""
echo "[8/10] Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install PM2!${NC}"
        echo "Please install PM2 manually: sudo npm install -g pm2"
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} PM2 is available"

echo ""
echo "[9/10] Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start applications with PM2!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Applications started with PM2"

echo ""
echo "[10/10] Configuring PM2 startup..."
pm2 save
pm2 startup | tail -n 1 | bash || true
echo -e "${GREEN}✓${NC} PM2 startup configured"

echo ""
echo "========================================"
echo "   Deployment Complete!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 list          - List all processes"
echo "  pm2 monit         - Monitor processes"
echo "  pm2 logs          - View logs"
echo "  pm2 restart all   - Restart all processes"
echo "  pm2 stop all      - Stop all processes"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT POST-DEPLOYMENT STEPS:${NC}"
echo "1. Change default admin password"
echo "2. Update JWT_SECRET in .env"
echo "3. Configure proper CORS_ORIGIN"
echo "4. Set up SSL/HTTPS with nginx"
echo "5. Configure firewall rules"
echo "6. Set up backup automation"
echo ""


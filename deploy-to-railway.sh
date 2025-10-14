#!/bin/bash

# Railway Deployment Script for AHCP System
# This script helps you deploy your Animal Health Care Program to Railway

echo "🚂 Railway Deployment Script for AHCP System"
echo "=============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Please install it first:"
    echo "npm install -g @railway/cli"
    echo "or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI is installed"
echo ""

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Create new project
echo "🏗️  Creating new Railway project..."
railway new

echo ""
echo "📋 Next steps:"
echo "1. Go to your Railway dashboard"
echo "2. Add MongoDB database to your project"
echo "3. Deploy backend service from ahcp-backend folder"
echo "4. Deploy frontend service from ahcp-dashboard folder"
echo "5. Configure environment variables"
echo "6. Run database setup script"
echo ""
echo "📖 For detailed instructions, see: RAILWAY_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy deploying!"

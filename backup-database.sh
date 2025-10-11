#!/bin/bash

# ========================================
#   AHCP Database Backup Script
#   Linux/Unix MongoDB Backup Automation
# ========================================

set -e

echo ""
echo "========================================"
echo "   AHCP Database Backup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DB_NAME="ahcp_database"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

echo "[1/5] Checking MongoDB installation..."
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}ERROR: mongodump not found!${NC}"
    echo "Please install MongoDB Database Tools."
    exit 1
fi
echo -e "${GREEN}✓${NC} MongoDB tools found"

echo ""
echo "[2/5] Checking MongoDB service..."
if ! systemctl is-active --quiet mongod; then
    echo -e "${RED}ERROR: MongoDB service is not running!${NC}"
    echo "Please start MongoDB service first."
    exit 1
fi
echo -e "${GREEN}✓${NC} MongoDB is running"

echo ""
echo "[3/5] Creating backup directory..."
mkdir -p "${BACKUP_DIR}"
echo -e "${GREEN}✓${NC} Backup directory ready: ${BACKUP_DIR}"

echo ""
echo "[4/5] Backing up database: ${DB_NAME}..."
echo "Backup location: ${BACKUP_PATH}"
mongodump --db "${DB_NAME}" --out "${BACKUP_PATH}" --quiet
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Database backup failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Database backup completed"

echo ""
echo "[5/5] Creating compressed archive..."
cd "${BACKUP_DIR}"
tar -czf "backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Compressed archive created"
    rm -rf "backup_${TIMESTAMP}"
    echo -e "${GREEN}✓${NC} Removed uncompressed backup"
else
    echo -e "${YELLOW}Warning: Compression failed${NC}"
    echo "Backup available in: ${BACKUP_PATH}"
fi
cd ..

echo ""
echo "========================================"
echo "   Backup Complete!"
echo "========================================"
echo ""
echo "Backup location: ${BACKUP_PATH}.tar.gz"
echo "Database: ${DB_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo ""
echo "To restore this backup, run:"
echo "  ./restore-database.sh ${TIMESTAMP}"
echo ""

# Cleanup old backups (keep last 7)
echo "Cleaning up old backups (keeping last 7)..."
cd "${BACKUP_DIR}"
ls -t backup_* 2>/dev/null | tail -n +8 | xargs -r rm -rf
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""


#!/bin/bash

# ========================================
#   AHCP Database Restore Script
#   Linux/Unix MongoDB Restore Automation
# ========================================

set -e

echo ""
echo "========================================"
echo "   AHCP Database Restore"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DB_NAME="ahcp_database"
BACKUP_DIR="backups"

# Check if backup timestamp is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}ERROR: Backup timestamp not provided!${NC}"
    echo ""
    echo "Usage: ./restore-database.sh TIMESTAMP"
    echo ""
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}"/backup_* 2>/dev/null || echo "No backups found"
    echo ""
    exit 1
fi

TIMESTAMP=$1
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"
ARCHIVE_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

echo "[1/5] Checking MongoDB installation..."
if ! command -v mongorestore &> /dev/null; then
    echo -e "${RED}ERROR: mongorestore not found!${NC}"
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
echo "[3/5] Locating backup..."
if [ -f "${ARCHIVE_PATH}" ]; then
    echo "Found compressed backup: ${ARCHIVE_PATH}"
    echo "Extracting..."
    cd "${BACKUP_DIR}"
    tar -xzf "backup_${TIMESTAMP}.tar.gz"
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to extract backup!${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✓${NC} Backup extracted"
elif [ -d "${BACKUP_PATH}" ]; then
    echo "Found backup: ${BACKUP_PATH}"
else
    echo -e "${RED}ERROR: Backup not found!${NC}"
    echo "Looking for: ${BACKUP_PATH}"
    echo ""
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}"/backup_* 2>/dev/null || echo "No backups found"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo "Database: ${DB_NAME}"
echo "Backup: ${TIMESTAMP}"
echo ""
read -p "Continue with restore? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "[4/5] Dropping existing database..."
mongo "${DB_NAME}" --eval "db.dropDatabase()" >/dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Existing database dropped"

echo ""
echo "[5/5] Restoring database from backup..."
mongorestore --db "${DB_NAME}" "${BACKUP_PATH}/${DB_NAME}" --quiet
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Database restore failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Database restore completed"

# Cleanup extracted files if from archive
if [ -f "${ARCHIVE_PATH}" ] && [ -d "${BACKUP_PATH}" ]; then
    rm -rf "${BACKUP_PATH}"
fi

echo ""
echo "========================================"
echo "   Restore Complete!"
echo "========================================"
echo ""
echo "Database: ${DB_NAME}"
echo "Restored from: ${TIMESTAMP}"
echo ""


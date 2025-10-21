#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-database.sh [backup-name]

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"backup_$TIMESTAMP"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NFL Predictor Database Backup ===${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo "Usage: DATABASE_URL=postgresql://... ./scripts/backup-database.sh"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backup: $BACKUP_NAME${NC}"

# PostgreSQL backup
echo "Backing up PostgreSQL..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${BACKUP_NAME}_postgres.sql"
POSTGRES_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_postgres.sql" | cut -f1)
echo -e "${GREEN}✓ PostgreSQL backup complete ($POSTGRES_SIZE)${NC}"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/${BACKUP_NAME}_postgres.sql"
COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_postgres.sql.gz" | cut -f1)
echo -e "${GREEN}✓ Backup compressed ($COMPRESSED_SIZE)${NC}"

# MongoDB backup (if MONGODB_URI is set)
if [ -n "$MONGODB_URI" ]; then
    echo "Backing up MongoDB..."
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/${BACKUP_NAME}_mongo" --gzip
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_mongo.tar.gz" -C "$BACKUP_DIR" "${BACKUP_NAME}_mongo"
    rm -rf "$BACKUP_DIR/${BACKUP_NAME}_mongo"
    MONGO_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_mongo.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ MongoDB backup complete ($MONGO_SIZE)${NC}"
fi

# List recent backups
echo -e "\n${YELLOW}Recent backups:${NC}"
ls -lh "$BACKUP_DIR" | tail -n 5

echo -e "\n${GREEN}=== Backup Complete ===${NC}"
echo "Location: $BACKUP_DIR"
echo "Files created:"
echo "  - ${BACKUP_NAME}_postgres.sql.gz"
if [ -n "$MONGODB_URI" ]; then
    echo "  - ${BACKUP_NAME}_mongo.tar.gz"
fi

# Cleanup old backups (keep last 10)
echo -e "\n${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"
cd "$BACKUP_DIR"
ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
cd - > /dev/null

echo -e "${GREEN}✓ Cleanup complete${NC}"

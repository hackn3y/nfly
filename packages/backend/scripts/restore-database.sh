#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore-database.sh <backup-file>

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NFL Predictor Database Restore ===${NC}"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Backup file not specified${NC}"
    echo "Usage: ./scripts/restore-database.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo "Usage: DATABASE_URL=postgresql://... ./scripts/restore-database.sh <backup-file>"
    exit 1
fi

# Warning
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo "Database: $DATABASE_URL"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo -e "\n${YELLOW}Starting restore...${NC}"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop existing connections
echo "Closing existing connections..."
psql "$DATABASE_URL" -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
AND pid <> pg_backend_pid();
" || true

# Restore database
echo "Restoring PostgreSQL..."
psql "$DATABASE_URL" < "$RESTORE_FILE"

# Cleanup temporary file
if [ "$RESTORE_FILE" != "$BACKUP_FILE" ]; then
    rm "$RESTORE_FILE"
fi

echo -e "${GREEN}✓ PostgreSQL restore complete${NC}"

# Verify restore
echo -e "\n${YELLOW}Verifying restore...${NC}"
TABLES=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public';
" | tr -d ' ')

echo "Tables found: $TABLES"

if [ "$TABLES" -gt 0 ]; then
    echo -e "${GREEN}✓ Restore verified successfully${NC}"
else
    echo -e "${RED}⚠ Warning: No tables found. Restore may have failed.${NC}"
fi

echo -e "\n${GREEN}=== Restore Complete ===${NC}"

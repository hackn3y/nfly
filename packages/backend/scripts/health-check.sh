#!/bin/bash

# Health Check Script
# Monitors all services and sends alerts if something is down
# Usage: ./scripts/health-check.sh [--slack-webhook <url>]

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4100}"
ML_SERVICE_URL="${ML_SERVICE_URL:-http://localhost:5000}"
TIMEOUT=5

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
SLACK_WEBHOOK=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${GREEN}=== NFL Predictor Health Check ===${NC}"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local response
    local status

    echo -n "Checking $name... "

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    status=$(echo "$response" | tail -n 1)

    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ UP${NC}"
        return 0
    else
        echo -e "${RED}✗ DOWN (HTTP $status)${NC}"
        return 1
    fi
}

# Function to send Slack notification
send_slack_alert() {
    local message=$1

    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"🚨 NFL Predictor Alert: $message\"}" \
            2>/dev/null
    fi
}

# Track failures
failures=0

# Check Backend
if ! check_service "Backend API" "$BACKEND_URL/health"; then
    failures=$((failures + 1))
    send_slack_alert "Backend API is DOWN"
fi

# Check ML Service
if ! check_service "ML Service" "$ML_SERVICE_URL/health"; then
    failures=$((failures + 1))
    send_slack_alert "ML Service is DOWN"
fi

# Check Database Connection (if backend is up)
if [ $failures -eq 0 ]; then
    echo -n "Checking Database... "
    db_status=$(curl -s "$BACKEND_URL/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

    if [ "$db_status" = "connected" ]; then
        echo -e "${GREEN}✓ UP${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        send_slack_alert "Database connection issue"
    fi
fi

# Check Redis Connection
if [ $failures -eq 0 ]; then
    echo -n "Checking Redis... "
    redis_status=$(curl -s "$BACKEND_URL/health" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)

    if [ "$redis_status" = "connected" ]; then
        echo -e "${GREEN}✓ UP${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        send_slack_alert "Redis connection issue"
    fi
fi

# Summary
echo ""
if [ $failures -eq 0 ]; then
    echo -e "${GREEN}=== All Services Healthy ===${NC}"
    exit 0
else
    echo -e "${RED}=== $failures Service(s) Down ===${NC}"
    exit 1
fi

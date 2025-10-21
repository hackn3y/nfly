#!/bin/bash

# Development Environment Setup Script
# Automates the setup process for new developers

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   NFL Predictor - Development Setup          ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
print_success "Node.js $(node --version)"

if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version)"

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.11+ from https://python.org"
    exit 1
fi
print_success "Python $(python3 --version)"

if ! command_exists psql; then
    print_error "PostgreSQL client not found. Please install PostgreSQL"
    exit 1
fi
print_success "PostgreSQL client"

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker from https://docker.com"
    exit 1
fi
print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Install dependencies
print_step "Installing Node.js dependencies..."
npm install
print_success "Root dependencies installed"

npm run install:backend
print_success "Backend dependencies installed"

npm run install:mobile
print_success "Mobile dependencies installed"

# Install Python dependencies
print_step "Installing Python dependencies..."
cd packages/ml-service
pip3 install -r requirements.txt
pip3 install pytest pytest-cov pytest-asyncio httpx
cd ../..
print_success "Python dependencies installed"

# Start Docker services
print_step "Starting Docker services (PostgreSQL, MongoDB, Redis)..."
npm run docker:up
sleep 5
print_success "Docker services started"

# Setup environment files
print_step "Setting up environment files..."

if [ ! -f "packages/backend/.env" ]; then
    echo "Creating backend .env file..."
    cat > packages/backend/.env << 'EOF'
# Development Environment Configuration
NODE_ENV=development
PORT=4100

# Database URLs
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://localhost:27017/nfl_predictor
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRE=7d

# ML Service
ML_SERVICE_URL=http://localhost:5000

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_test_premium
STRIPE_PRO_PRICE_ID=price_test_pro

# Email (optional for development)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# FROM_EMAIL=dev@nflpredictor.com
# FROM_NAME=NFL Predictor

# Frontend URL
FRONTEND_URL=http://localhost:8100,http://localhost:19006
APP_URL=http://localhost:4100

# Feature Flags
ENABLE_SCHEDULER=false
ENABLE_PREDICTION_CACHE=true

# Rate Limiting (relaxed for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
EOF
    print_success "Created packages/backend/.env"
else
    print_success "packages/backend/.env already exists"
fi

if [ ! -f "packages/ml-service/.env" ]; then
    echo "Creating ML service .env file..."
    cat > packages/ml-service/.env << 'EOF'
# ML Service Development Configuration
PORT=5000
DEBUG=true

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nfl_predictor
REDIS_URL=redis://localhost:6379/0

# Model Configuration
MODEL_VERSION=1.0.0
CONFIDENCE_THRESHOLD=0.65
EOF
    print_success "Created packages/ml-service/.env"
else
    print_success "packages/ml-service/.env already exists"
fi

# Run database migrations
print_step "Running database migrations..."
cd packages/backend
npm run migrate
cd ../..
print_success "Database migrations completed"

# Seed database (optional)
read -p "$(echo -e ${YELLOW}"Would you like to seed the database with NFL teams? (y/n): "${NC})" seed_db
if [ "$seed_db" = "y" ]; then
    cd packages/backend
    npm run seed || echo "Seeding failed (teams may already exist)"
    cd ../..
    print_success "Database seeded"
fi

# Run tests to verify setup
print_step "Running tests to verify setup..."
echo "Testing backend..."
cd packages/backend
npm test -- --testPathPattern="bankroll.controller" --no-coverage || print_error "Backend tests failed"
cd ../..

print_step "Setup complete!"

echo -e "\n${GREEN}╔═══════════════════════════════════════════════╗"
echo "║           Setup Complete! 🎉                  ║"
echo "╚═══════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update Stripe API keys in packages/backend/.env"
echo "2. Start the development servers:"
echo "   ${YELLOW}npm run dev:backend${NC}   - Backend API (port 4100)"
echo "   ${YELLOW}npm run dev:ml${NC}        - ML Service (port 5000)"
echo "   ${YELLOW}npm run dev:mobile${NC}    - Mobile App (port 8100)"
echo ""
echo "3. Access the services:"
echo "   Backend:    http://localhost:4100/health"
echo "   ML Service: http://localhost:5000/health"
echo "   Mobile App: http://localhost:8100"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "   ${YELLOW}npm run docker:down${NC}   - Stop Docker services"
echo "   ${YELLOW}npm run docker:up${NC}     - Start Docker services"
echo "   ${YELLOW}npm test${NC}              - Run all tests"
echo "   ${YELLOW}npm run lint${NC}          - Run linters"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "   README.md              - Project overview"
echo "   CLAUDE.md              - Development guide"
echo "   TESTING.md             - Testing guide"
echo "   PERFORMANCE.md         - Performance guide"
echo "   DEPLOYMENT.md          - Deployment guide"
echo ""
echo "Happy coding! 🚀"

#!/bin/bash

# VibeConnect Deployment Preparation Script
# This script helps automate deployment preparation tasks

set -e  # Exit on error

echo "🚀 VibeConnect Deployment Preparation"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "Select deployment preparation tasks:"
echo ""
echo "1) Generate JWT Secret"
echo "2) Check Database Migration Files"
echo "3) Prepare Smart Contract Deployment"
echo "4) Verify Backend Dependencies"
echo "5) Verify Frontend Dependencies"
echo "6) Run All Checks"
echo "7) Exit"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        print_status "Generating JWT Secret..."
        cd backend
        if [ -f "scripts/generate_jwt_secret.py" ]; then
            python scripts/generate_jwt_secret.py
            print_success "JWT Secret generated!"
            echo ""
            print_warning "⚠️  IMPORTANT: Copy the SECRET_KEY above and add it to Railway:"
            echo "   1. Go to Railway dashboard"
            echo "   2. Select your backend service"
            echo "   3. Click 'Variables' tab"
            echo "   4. Add: SECRET_KEY=<generated-value>"
            echo "   5. Railway will auto-redeploy"
        else
            print_error "Generate script not found"
        fi
        cd ..
        ;;

    2)
        print_status "Checking database migration files..."
        echo ""

        if [ -f "backend/migrations/002_add_expired_status.sql" ]; then
            print_success "Migration 002_add_expired_status.sql found"
        else
            print_warning "Migration 002_add_expired_status.sql NOT found"
        fi

        if [ -f "backend/migrations/003_add_device_token.sql" ]; then
            print_success "Migration 003_add_device_token.sql found"
        else
            print_warning "Migration 003_add_device_token.sql NOT found"
        fi

        if [ -f "backend/migrations/003_add_profile_picture.sql" ]; then
            print_success "Migration 003_add_profile_picture.sql found"
        else
            print_warning "Migration 003_add_profile_picture.sql NOT found"
        fi

        echo ""
        print_warning "⚠️  Remember to run these migrations on Railway PostgreSQL:"
        echo "   Option A: Railway Dashboard → Database → Query → Paste SQL → Execute"
        echo "   Option B: railway run psql \$DATABASE_URL < backend/migrations/<file>.sql"
        ;;

    3)
        print_status "Preparing smart contract deployment..."
        cd contracts

        # Check if .env exists
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                print_warning ".env not found, creating from .env.example..."
                cp .env.example .env
                print_success ".env created"
                print_warning "⚠️  Please edit contracts/.env and add:"
                echo "   - PRIVATE_KEY (deployment wallet)"
                echo "   - BASE_SEPOLIA_RPC_URL (https://sepolia.base.org)"
            else
                print_error ".env.example not found"
            fi
        else
            print_success ".env file exists"
        fi

        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            print_warning "Installing contract dependencies..."
            npm install
            print_success "Dependencies installed"
        else
            print_success "Dependencies already installed"
        fi

        echo ""
        print_warning "⚠️  Before deploying contracts:"
        echo "   1. Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-sepolia-faucet"
        echo "   2. Add your wallet's private key to contracts/.env"
        echo "   3. Run: npx hardhat run scripts/deploy.js --network baseSepolia"
        echo ""
        print_status "Contract deployment command:"
        echo "   cd contracts && npx hardhat run scripts/deploy.js --network baseSepolia"

        cd ..
        ;;

    4)
        print_status "Verifying backend dependencies..."
        cd backend

        if [ -f "requirements.txt" ]; then
            print_success "requirements.txt found"
            echo ""
            echo "Key dependencies:"
            grep -E "fastapi|uvicorn|redis|firebase-admin|pillow" requirements.txt || echo "  (checking...)"
        else
            print_error "requirements.txt not found"
        fi

        if [ -f "main.py" ]; then
            print_success "main.py found"
        else
            print_error "main.py not found"
        fi

        if [ -f "app/services/session_service.py" ]; then
            print_success "Redis session service implemented"
        else
            print_warning "Redis session service not found"
        fi

        if [ -f "app/services/notification_service.py" ]; then
            print_success "Firebase notification service implemented"
        else
            print_warning "Firebase notification service not found"
        fi

        cd ..
        ;;

    5)
        print_status "Verifying frontend dependencies..."
        cd frontend

        if [ -f "package.json" ]; then
            print_success "package.json found"

            # Check for key dependencies
            if grep -q "next" package.json; then
                print_success "Next.js configured"
            fi

            if grep -q "wagmi" package.json; then
                print_success "Wagmi (wallet) configured"
            fi

            if grep -q "mapbox-gl" package.json; then
                print_success "Mapbox configured"
            else
                print_warning "Mapbox not installed (optional)"
            fi
        else
            print_error "package.json not found"
        fi

        if [ -f ".env.local.example" ]; then
            print_success ".env.local.example found"

            if [ ! -f ".env.local" ]; then
                print_warning ".env.local not found, create it for local development"
            else
                print_success ".env.local exists"
            fi
        fi

        cd ..
        ;;

    6)
        print_status "Running all deployment checks..."
        echo ""

        # Check 1: JWT Secret Script
        print_status "Checking JWT secret generation..."
        if [ -f "backend/scripts/generate_jwt_secret.py" ]; then
            print_success "JWT generation script ready"
        else
            print_error "JWT generation script missing"
        fi

        # Check 2: Database Migrations
        print_status "Checking database migrations..."
        migration_count=0
        [ -f "backend/migrations/002_add_expired_status.sql" ] && ((migration_count++))
        [ -f "backend/migrations/003_add_device_token.sql" ] && ((migration_count++))
        [ -f "backend/migrations/003_add_profile_picture.sql" ] && ((migration_count++))
        print_success "$migration_count/3 migration files found"

        # Check 3: Smart Contracts
        print_status "Checking smart contracts..."
        if [ -f "contracts/hardhat.config.js" ]; then
            print_success "Hardhat config found"
        else
            print_error "Hardhat config missing"
        fi

        if [ -d "contracts/contracts" ]; then
            contract_count=$(find contracts/contracts -name "*.sol" | wc -l)
            print_success "$contract_count Solidity contracts found"
        else
            print_error "Contracts directory missing"
        fi

        # Check 4: Backend Services
        print_status "Checking backend services..."
        [ -f "backend/app/services/session_service.py" ] && print_success "Redis session service ✓" || print_warning "Redis session service missing"
        [ -f "backend/app/services/notification_service.py" ] && print_success "Firebase notification service ✓" || print_warning "Firebase notification service missing"
        [ -f "backend/app/services/ipfs_service.py" ] && print_success "IPFS service ✓" || print_warning "IPFS service missing"

        # Check 5: Frontend
        print_status "Checking frontend..."
        [ -f "frontend/package.json" ] && print_success "Frontend package.json ✓" || print_error "Frontend package.json missing"
        [ -f "frontend/app/page.tsx" ] && print_success "Frontend app structure ✓" || print_error "Frontend app structure missing"

        # Check 6: Documentation
        print_status "Checking documentation..."
        [ -f "DEPLOYMENT_PREPARATION.md" ] && print_success "Deployment guide ✓" || print_warning "Deployment guide missing"
        [ -f "backend/docs/JWT_SETUP.md" ] && print_success "JWT setup docs ✓" || print_warning "JWT setup docs missing"
        [ -f "contracts/DEPLOYMENT_CHECKLIST.md" ] && print_success "Contract deployment docs ✓" || print_warning "Contract deployment docs missing"

        echo ""
        print_success "All checks complete!"
        echo ""
        print_warning "📋 Next Steps:"
        echo "   1. Generate JWT secret and add to Railway"
        echo "   2. Deploy Redis on Railway"
        echo "   3. Run database migrations on Railway PostgreSQL"
        echo "   4. Get Base Sepolia ETH and deploy contracts"
        echo "   5. Deploy frontend to Vercel"
        echo ""
        echo "   See DEPLOYMENT_PREPARATION.md for detailed instructions"
        ;;

    7)
        print_status "Exiting..."
        exit 0
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Done!"

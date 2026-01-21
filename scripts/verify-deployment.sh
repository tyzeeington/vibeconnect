#!/bin/bash

# VibeConnect Deployment Verification Script
# Run this after deployment to verify everything works

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# Configuration
BACKEND_URL="${BACKEND_URL:-https://vibeconnect-production.up.railway.app}"
FRONTEND_URL="${FRONTEND_URL:-}"

echo "🔍 VibeConnect Deployment Verification"
echo "======================================="
echo ""
echo "Backend URL: $BACKEND_URL"
[ -n "$FRONTEND_URL" ] && echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name=$1
    local test_command=$2

    print_status "Testing: $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        print_success "$test_name"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    print_error "curl is not installed. Please install it first."
    exit 1
fi

echo "🔧 Backend Health Checks"
echo "------------------------"

# Test 1: Backend Health Endpoint
if curl -sf "$BACKEND_URL/health" > /dev/null; then
    print_success "Backend health endpoint responding"
    ((TESTS_PASSED++))
else
    print_error "Backend health endpoint not responding"
    ((TESTS_FAILED++))
fi

# Test 2: Backend API Docs
if curl -sf "$BACKEND_URL/docs" > /dev/null; then
    print_success "API documentation accessible"
    ((TESTS_PASSED++))
else
    print_warning "API documentation not accessible (may be disabled in production)"
fi

# Test 3: CORS Headers
CORS_TEST=$(curl -sf -X OPTIONS "$BACKEND_URL/api/events/" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    -I 2>/dev/null | grep -i "access-control-allow-origin" || true)

if [ -n "$CORS_TEST" ]; then
    print_success "CORS headers configured"
    ((TESTS_PASSED++))
else
    print_warning "CORS headers not detected"
fi

# Test 4: Database Connection (via events endpoint)
if curl -sf "$BACKEND_URL/api/events/" > /dev/null; then
    print_success "Database connection working (events endpoint)"
    ((TESTS_PASSED++))
else
    print_error "Database connection failed"
    ((TESTS_FAILED++))
fi

# Test 5: Check if Redis is configured
# (We can't directly test Redis, but session endpoints would fail without it)
print_warning "Redis connection cannot be tested without authentication"

echo ""
echo "🔗 Smart Contract Verification"
echo "------------------------------"

# Check if contract addresses are set
if curl -sf "$BACKEND_URL/health" | grep -q "healthy" 2>/dev/null; then
    print_status "Checking environment variables..."

    # These would need to be checked via Railway dashboard
    print_warning "⚠️  Manually verify on Railway:"
    echo "   - PROFILE_NFT_CONTRACT"
    echo "   - CONNECTION_NFT_CONTRACT"
    echo "   - PESOBYTES_CONTRACT"
    echo "   - BASE_RPC_URL"
else
    print_warning "Cannot check contract configuration"
fi

echo ""
echo "🌐 Frontend Checks"
echo "------------------"

if [ -n "$FRONTEND_URL" ]; then
    if curl -sf "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend accessible"
        ((TESTS_PASSED++))

        # Check if frontend can load static assets
        if curl -sf "$FRONTEND_URL/_next/static/" > /dev/null 2>&1; then
            print_success "Frontend static assets loading"
            ((TESTS_PASSED++))
        else
            print_warning "Frontend static assets check inconclusive"
        fi
    else
        print_error "Frontend not accessible"
        ((TESTS_FAILED++))
    fi
else
    print_warning "Frontend URL not provided, skipping frontend checks"
    echo "   Set FRONTEND_URL environment variable to test frontend"
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo ""
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! ✨"
    echo ""
    echo "🎉 Deployment verification successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test wallet connection on frontend"
    echo "2. Create a test profile"
    echo "3. Check into a test event"
    echo "4. Verify NFT minting on BaseScan"
    echo ""
    exit 0
else
    print_warning "Some tests failed. Please review the errors above."
    echo ""
    echo "Common issues:"
    echo "- Backend: Check Railway logs and environment variables"
    echo "- Database: Verify PostgreSQL is connected and migrations ran"
    echo "- Frontend: Check Vercel deployment logs and env vars"
    echo "- Contracts: Verify deployment and addresses in Railway"
    echo ""
    exit 1
fi

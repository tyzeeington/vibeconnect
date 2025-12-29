#!/bin/bash

# VibeConnect Development Setup Script
# This script safely sets up your development environment

set -e

echo "🚀 VibeConnect Development Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Check if secrets are already encrypted
if [ -f ".encrypted/secrets.json" ]; then
    echo "✅ Encrypted secrets found!"
    echo ""
    echo "Choose an option:"
    echo "  1) Decrypt existing secrets and generate .env files"
    echo "  2) Re-configure all secrets (will overwrite)"
    echo "  3) Skip secret setup"
    read -p "Enter choice (1-3): " choice

    case $choice in
        1)
            node scripts/encrypt-secrets.js decrypt
            ;;
        2)
            node scripts/encrypt-secrets.js setup
            ;;
        3)
            echo "Skipping secret setup..."
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac
else
    echo "📝 No encrypted secrets found. Let's set them up!"
    echo ""
    echo "You'll be prompted for:"
    echo "  • OpenAI API Key"
    echo "  • Database URL"
    echo "  • Alchemy Base RPC URL"
    echo "  • Deployment Wallet Private Key (optional)"
    echo "  • Basescan API Key (optional)"
    echo "  • WalletConnect Project ID"
    echo ""
    read -p "Ready to proceed? (yes/no): " ready

    if [ "$ready" != "yes" ] && [ "$ready" != "y" ]; then
        echo "Setup cancelled. Run this script again when ready."
        exit 0
    fi

    node scripts/encrypt-secrets.js setup
fi

echo ""
echo "=================================="
echo "✅ Secret management configured!"
echo ""
echo "Next steps:"
echo ""
echo "1. Start PostgreSQL (if not running):"
echo "   brew services start postgresql@15"
echo ""
echo "2. Start the backend:"
echo "   cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "3. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Visit http://localhost:3000"
echo ""
echo "💡 To update secrets later, run:"
echo "   node scripts/encrypt-secrets.js setup"
echo ""
echo "📖 Read SECURITY.md for more information"

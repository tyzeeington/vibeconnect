#!/bin/bash

echo "🎵 VibeConnect - Quick Start Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install from https://python.org"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Install from https://postgresql.org"
    echo "   Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup backend
echo "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup .env
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys before running!"
fi

cd ..

# Setup contracts
echo ""
echo "Setting up smart contracts..."
cd contracts

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Setup .env
if [ ! -f ".env" ]; then
    echo "Creating contracts .env file..."
    cp ../.env.example .env
    echo "⚠️  Please edit contracts/.env with your deployment keys!"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create PostgreSQL database: createdb vibeconnect"
echo "2. Edit backend/.env with your:"
echo "   - DATABASE_URL"
echo "   - OPENAI_API_KEY"
echo "   - POLYGON_RPC_URL (from Alchemy/Infura)"
echo "3. Edit contracts/.env with your:"
echo "   - PRIVATE_KEY (deployment wallet)"
echo "   - POLYGON_RPC_URL"
echo "4. Start the backend: cd backend && python main.py"
echo "5. Deploy contracts: cd contracts && npm run deploy:mumbai"
echo ""
echo "📖 Full guide: README.md and DEPLOYMENT.md"
echo "🚀 Let's build something amazing!"

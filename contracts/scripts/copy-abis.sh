#!/bin/bash

# VibeConnect - Copy Contract ABIs to Backend
# This script copies compiled contract ABIs to the backend service

set -e  # Exit on error

echo "📦 Copying Contract ABIs to Backend..."
echo ""

# Define paths
CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$CONTRACTS_DIR/../backend"
ARTIFACTS_DIR="$CONTRACTS_DIR/artifacts/contracts"
ABIS_DIR="$BACKEND_DIR/app/abis"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Check if artifacts exist
if [ ! -d "$ARTIFACTS_DIR" ]; then
    echo "❌ Error: Artifacts directory not found. Did you run 'npm run compile'?"
    exit 1
fi

# Create abis directory if it doesn't exist
mkdir -p "$ABIS_DIR"

# Copy ProfileNFT ABI
if [ -f "$ARTIFACTS_DIR/ProfileNFT.sol/ProfileNFT.json" ]; then
    cp "$ARTIFACTS_DIR/ProfileNFT.sol/ProfileNFT.json" "$ABIS_DIR/"
    echo "✅ Copied ProfileNFT.json"
else
    echo "⚠️  ProfileNFT.json not found (skipping)"
fi

# Copy ConnectionNFT ABI
if [ -f "$ARTIFACTS_DIR/ConnectionNFT.sol/ConnectionNFT.json" ]; then
    cp "$ARTIFACTS_DIR/ConnectionNFT.sol/ConnectionNFT.json" "$ABIS_DIR/"
    echo "✅ Copied ConnectionNFT.json"
else
    echo "⚠️  ConnectionNFT.json not found (skipping)"
fi

# Copy PesoBytes ABI
if [ -f "$ARTIFACTS_DIR/PesoBytes.sol/PesoBytes.json" ]; then
    cp "$ARTIFACTS_DIR/PesoBytes.sol/PesoBytes.json" "$ABIS_DIR/"
    echo "✅ Copied PesoBytes.json"
else
    echo "⚠️  PesoBytes.json not found (skipping)"
fi

echo ""
echo "🎉 Done! ABIs copied to: $ABIS_DIR"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with contract addresses"
echo "2. Restart backend service to load new ABIs"

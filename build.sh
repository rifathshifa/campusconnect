#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== Starting CampusConnect Build ==="

# 1. Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# 2. Build Frontend
if [ -d "frontend" ]; then
  echo "Building React frontend with Vite..."
  npm --prefix frontend install
  npm --prefix frontend run build
  # Copy built assets to backend/dist for fail-safe serving
  mkdir -p backend/dist
  cp -r frontend/dist/* backend/dist/
fi

echo "=== Build Completed Successfully ==="

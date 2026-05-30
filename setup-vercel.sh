#!/bin/bash

# YishaiEdge - Quick Vercel Deployment Setup
# This script prepares your project for Vercel deployment

set -e

echo "🚀 YishaiEdge Vercel Deployment Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "📥 Installing Vercel CLI globally..."
    npm install -g vercel
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "Option 1 - Deploy with Vercel CLI:"
echo "  vercel --prod"
echo ""
echo "Option 2 - Push to GitHub and link in Vercel Dashboard:"
echo "  git init"
echo "  git add ."
echo "  git commit -m 'Initial commit: YishaiEdge'"
echo "  git branch -M main"
echo "  git remote add origin https://github.com/YOUR_USERNAME/yishaitrades.git"
echo "  git push -u origin main"
echo ""
echo "  Then go to vercel.com, click 'Add New', and select your repo."
echo ""
echo "Option 3 - Use GitHub Actions:"
echo "  1. Add VERCEL_TOKEN to GitHub Secrets:"
echo "     - Settings → Secrets and variables → Actions"
echo "     - New repository secret"
echo "     - Name: VERCEL_TOKEN"
echo "     - Value: <your-vercel-token>"
echo "  2. Push to GitHub and the workflow will auto-deploy"
echo ""
echo "📝 For detailed instructions, see VERCEL-DEPLOYMENT.md"
echo ""

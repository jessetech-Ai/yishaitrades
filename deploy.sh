#!/bin/bash
# ============================================================
# YishaiEdge — One-Click GitHub Deployment Script
# ============================================================
# Run this from your project folder to publish to GitHub.
# Prerequisites:
#   1. Git installed (https://git-scm.com/downloads)
#   2. An empty GitHub repo already created at:
#      https://github.com/new (name: yishaiedge, public, NO README)
#   3. Replace YOUR_USERNAME below with your GitHub username
# ============================================================

set -e

GITHUB_USERNAME="YOUR_USERNAME"
REPO_NAME="yishaiedge"

echo ""
echo "⚡ YishaiEdge GitHub Deployment"
echo "================================"
echo "Target: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# Verify git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Download from: https://git-scm.com/downloads"
    exit 1
fi

# Check we're in the right folder
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from your YishaiEdge project folder."
    exit 1
fi

# Check if username was updated
if [ "$GITHUB_USERNAME" = "YOUR_USERNAME" ]; then
    echo "❌ Edit this script and replace YOUR_USERNAME with your actual GitHub username."
    exit 1
fi

# Check if repo already initialized
if [ -d ".git" ]; then
    echo "⚠️  Git repository already initialized. Skipping git init."
else
    echo "📦 Initializing Git repository..."
    git init
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build to verify everything compiles
echo "🔨 Verifying build..."
npm run build > /dev/null 2>&1 || {
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
}
echo "✅ Build successful"

# Stage all files (respects .gitignore)
echo "📝 Staging files..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet 2>/dev/null && git log -1 > /dev/null 2>&1; then
    echo "ℹ️  No new changes to commit."
else
    echo "💾 Creating commit..."
    git commit -m "Deploy YishaiEdge trading journal" || true
fi

# Set branch name
git branch -M main

# Add remote (skip if already exists)
if git remote | grep -q "^origin$"; then
    echo "ℹ️  Remote 'origin' already exists."
else
    echo "🔗 Adding remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "   (When asked for password, use a Personal Access Token — NOT your GitHub password)"
echo "   Get one here: https://github.com/settings/tokens/new"
echo ""

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Push successful!"
    echo ""
    echo "🎉 Next steps:"
    echo "   1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
    echo "   2. Set 'Source' to 'GitHub Actions'"
    echo "   3. Wait ~2 minutes for deploy"
    echo "   4. Your site will be live at:"
    echo "      https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
    echo ""
else
    echo ""
    echo "❌ Push failed. Common fixes:"
    echo "   - Make sure the repo exists at https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "   - Make sure the repo is EMPTY (no README/gitignore)"
    echo "   - Use a Personal Access Token as your password"
    echo "   - Token needs 'repo' and 'workflow' scopes"
    exit 1
fi

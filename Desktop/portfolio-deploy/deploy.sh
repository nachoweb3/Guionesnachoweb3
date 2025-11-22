#!/bin/bash

echo "🚀 Starting Portfolio Deployment..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "📊 Build stats:"
    echo "   CSS: $(ls -lh dist/style.min.css | awk '{print $5}')"
    echo "   JS:  $(ls -lh dist/script.min.js | awk '{print $5}')"
    echo ""
    echo "✨ Your portfolio is now live!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
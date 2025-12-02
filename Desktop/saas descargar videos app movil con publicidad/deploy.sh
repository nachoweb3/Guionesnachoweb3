#!/bin/bash

# Deploy Script for GitHub Pages
# Video Editor SaaS for TikTok/Reels

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build the project
echo -e "${YELLOW}Building project for production...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Check if dist directory was created
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found after build!${NC}"
    exit 1
fi

# Deploy to GitHub Pages
echo -e "${YELLOW}Deploying to GitHub Pages...${NC}"
npm run deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${GREEN}📱 Your app is now available at: https://nachoweb3.github.io/saas-descargar-videos-app-movil-con-publicidad/${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}Trying with force flag...${NC}"
    npm run deploy-force

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 Force deployment successful!${NC}"
        echo -e "${GREEN}📱 Your app is now available at: https://nachoweb3.github.io/saas-descargar-videos-app-movil-con-publicidad/${NC}"
    else
        echo -e "${RED}❌ Force deployment also failed!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✨ Deployment complete!${NC}"

# Optional: Open the deployed site
if command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}Opening deployed site in browser...${NC}"
    xdg-open "https://nachoweb3.github.io/saas-descargar-videos-app-movil-con-publicidad/"
elif command -v open &> /dev/null; then
    echo -e "${YELLOW}Opening deployed site in browser...${NC}"
    open "https://nachoweb3.github.io/saas-descargar-videos-app-movil-con-publicidad/"
fi
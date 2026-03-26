#!/bin/bash

# EmoNav Deployment Script
echo "🚀 Deploying EmoNav to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler..."
    npm install -g wrangler
fi

# Check if authenticated
if ! wrangler auth token &> /dev/null; then
    echo "🔐 Please authenticate with Cloudflare:"
    wrangler auth login
fi

# Deploy
echo "✨ Deploying application..."
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your EmoNav app is now live!"
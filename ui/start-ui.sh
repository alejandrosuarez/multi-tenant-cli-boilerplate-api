#!/bin/bash

echo "🚀 Starting Multi-Tenant CLI UI..."

# Check if .env.local exists, if not create from example
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your API URL and token"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌐 Starting development server..."
npm run dev
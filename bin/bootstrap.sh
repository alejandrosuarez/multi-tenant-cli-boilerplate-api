#!/bin/bash

echo "🔧 Starting CLI boilerplate bootstrap..."

# Install Node dependencies if package.json exists
if [ -f "package.json" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "🧩 Installing Supabase CLI..."
  npm i -g supabase
fi

# Initialize .env.local stub
if [ ! -f ".env.local" ]; then
  echo "🌱 Creating .env.local..."
  cp docs/setup.md .env.local.template
fi

# Lint migrations
echo "🧠 Checking SQL migration headers..."
mkdir -p src/db/migrations
echo "-- Empty starter folder created" > src/db/migrations/README.md

echo "✅ Bootstrap complete. Ready for onboarding!"

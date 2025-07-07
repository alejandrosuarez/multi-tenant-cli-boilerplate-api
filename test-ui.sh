#!/bin/bash

echo "🚀 Starting Multi-Tenant CLI Test Environment"
echo "=============================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node src/index.js" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Start backend in development mode
echo "🔧 Starting backend server..."
cd /Users/alejandrosuarez/Dropbox/aspcorpo/testLab/agents/multi-tenant-cli-boilerplate/www
NODE_ENV=development node src/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start UI
echo "🎨 Starting UI development server..."
cd ui
npm run dev &
UI_PID=$!

echo ""
echo "🎉 Test environment ready!"
echo "================================"
echo "📡 Backend: http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "🔐 For OTP testing:"
echo "   - Enter any email address"
echo "   - Check backend console for OTP code"
echo "   - Use the logged OTP to verify"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $UI_PID 2>/dev/null; exit 0' INT
wait
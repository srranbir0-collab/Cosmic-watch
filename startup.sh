#!/bin/bash

# Cosmic Watch - Pterodactyl Startup Script

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌌 COSMIC WATCH - ORBITAL LAUNCHER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📌 Node.js: $(node -v)"
echo "📌 Mode:    Stateless (Database Disabled)"

# Pterodactyl Port Binding Strategy
# Pterodactyl passes the allocated port as SERVER_PORT.
# We must ensure our app listens on this specific port.
if [ ! -z "$SERVER_PORT" ]; then
    export PORT=$SERVER_PORT
    echo "📌 Binding to Allocated Port: $PORT"
else
    export PORT=3000
    echo "⚠️  SERVER_PORT variable not found. Defaulting to 3000."
    echo "    (If this container has a specific port allocation, the site may be unreachable)"
fi
echo ""

# 1. Structure Check
echo "🔍 Verifying project structure..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi
echo "✅ Structure valid"
echo ""

# 2. Dependency Installation
echo "📦 Installing dependencies..."
# Force install dev dependencies (needed for vite, tsc, types) even if NODE_ENV is production
if npm install --include=dev --quiet; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Standard install failed, retrying with legacy peer deps..."
    npm install --legacy-peer-deps --include=dev --quiet || echo "⚠️ Dependency install had issues"
fi
echo ""

# 3. Frontend Build
echo "🔨 Building frontend assets..."
export NODE_OPTIONS="--max-old-space-size=4096"
# Ensure we can run the build command
if npm run build; then
    echo "✅ Frontend built successfully"
else
    echo "⚠️  Frontend build failed. Serving stale or fallback assets."
fi
echo ""

# 4. Launch
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✨ LIFT OFF"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Port:        $PORT"
# Force production for the runtime to ensure frontend serving logic works
export NODE_ENV=production
echo "   Environment: $NODE_ENV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exec npm start
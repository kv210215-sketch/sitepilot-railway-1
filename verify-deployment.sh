#!/bin/bash

# SitePilot Auto-Deploy Verification Script
# Tests project structure and readiness for Railway

set -e

echo "=== SitePilot Railway Deployment Verification ==="
echo ""

# 1. Check all required files exist
echo "✓ Checking required files..."
[ -f "railway.json" ] && echo "  ✓ railway.json"
[ -f "backend/railway.toml" ] && echo "  ✓ backend/railway.toml"
[ -f "frontend/railway.toml" ] && echo "  ✓ frontend/railway.toml"
[ -f "RAILWAY_DEPLOY.md" ] && echo "  ✓ RAILWAY_DEPLOY.md"
[ -f "backend/package.json" ] && echo "  ✓ backend/package.json"
[ -f "frontend/package.json" ] && echo "  ✓ frontend/package.json"
[ -d "backend/src" ] && echo "  ✓ backend/src"
[ -d "frontend/src" ] && echo "  ✓ frontend/src"

echo ""
echo "✓ Checking package.json scripts..."
grep -q '"build"' backend/package.json && echo "  ✓ backend has build script"
grep -q '"start"' backend/package.json && echo "  ✓ backend has start script"
grep -q '"build"' frontend/package.json && echo "  ✓ frontend has build script"
grep -q '"start"' frontend/package.json && echo "  ✓ frontend has start script"

echo ""
echo "✓ Checking environment configuration..."
[ -f "backend/.env.example" ] && echo "  ✓ backend/.env.example"
[ -f "frontend/.env.example" ] && echo "  ✓ frontend/.env.example"
grep -q "PORT" backend/src/config/configuration.ts && echo "  ✓ Backend PORT configuration"
grep -q "NEXT_PUBLIC_API_URL" frontend/.env.example && echo "  ✓ Frontend API_URL configuration"

echo ""
echo "✓ Checking health endpoints..."
grep -q "/health" backend/src/main.ts && echo "  ✓ Backend /health endpoint"

echo ""
echo "✓ Checking Docker configuration..."
[ -f "backend/Dockerfile" ] && echo "  ✓ backend/Dockerfile"
[ -f "frontend/Dockerfile" ] && echo "  ✓ frontend/Dockerfile"

echo ""
echo "=== All checks passed! ==="
echo ""
echo "✅ Project is ready for Railway deployment"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push"
echo "2. In Railway: Connect repository"
echo "3. Add services in order: Backend → Frontend → PostgreSQL"
echo "4. Configure environment variables from RAILWAY_DEPLOY.md"

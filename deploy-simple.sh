#!/bin/bash

# Simple AWS Deployment Script for ft_transcendence (No Nginx)
echo "🚀 Deploying ft_transcendence to AWS (Simple Version)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Copy production environment
echo "📝 Setting up production environment..."
cp .env.production .env

# Build and start production containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.simple.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check health
echo "🏥 Checking service health..."

# Check backend
if curl -f http://localhost:3000/api/health 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

# Check frontend
if curl -f http://localhost:5173 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend check failed${NC}"
fi

# Show running containers
echo "📋 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}🎉 Simple deployment completed!${NC}"
echo ""
echo "⚠️  You need to open these ports in AWS Security Group:"
echo "   - Port 3000 (Backend API)"
echo "   - Port 5173 (Frontend)"
echo "   - Port 8086 (Database Admin) - optional"
echo ""
echo "📱 Once ports are open:"
echo "   Frontend: http://50.19.72.26:5173"
echo "   Backend API: http://50.19.72.26:3000"
echo "   Database Admin: http://50.19.72.26:8086"
echo ""
echo "📊 Monitor logs with: docker-compose -f docker-compose.simple.yml logs -f"
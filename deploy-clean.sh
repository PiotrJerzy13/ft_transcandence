#!/bin/bash

# Clean AWS Deployment Script for ft_transcendence
echo "🚀 Deploying ft_transcendence to AWS (Clean Version)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Copy production environment
echo "📝 Setting up production environment..."
cp .env.production .env

# Build and start production containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.clean.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 45

# Check health
echo "🏥 Checking service health..."

# Check backend
if curl -f http://localhost:3000/ 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is reachable${NC}"
else
    echo -e "${YELLOW}⚠ Backend not responding yet (may still be starting)${NC}"
fi

# Check frontend
if curl -f http://localhost:5173 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not responding yet (may still be starting)${NC}"
fi

# Show running containers
echo "📋 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show logs for debugging
echo ""
echo "📊 Recent logs:"
docker-compose -f docker-compose.clean.yml logs --tail=10

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "📱 Once fully started:"
echo "   Frontend: http://50.19.72.26:5173"
echo "   Backend API: http://50.19.72.26:3000"
echo "   Database Admin: http://50.19.72.26:8086"
echo ""
echo "📊 Monitor logs with: docker-compose -f docker-compose.clean.yml logs -f"
echo "🔍 Debug individual service: docker logs ft_backend"
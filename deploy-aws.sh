#!/bin/bash

# AWS Deployment Script for ft_transcendence
echo "🚀 Deploying ft_transcendence to AWS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on AWS (basic check)
if [[ $(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null) ]]; then
    echo -e "${GREEN}✓ Running on AWS EC2${NC}"
    AWS_MODE=true
else
    echo -e "${YELLOW}⚠ Not detected as AWS EC2, proceeding anyway...${NC}"
    AWS_MODE=false
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Copy production environment
echo "📝 Setting up production environment..."
cp .env.production .env

# Build and start production containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

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
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo "📱 Application: http://50.19.72.26"
echo "🔧 Backend API: http://50.19.72.26/api"
echo "🗄️ Database Admin: http://50.19.72.26:8086 (if opened port 8086)"
echo ""
echo "📊 Monitor logs with: docker-compose -f docker-compose.prod.yml logs -f"
#!/bin/bash

# Docker-compatible test script for Advanced Bracket System
# This script tests the bracket system using Docker containers

echo "🧪 Testing Advanced Bracket System with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check if Docker containers are running
echo "1. Checking Docker containers..."
if ! docker-compose ps | grep -q "ft_backend.*Up"; then
    print_error "Backend container is not running. Starting containers..."
    make up
    sleep 10
fi

print_status "Docker containers are running"

# Step 2: Wait for backend to be healthy
echo "2. Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/ping > /dev/null 2>&1; then
        print_status "Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start within 30 seconds"
        exit 1
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 1
done

# Step 3: Run migration inside container
echo "3. Running database migration..."
if docker exec ft_backend npm run db:migrate; then
    print_status "Migration completed successfully"
else
    print_error "Migration failed"
    exit 1
fi

# Step 4: Test bracket functions inside container
echo "4. Testing bracket functions..."
if docker exec ft_backend node test_bracket_functions.js; then
    print_status "Bracket functions test passed"
else
    print_error "Bracket functions test failed"
    exit 1
fi

# Step 5: Test API endpoints
echo "5. Testing API endpoints..."
if node backend/test_bracket_system.js; then
    print_status "API endpoints test passed"
else
    print_error "API endpoints test failed"
    exit 1
fi

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Test Summary:"
echo "   ✅ Docker containers running"
echo "   ✅ Database migration applied"
echo "   ✅ Bracket functions working"
echo "   ✅ API endpoints responding"
echo ""
echo "🚀 The advanced bracket system is ready!"
echo "   You can now create tournaments with:"
echo "   - Single elimination brackets"
echo "   - Double elimination brackets"
echo "   - Swiss system brackets"
echo "   - Different seeding methods"






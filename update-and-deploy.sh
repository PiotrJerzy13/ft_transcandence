#!/bin/bash

# Update and redeploy on AWS EC2
echo "Connecting to AWS EC2 and updating deployment..."

ssh -i ~/.ssh/id_rsa ec2-user@50.19.72.26 << 'EOF'
    cd ft_transcandence
    
    echo "Pulling latest changes..."
    git pull origin main
    
    echo "Rebuilding frontend with new config..."
    docker-compose -f docker-compose.clean.yml build frontend --no-cache
    
    echo "Restarting frontend container..."
    docker-compose -f docker-compose.clean.yml up -d frontend
    
    echo "Checking container status..."
    docker-compose -f docker-compose.clean.yml ps
    
    echo "Checking frontend logs..."
    docker-compose -f docker-compose.clean.yml logs frontend --tail 10
EOF

echo "Deployment update complete!"
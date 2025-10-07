# AWS EC2 User Data Script for ft_transcendence
#!/bin/bash
yum update -y
yum install -y docker git

# Start Docker
service docker start
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone and start your application
cd /home/ec2-user
git clone https://github.com/PiotrJerzy13/ft_transcandence.git
cd ft_transcandence

# Create production environment file
cat > .env << EOL
NODE_ENV=production
ENABLE_HTTPS=false
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long-and-random-production
# Add other production environment variables
EOL

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Setup log rotation and basic monitoring
echo "0 2 * * * docker system prune -f" | crontab -
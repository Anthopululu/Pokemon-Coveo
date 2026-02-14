#!/bin/bash
# Deploy script for AWS EC2
# Usage: ssh into EC2, then run this script
set -e

echo "=== Pokemon Coveo Challenge - EC2 Deploy ==="

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Clone or pull repo
APP_DIR="/home/ubuntu/pokemon-coveo-challenge"
if [ -d "$APP_DIR" ]; then
    echo "Pulling latest changes..."
    cd "$APP_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/Anthopululu/Pokemon-Challenge.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Create .env.local if it doesn't exist
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo "WARNING: .env.local not found. Create it with your Coveo credentials."
    echo "cp .env.local.example .env.local && nano .env.local"
fi

# Install dependencies and build
echo "Installing dependencies..."
npm ci --production=false

echo "Building..."
npm run build

# Setup Nginx
echo "Configuring Nginx..."
sudo cp nginx/pokemon-coveo.conf /etc/nginx/sites-available/pokemon-coveo
sudo ln -sf /etc/nginx/sites-available/pokemon-coveo /etc/nginx/sites-enabled/pokemon-coveo
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Start/Restart with PM2
echo "Starting application with PM2..."
pm2 stop pokemon-coveo 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
echo ""
echo "=== Deployment complete! ==="
echo "App running at http://${PUBLIC_IP}"

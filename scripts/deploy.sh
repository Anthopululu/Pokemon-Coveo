#\!/bin/bash
# Deploy script for AWS EC2 (Amazon Linux 2023)
set -e

echo "=== Pokemon Coveo Challenge - EC2 Deploy ==="

# Install Node.js if not present
if \! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 globally
if \! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx if not present
if \! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo yum install -y nginx
    sudo systemctl enable nginx
fi

APP_DIR="/home/ec2-user/pokemon-coveo-challenge"

if [ \! -f "$APP_DIR/.env.local" ]; then
    echo "WARNING: .env.local not found. Create it with your Coveo credentials."
    exit 1
fi

cd "$APP_DIR"

echo "Installing dependencies..."
npm ci --production=false

echo "Building..."
npm run build

# Setup Nginx
echo "Configuring Nginx..."
sudo cp nginx/pokemon-coveo.conf /etc/nginx/conf.d/pokemon-coveo.conf
sudo nginx -t && sudo systemctl reload nginx

# Start/Restart with PM2
echo "Starting application with PM2..."
pm2 stop pokemon-coveo 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
echo ""
echo "=== Deployment complete\! ==="
echo "App running at http://${PUBLIC_IP}"

#!/bin/bash
set -e

APP_DIR="/var/www/attengore"
NGINX_CONF="/etc/nginx/sites-available/attengore"

echo "=============================="
echo "  Clowi VPS Setup Script"
echo "=============================="

# 1. Install Node.js if missing
if ! command -v node &>/dev/null; then
  echo "[1/7] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[1/7] Node.js already installed: $(node -v)"
fi

# 2. Install PM2 if missing
if ! command -v pm2 &>/dev/null; then
  echo "[2/7] Installing PM2..."
  npm install -g pm2
else
  echo "[2/7] PM2 already installed"
fi

# 3. Install Nginx if missing
if ! command -v nginx &>/dev/null; then
  echo "[3/7] Installing Nginx..."
  apt-get update && apt-get install -y nginx
else
  echo "[3/7] Nginx already installed"
fi

# 4. Create app directories
echo "[4/7] Setting up directories..."
mkdir -p "$APP_DIR/dist"
mkdir -p "$APP_DIR/server"

# 5. Install backend dependencies
echo "[5/7] Installing backend dependencies..."
cd "$APP_DIR/server"
npm install --production

# 6. Write Nginx config
echo "[6/7] Configuring Nginx..."
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;

    location /clowi/ {
        alias /var/www/attengore/dist/;
        try_files $uri $uri/ /clowi/index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/attengore
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "     Nginx configured and reloaded."

# 7. Open firewall & start backend
echo "[7/7] Firewall + starting backend..."
ufw allow 80 2>/dev/null || true
ufw allow ssh 2>/dev/null || true

pm2 delete clowi-backend 2>/dev/null || true
cd "$APP_DIR/server"
pm2 start server.js --name clowi-backend
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "=============================="
echo "  Setup Complete!"
echo "  Visit: http://$(curl -s ifconfig.me)/clowi/"
echo "=============================="

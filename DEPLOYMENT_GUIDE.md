# NFL Predictor - Deployment Guide

Complete guide for deploying the NFL Predictor application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [ML Service Deployment](#ml-service-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Domain & SSL Setup](#domain--ssl-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- **PostgreSQL 15+** - Main database
- **MongoDB 7+** - Gematria calculations storage
- **Redis 7+** - Caching layer
- **Docker** - For containerized deployment (recommended)
- **Node.js 18+** - Backend runtime
- **Python 3.10+** - ML service runtime

### Required Accounts
- **Stripe Account** - For subscription payments
- **Email Service** (SendGrid/AWS SES) - For transactional emails
- **Domain Name** - For production deployment
- **SSL Certificate** - Let's Encrypt recommended

---

## Environment Setup

### 1. Backend Environment Variables

Create `packages/backend/.env`:

```bash
# Server Configuration
NODE_ENV=production
PORT=4100
FRONTEND_URL=https://yourapp.com

# Database URLs
DATABASE_URL=postgresql://user:password@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://localhost:27017/nfl_predictor
REDIS_URL=redis://localhost:6379

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_PRO=price_...

# ML Service
ML_SERVICE_URL=http://localhost:5000

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourapp.com

# Features
ENABLE_SCHEDULER=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. ML Service Environment Variables

Create `packages/ml-service/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nfl_predictor
REDIS_URL=redis://localhost:6379

# ML Configuration
MODEL_PATH=/app/models
DEBUG=false
WORKERS=4
```

### 3. Mobile App Configuration

Update `packages/mobile/src/services/api.js`:

```javascript
const API_URL = __DEV__
  ? 'http://localhost:4100/api'
  : 'https://api.yourapp.com/api';
```

---

## Database Setup

### 1. PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE nfl_predictor;
CREATE USER nfl_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE nfl_predictor TO nfl_user;
\q

# Run migrations
cd packages/backend
npm run migrate
```

### 2. MongoDB Setup

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### 4. Seed Initial Data

```bash
cd packages/backend
node src/scripts/seed-simple.js
```

---

## Backend Deployment

### Option 1: Docker Deployment (Recommended)

```bash
# Build Docker image
cd packages/backend
docker build -t nfl-predictor-backend .

# Run container
docker run -d \
  --name nfl-backend \
  -p 4100:4100 \
  --env-file .env \
  --restart unless-stopped \
  nfl-predictor-backend
```

### Option 2: PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start backend with PM2
cd packages/backend
pm2 start src/server.js --name nfl-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 3: Systemd Service

Create `/etc/systemd/system/nfl-backend.service`:

```ini
[Unit]
Description=NFL Predictor Backend
After=network.target postgresql.service mongodb.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nfl-predictor/packages/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nfl-backend
sudo systemctl start nfl-backend
```

---

## ML Service Deployment

### Docker Deployment

```bash
# Build Docker image
cd packages/ml-service
docker build -t nfl-predictor-ml .

# Run container
docker run -d \
  --name nfl-ml-service \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  nfl-predictor-ml
```

### Using Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nfl_predictor
      POSTGRES_USER: nfl_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  backend:
    build: ./packages/backend
    ports:
      - "4100:4100"
    env_file:
      - ./packages/backend/.env
    depends_on:
      - postgres
      - mongodb
      - redis
    restart: unless-stopped

  ml-service:
    build: ./packages/ml-service
    ports:
      - "5000:5000"
    env_file:
      - ./packages/ml-service/.env
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  mongo_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Mobile App Deployment

### iOS Deployment

1. **Configure app.json**:
```json
{
  "expo": {
    "name": "NFL Predictor",
    "slug": "nfl-predictor",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.nflpredictor",
      "buildNumber": "1"
    }
  }
}
```

2. **Build for iOS**:
```bash
cd packages/mobile
eas build --platform ios
```

3. **Submit to App Store**:
```bash
eas submit --platform ios
```

### Android Deployment

1. **Configure app.json**:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.nflpredictor",
      "versionCode": 1
    }
  }
}
```

2. **Build for Android**:
```bash
cd packages/mobile
eas build --platform android
```

3. **Submit to Play Store**:
```bash
eas submit --platform android
```

### Web Deployment

```bash
cd packages/mobile
npm run build:web

# Deploy to hosting service (Vercel, Netlify, etc.)
# Example with Vercel:
vercel deploy --prod
```

---

## Domain & SSL Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/nfl-predictor`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ML Service (internal only, block external access)
server {
    listen 127.0.0.1:5000;
    server_name localhost;

    location / {
        proxy_pass http://localhost:5000;
    }
}

# Frontend (if hosting web version)
server {
    listen 80;
    server_name yourapp.com www.yourapp.com;
    root /var/www/nfl-predictor/packages/mobile/web-build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/nfl-predictor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d api.yourapp.com -d yourapp.com -d www.yourapp.com

# Auto-renewal (already configured by certbot)
sudo systemctl status certbot.timer
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs nfl-backend

# Monitor resources
pm2 monit

# Setup web dashboard
pm2 web
```

### Application Logging

Backend logs are stored in:
- `/var/log/nfl-predictor/backend.log`
- `/var/log/nfl-predictor/error.log`

View logs:
```bash
tail -f /var/log/nfl-predictor/backend.log
```

### Health Checks

Set up monitoring for:
- Backend: `https://api.yourapp.com/health`
- ML Service: `http://localhost:5000/health`

Use services like:
- **UptimeRobot** - Free uptime monitoring
- **Datadog** - Comprehensive monitoring
- **New Relic** - Application performance monitoring

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Configure firewall (ufw/iptables)
- [ ] Keep dependencies updated
- [ ] Enable database backups
- [ ] Configure Stripe webhooks with signature verification
- [ ] Restrict database access to localhost only
- [ ] Use environment variables for secrets
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits

---

## Backup Strategy

### Database Backups

```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/var/backups/nfl-predictor"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U nfl_user nfl_predictor | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "postgres_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-nfl-db.sh
```

### MongoDB Backups

```bash
mongodump --db nfl_predictor --out /var/backups/nfl-predictor/mongo_$(date +%Y%m%d)
```

---

## Troubleshooting

### Backend won't start

Check logs:
```bash
pm2 logs nfl-backend --err
journalctl -u nfl-backend -n 50
```

Common issues:
- Database connection failed → Check DATABASE_URL
- Port already in use → Check if another process is using port 4100
- Missing environment variables → Verify .env file

### ML Service errors

```bash
docker logs nfl-ml-service

# Check Python dependencies
docker exec -it nfl-ml-service pip list
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U nfl_user -d nfl_predictor -h localhost

# Test MongoDB connection
mongosh "mongodb://localhost:27017/nfl_predictor"

# Test Redis connection
redis-cli ping
```

### High memory usage

```bash
# Check container resources
docker stats

# Restart services
pm2 restart nfl-backend
docker restart nfl-ml-service
```

---

## Performance Optimization

1. **Enable Redis caching** - Already configured
2. **Use CDN for static assets** - CloudFlare recommended
3. **Enable gzip compression** - Configure in Nginx
4. **Database indexing** - Already configured in migrations
5. **Connection pooling** - Already configured (max 20 connections)
6. **Rate limiting** - Already configured (100 req/15min)

---

## Scaling

### Horizontal Scaling

1. **Load Balancer** - Use Nginx or HAProxy
2. **Multiple Backend Instances**:
```bash
pm2 start src/server.js -i max --name nfl-backend
```
3. **Database Read Replicas** - For high traffic
4. **Redis Cluster** - For distributed caching

### Vertical Scaling

Recommended specs for different traffic levels:

| Traffic Level | Backend | ML Service | Database |
|--------------|---------|------------|----------|
| Low (0-1K users) | 1 CPU, 2GB RAM | 2 CPU, 4GB RAM | 2 CPU, 4GB RAM |
| Medium (1K-10K) | 2 CPU, 4GB RAM | 4 CPU, 8GB RAM | 4 CPU, 8GB RAM |
| High (10K+) | 4+ CPU, 8GB+ RAM | 8+ CPU, 16GB+ RAM | 8+ CPU, 16GB+ RAM |

---

## Support & Maintenance

### Regular Maintenance Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review system resources
- **Monthly**: Update dependencies, review security
- **Quarterly**: Database optimization, backup testing

### Getting Help

- Documentation: https://docs.nflpredictor.com
- GitHub Issues: https://github.com/yourorg/nfl-predictor/issues
- Email Support: support@yourapp.com

---

## License

Copyright © 2025 NFL Predictor. All rights reserved.

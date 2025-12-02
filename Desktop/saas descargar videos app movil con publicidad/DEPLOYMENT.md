# 🚀 Deployment Guide

Complete guide for deploying the Video Editor application to production.

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] AWS S3 bucket created and configured
- [ ] Stripe account set up with live keys
- [ ] Domain name purchased and DNS configured
- [ ] SSL certificate obtained
- [ ] AdMob/AdSense account approved
- [ ] Database backups configured (if using)

## Production Environment Variables

### Backend (.env)
```env
# Change to production values
DEBUG=False
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Production AWS
AWS_ACCESS_KEY_ID=your_production_key
AWS_SECRET_ACCESS_KEY=your_production_secret
S3_BUCKET_NAME=your-production-bucket

# Production Stripe (live keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Strong secret key
SECRET_KEY=$(openssl rand -hex 32)
```

### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_ADSENSE_CLIENT_ID=ca-pub-your-actual-id
```

## Deployment Options

### Option 1: Docker on VPS (DigitalOcean, AWS EC2, etc.)

#### 1. Provision Server
```bash
# Create a server with:
# - 2GB+ RAM
# - 2+ CPU cores
# - 50GB+ SSD
# - Ubuntu 22.04 LTS
```

#### 2. Initial Server Setup
```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Create app user
adduser appuser
usermod -aG docker appuser
```

#### 3. Deploy Application
```bash
# Switch to app user
su - appuser

# Clone repository
git clone <your-repo-url>
cd "saas descargar videos app movil con publicidad"

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

#### 4. Configure Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/videoeditor
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/videoeditor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Heroku

#### Backend Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-backend-app

# Add buildpacks
heroku buildpacks:add --index 1 heroku/python
heroku buildpacks:add --index 2 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest

# Set environment variables
heroku config:set DEBUG=False
heroku config:set AWS_ACCESS_KEY_ID=xxx
heroku config:set AWS_SECRET_ACCESS_KEY=xxx
heroku config:set S3_BUCKET_NAME=xxx
heroku config:set STRIPE_SECRET_KEY=xxx
# ... all other variables

# Deploy
git subtree push --prefix backend heroku main

# Scale dynos
heroku ps:scale web=1 worker=1

# View logs
heroku logs --tail
```

#### Frontend Deployment (Vercel)
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Option 3: AWS (Complete Setup)

#### Backend on Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init

# Create environment
eb create production-env

# Configure environment variables
eb setenv DEBUG=False AWS_ACCESS_KEY_ID=xxx ...

# Deploy
eb deploy

# Open app
eb open
```

#### Frontend on S3 + CloudFront
```bash
cd frontend

# Build
npm run build

# Install AWS CLI
pip install awscli

# Create S3 bucket
aws s3 mb s3://your-frontend-bucket

# Configure as static website
aws s3 website s3://your-frontend-bucket --index-document index.html

# Upload build
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Create CloudFront distribution (do this in AWS Console)
# - Origin: your-frontend-bucket
# - Enable HTTPS
# - Custom domain name
```

## Post-Deployment

### 1. Configure DNS
```
A Record:    yourdomain.com        -> your-server-ip
A Record:    www.yourdomain.com    -> your-server-ip
A Record:    api.yourdomain.com    -> your-server-ip
```

### 2. Setup Monitoring

#### PM2 for Process Management (if not using Docker)
```bash
npm install -g pm2

# Start backend
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name backend

# Start frontend
cd frontend && pm2 start npm --name frontend -- start

# Save configuration
pm2 save
pm2 startup
```

#### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

### 3. Setup Backups

```bash
# Daily backup script
cat > /home/appuser/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/home/appuser/backups

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup videos (if stored locally)
tar -czf $BACKUP_DIR/videos-$DATE.tar.gz /tmp/videos

# Upload to S3
aws s3 cp $BACKUP_DIR/videos-$DATE.tar.gz s3://your-backup-bucket/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /home/appuser/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/appuser/backup.sh
```

### 4. Performance Optimization

#### Enable Gzip in Nginx
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

#### Setup Redis for Caching
```bash
# Already included in docker-compose
# Ensure Redis is persistent
docker-compose exec redis redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

#### CDN for Static Assets
- Use CloudFlare for free CDN
- Or AWS CloudFront
- Or Bunny CDN

### 5. Security Hardening

```bash
# Enable firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Regular updates
sudo apt update && sudo apt upgrade -y

# Setup automatic security updates
sudo apt install unattended-upgrades -y
```

## Continuous Deployment (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/appuser/your-app
          git pull origin main
          docker-compose down
          docker-compose up -d --build
```

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**
   - Check if services are running: `docker-compose ps`
   - Check logs: `docker-compose logs`

2. **CORS Errors**
   - Verify ALLOWED_ORIGINS in backend .env
   - Check Nginx proxy headers

3. **Payment Webhook Failures**
   - Verify webhook URL in Stripe dashboard
   - Check webhook secret is correct
   - Ensure HTTPS is enabled

4. **Video Upload Failures**
   - Check S3 bucket permissions
   - Verify AWS credentials
   - Check disk space: `df -h`

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3

  celery:
    deploy:
      replicas: 2
```

### Load Balancer (Nginx)
```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## Maintenance

```bash
# Update application
git pull origin main
docker-compose down
docker-compose up -d --build

# Clean old images
docker system prune -a

# Monitor disk usage
df -h
du -sh /tmp/videos/*

# Check logs
docker-compose logs --tail=100 -f
```

---

**Remember**: Always test in staging environment before deploying to production!

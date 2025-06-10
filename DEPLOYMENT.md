# Deployment Guide

## Star Wars RPG Character Manager - Production Deployment

This guide covers deploying the Star Wars RPG Character Manager to production environments. The application supports multiple deployment strategies and platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Traditional Server Deployment](#traditional-server-deployment)
- [Database Setup](#database-setup)
- [Security Configuration](#security-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB minimum, SSD recommended
- **Network**: Stable internet connection with HTTPS support

### Software Requirements

- **Python**: 3.13 or higher
- **MongoDB**: 4.4 or higher
- **Node.js**: 16+ (for frontend build tools)
- **nginx**: (recommended for reverse proxy)
- **SSL Certificate**: Required for production

### Domain and DNS

- Registered domain name
- DNS configured to point to your server
- SSL certificate (Let's Encrypt recommended)

## Environment Configuration

### Production Environment Variables

Create a production `.env` file:

```env
# Application Environment
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=your-super-secret-production-key

# Database Configuration
MONGODB_URI=mongodb://username:password@mongodb-host:27017/starwars_rpg
MONGODB_DB_NAME=starwars_rpg_prod

# Security Configuration
JWT_SECRET_KEY=your-super-secret-jwt-production-key
ENCRYPTION_KEY=your-32-byte-production-encryption-key
SESSION_SECRET=your-production-session-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
DISCORD_CLIENT_ID=your-production-discord-client-id
DISCORD_CLIENT_SECRET=your-production-discord-client-secret

# Email Configuration
SMTP_SERVER=your-production-smtp-server
SMTP_PORT=587
SMTP_USERNAME=your-production-email
SMTP_PASSWORD=your-production-email-password
SMTP_USE_TLS=true

# Application URLs
BASE_URL=https://your-domain.com
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# Security Headers
FORCE_HTTPS=true
SECURE_COOKIES=true
CSRF_PROTECTION=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Logging
LOG_FILE=/var/log/starwars-rpg/app.log
ERROR_LOG_FILE=/var/log/starwars-rpg/error.log

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_KEY=your-new-relic-key
```

### Security Best Practices

1. **Generate Strong Secrets**:
   ```bash
   # Generate random secrets
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **File Permissions**:
   ```bash
   chmod 600 .env
   chown app:app .env
   ```

3. **Environment Isolation**:
   - Use separate environments for staging and production
   - Never use development credentials in production
   - Regularly rotate secrets and API keys

## Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 app && chown -R app:app /app
USER app

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - APP_ENV=production
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./logs:/var/log/starwars-rpg
    restart: unless-stopped

  mongodb:
    image: mongo:5
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGODB_DB_NAME}
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    ports:
      - "27017:27017"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./static:/var/www/static
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### Docker Deployment Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Update application
docker-compose pull
docker-compose up -d --force-recreate

# Backup database
docker-compose exec mongodb mongodump --out /backup
```

## Cloud Platform Deployment

### AWS Deployment

#### Using AWS ECS

1. **Create ECR Repository**:
   ```bash
   aws ecr create-repository --repository-name starwars-rpg
   ```

2. **Build and Push Image**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
   docker build -t starwars-rpg .
   docker tag starwars-rpg:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/starwars-rpg:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/starwars-rpg:latest
   ```

3. **ECS Task Definition**:
   ```json
   {
     "family": "starwars-rpg",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "starwars-rpg",
         "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/starwars-rpg:latest",
         "portMappings": [
           {
             "containerPort": 5000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "APP_ENV",
             "value": "production"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/starwars-rpg",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

#### Using AWS Lambda (Serverless)

```python
# serverless_handler.py
import awsgi
from app import app

def lambda_handler(event, context):
    return awsgi.response(app, event, context)
```

### Google Cloud Platform

#### Using Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/starwars-rpg', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/starwars-rpg']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'starwars-rpg', '--image', 'gcr.io/$PROJECT_ID/starwars-rpg', '--platform', 'managed', '--region', 'us-central1']
```

### Heroku Deployment

```bash
# Install Heroku CLI
# Create Heroku app
heroku create starwars-rpg-prod

# Set environment variables
heroku config:set APP_ENV=production
heroku config:set MONGODB_URI=mongodb://...

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: starwars-rpg
services:
- name: web
  source_dir: /
  github:
    repo: yourusername/star-wars-rpg-character-manager
    branch: main
  run_command: gunicorn --bind 0.0.0.0:$PORT app:app
  environment_slug: python
  instance_count: 2
  instance_size_slug: basic-xxs
  envs:
  - key: APP_ENV
    value: production
    type: SECRET
databases:
- name: mongodb
  engine: MONGODB
  version: "5"
```

## Traditional Server Deployment

### Ubuntu/Debian Server Setup

1. **Update System**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Dependencies**:
   ```bash
   sudo apt install -y python3.13 python3.13-venv python3-pip nginx mongodb git
   ```

3. **Create Application User**:
   ```bash
   sudo useradd -m -s /bin/bash starwars-rpg
   sudo usermod -aG sudo starwars-rpg
   ```

4. **Deploy Application**:
   ```bash
   sudo -u starwars-rpg -i
   git clone https://github.com/yourusername/star-wars-rpg-character-manager.git
   cd star-wars-rpg-character-manager
   python3.13 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Configure Systemd Service**:
   ```ini
   # /etc/systemd/system/starwars-rpg.service
   [Unit]
   Description=Star Wars RPG Character Manager
   After=network.target

   [Service]
   Type=notify
   User=starwars-rpg
   Group=starwars-rpg
   RuntimeDirectory=starwars-rpg
   WorkingDirectory=/home/starwars-rpg/star-wars-rpg-character-manager
   Environment=PATH=/home/starwars-rpg/star-wars-rpg-character-manager/venv/bin
   EnvironmentFile=/home/starwars-rpg/star-wars-rpg-character-manager/.env
   ExecStart=/home/starwars-rpg/star-wars-rpg-character-manager/venv/bin/gunicorn --bind unix:/run/starwars-rpg/socket --workers 4 app:app
   ExecReload=/bin/kill -s HUP $MAINPID
   KillMode=mixed
   TimeoutStopSec=5
   PrivateTmp=true

   [Install]
   WantedBy=multi-user.target
   ```

6. **Configure Nginx**:
   ```nginx
   # /etc/nginx/sites-available/starwars-rpg
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://unix:/run/starwars-rpg/socket;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /static/ {
           alias /home/starwars-rpg/star-wars-rpg-character-manager/static/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

7. **Start Services**:
   ```bash
   sudo systemctl enable starwars-rpg
   sudo systemctl start starwars-rpg
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## Database Setup

### MongoDB Configuration

1. **Production MongoDB Configuration**:
   ```yaml
   # /etc/mongod.conf
   storage:
     dbPath: /var/lib/mongodb
     journal:
       enabled: true

   systemLog:
     destination: file
     logAppend: true
     path: /var/log/mongodb/mongod.log

   net:
     port: 27017
     bindIp: 127.0.0.1

   security:
     authorization: enabled

   replication:
     replSetName: "rs0"
   ```

2. **Initialize Replica Set**:
   ```javascript
   // In MongoDB shell
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27017" }
     ]
   })
   ```

3. **Create Database Users**:
   ```javascript
   // Create admin user
   use admin
   db.createUser({
     user: "admin",
     pwd: "secure_admin_password",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
   })

   // Create application user
   use starwars_rpg_prod
   db.createUser({
     user: "starwars_app",
     pwd: "secure_app_password",
     roles: [ { role: "readWrite", db: "starwars_rpg_prod" } ]
   })
   ```

### Database Migrations

```python
# migrations/001_initial_setup.py
from pymongo import MongoClient

def up(db):
    """Apply migration"""
    # Create indexes
    db.users.create_index("username", unique=True)
    db.users.create_index("email", unique=True)
    db.campaigns.create_index("name")
    db.characters.create_index([("player_id", 1), ("campaign_id", 1)])
    
    # Create initial admin user
    admin_user = {
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    db.users.insert_one(admin_user)

def down(db):
    """Rollback migration"""
    db.users.drop()
    db.campaigns.drop()
    db.characters.drop()
```

## Security Configuration

### SSL/TLS Setup

1. **Let's Encrypt SSL**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **SSL Configuration**:
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
   ssl_prefer_server_ciphers off;
   ssl_session_cache shared:SSL:10m;
   ssl_session_timeout 10m;
   ```

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoint**:
   ```python
   @app.route('/health')
   def health_check():
       return {
           'status': 'healthy',
           'timestamp': datetime.utcnow().isoformat(),
           'version': app.config['VERSION']
       }
   ```

2. **Prometheus Metrics**:
   ```python
   from prometheus_client import Counter, Histogram, generate_latest

   REQUEST_COUNT = Counter('app_requests_total', 'Total requests')
   REQUEST_DURATION = Histogram('app_request_duration_seconds', 'Request duration')

   @app.route('/metrics')
   def metrics():
       return generate_latest()
   ```

### Log Management

1. **Log Configuration**:
   ```python
   import logging
   from logging.handlers import RotatingFileHandler

   if not app.debug:
       file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
       file_handler.setFormatter(logging.Formatter(
           '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
       ))
       file_handler.setLevel(logging.INFO)
       app.logger.addHandler(file_handler)
   ```

2. **Centralized Logging (ELK Stack)**:
   ```yaml
   # docker-compose.logging.yml
   version: '3.8'
   services:
     elasticsearch:
       image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
       environment:
         - discovery.type=single-node
       volumes:
         - es_data:/usr/share/elasticsearch/data

     logstash:
       image: docker.elastic.co/logstash/logstash:7.15.0
       volumes:
         - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

     kibana:
       image: docker.elastic.co/kibana/kibana:7.15.0
       ports:
         - "5601:5601"
   ```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/starwars-rpg"
DB_NAME="starwars_rpg_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/mongodb_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://your-backup-bucket/
```

### Automated Backup

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Recovery Procedure

```bash
# Restore from backup
tar -xzf backup_20240101_020000.tar.gz
mongorestore --db starwars_rpg_prod mongodb_20240101_020000/starwars_rpg_prod
```

## Performance Optimization

### Application Performance

1. **Gunicorn Configuration**:
   ```python
   # gunicorn.conf.py
   bind = "0.0.0.0:5000"
   workers = 4
   worker_class = "gevent"
   worker_connections = 1000
   max_requests = 1000
   max_requests_jitter = 100
   timeout = 30
   keepalive = 5
   ```

2. **Caching Configuration**:
   ```python
   from flask_caching import Cache

   cache = Cache(app, config={
       'CACHE_TYPE': 'redis',
       'CACHE_REDIS_URL': 'redis://localhost:6379/0'
   })

   @cache.memoize(timeout=300)
   def get_species_list():
       return db.species.find().to_list()
   ```

### Database Performance

1. **MongoDB Indexes**:
   ```javascript
   // Create performance indexes
   db.characters.createIndex({ "player_id": 1, "campaign_id": 1 })
   db.campaigns.createIndex({ "gm_id": 1 })
   db.users.createIndex({ "last_login": -1 })
   ```

2. **Query Optimization**:
   ```python
   # Use aggregation pipeline for complex queries
   pipeline = [
       {"$match": {"campaign_id": ObjectId(campaign_id)}},
       {"$lookup": {
           "from": "users",
           "localField": "player_id",
           "foreignField": "_id",
           "as": "player"
       }},
       {"$project": {
           "name": 1,
           "species": 1,
           "level": 1,
           "player.username": 1
       }}
   ]
   characters = db.characters.aggregate(pipeline)
   ```

## Troubleshooting

### Common Issues

1. **Application Won't Start**:
   ```bash
   # Check logs
   sudo journalctl -u starwars-rpg -f
   
   # Check configuration
   python -m py_compile app.py
   
   # Check permissions
   ls -la /run/starwars-rpg/
   ```

2. **Database Connection Issues**:
   ```bash
   # Test MongoDB connection
   mongo --eval "db.runCommand('ping')"
   
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   ```

3. **High Memory Usage**:
   ```bash
   # Monitor memory usage
   htop
   
   # Check for memory leaks
   ps aux --sort=-%mem | head
   ```

### Health Checks

```bash
#!/bin/bash
# health-check.sh

# Check application
curl -f http://localhost:5000/health || exit 1

# Check database
mongo --eval "db.runCommand('ping')" --quiet || exit 1

# Check disk space
df -h / | awk 'NR==2{if($5+0 > 80) exit 1}'

echo "All systems healthy"
```

## Maintenance

### Regular Maintenance Tasks

1. **Log Rotation**:
   ```bash
   # /etc/logrotate.d/starwars-rpg
   /var/log/starwars-rpg/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 starwars-rpg starwars-rpg
       postrotate
           systemctl reload starwars-rpg
       endscript
   }
   ```

2. **Database Maintenance**:
   ```javascript
   // Monthly database maintenance
   db.runCommand({compact: "characters"})
   db.runCommand({reIndex: "characters"})
   ```

3. **Security Updates**:
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Update Python packages
   pip list --outdated
   pip install -U package_name
   ```

### Zero-Downtime Deployment

```bash
#!/bin/bash
# deploy.sh

# Pull latest code
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Reload application
sudo systemctl reload starwars-rpg

# Verify deployment
curl -f http://localhost:5000/health
```

---

This deployment guide provides comprehensive instructions for deploying the Star Wars RPG Character Manager in production environments. Choose the deployment method that best fits your infrastructure and requirements.

For additional support, refer to the project documentation or contact the development team.
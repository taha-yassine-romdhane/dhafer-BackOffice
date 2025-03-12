# Deployment Guide for Dar-Koftan

This guide will help you deploy your Next.js application to your VPS using Docker.

## Prerequisites

- A VPS with Docker and Docker Compose installed
- SSH access to your VPS
- Basic understanding of Docker and Docker Compose

## Deployment Steps

### 1. Prepare Your Environment File

Create a `.env` file on your VPS based on the `.env.example` file. Make sure to set secure values for all sensitive information like database passwords and JWT secrets.

```bash
# Example of creating and editing the .env file on your VPS
nano .env
```

### 2. Copy Your Project to the VPS

You can use SCP, SFTP, or Git to copy your project files to your VPS.

```bash
# Example using SCP (run this from your local machine)
scp -r /path/to/your/project username@your-vps-ip:/path/on/vps
```

Or if you're using Git:

```bash
# On your VPS
git clone your-repository-url
cd your-repository-directory
```

### 3. Build and Start the Docker Containers

Navigate to your project directory on the VPS and run:

```bash
# Build the containers
docker-compose build

# Start the containers in detached mode
docker-compose up -d
```

### 4. Run Database Migrations

After the containers are up and running, you need to run the Prisma migrations to set up your database schema:

```bash
# Enter the app container
docker-compose exec app sh

# Run Prisma migrations
npx prisma migrate deploy

# Optionally, seed the database if needed
npx prisma db seed

# Exit the container
exit
```

### 5. Configure Nginx (Optional but Recommended)

If you want to use a domain name and HTTPS, you should set up Nginx as a reverse proxy:

```bash
# Install Nginx if not already installed
apt update
apt install nginx

# Create a new Nginx configuration file
nano /etc/nginx/sites-available/dar-koftan
```

Add the following configuration (adjust as needed):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
ln -s /etc/nginx/sites-available/dar-koftan /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6. Set Up SSL with Let's Encrypt (Optional)

For HTTPS, you can use Certbot:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 7. Monitoring and Maintenance

To view logs:

```bash
docker-compose logs -f app
```

To restart the application:

```bash
docker-compose restart app
```

To update your application:

```bash
# Pull the latest code (if using Git)
git pull

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec app sh -c "npx prisma migrate deploy"
```

## Troubleshooting

### Database Connection Issues

If your application can't connect to the database, check:

1. The `DATABASE_URL` in your `.env` file
2. Make sure the database container is running: `docker-compose ps`
3. Check database logs: `docker-compose logs db`

### Application Not Starting

Check the application logs:

```bash
docker-compose logs app
```

### Nginx Configuration Issues

Test your Nginx configuration:

```bash
nginx -t
```

## Backup Strategy

Regularly back up your database:

```bash
# Create a backup script
nano backup.sh
```

Add the following content:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR

# Backup the database
docker-compose exec -T db pg_dump -U postgres darkoftan > $BACKUP_DIR/darkoftan_$TIMESTAMP.sql

# Compress the backup
gzip $BACKUP_DIR/darkoftan_$TIMESTAMP.sql

# Keep only the last 7 backups
ls -tp $BACKUP_DIR/*.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}
```

Make it executable and set up a cron job:

```bash
chmod +x backup.sh
crontab -e
```

Add a line to run the backup daily:

```
0 2 * * * /path/to/backup.sh
```

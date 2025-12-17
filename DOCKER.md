# Docker Setup for QuizMate Production

This Docker Compose setup provides a production-ready QuizMate deployment with a single optimized container.

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine + Docker Compose (Linux)
- No need to install Node.js or npm locally

## Quick Start

### 1. Start the Application

```bash
# Build and start the service
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 2. Access the Application

- **QuizMate**: http://localhost or http://localhost:80

On first run, a configuration file `config/quiz-mate.cfg` will be created automatically.

### 3. Stop the Application

```bash
# Stop the service
docker-compose stop

# Stop and remove container
docker-compose down

# Stop, remove container, and remove volumes
docker-compose down -v
```

## Configuration

### Default Settings

The default configuration uses:
- HTTP port: `8080` (inside container, mapped to `80` on host)
- Static assets: Served locally from the container
- Non-root user for security

### Customizing Configuration

#### Option 1: Environment Variables (docker-compose.yml)

```yaml
services:
  quiz-mate:
    environment:
      - HTTP_PORT=8080
      - STATIC_ASSETS_SOURCE=local  # or 'github' or custom URL
```

#### Option 2: Configuration File (Recommended)

Edit `config/quiz-mate.cfg` after first run:

```ini
# HTTP server port (inside container)
http-port = 8080

# HTTPS configuration (optional)
https-port = 443
https-cert-file = /config/cert.pem
https-key-file = /config/key.pem

# Static assets source (local, github, or custom URL)
static-assets-source = local
```

After editing the config, restart the container:

```bash
docker-compose restart
```

### Changing the Host Port

To use a different port on your host machine, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:8080"  # Host port 8080 instead of 80
```

## Common Tasks

### View Logs

```bash
# View logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100 -f
```

### Shell Access

```bash
# Open a shell in the container
docker-compose exec quiz-mate sh

# Run a command
docker-compose exec quiz-mate node --version
```

### Rebuild After Code Changes

```bash
docker-compose down
docker-compose up --build
```

### Reset Everything

```bash
# Remove container and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up --build
```

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000  # or :3001

# Kill the process or change ports in docker-compose.yml
```

### Hot Reload Not Working

If file changes aren't being detected:

1. Ensure `CHOKIDAR_USEPOLLING=true` is set in docker-compose.yml
2. Try restarting the services:
   ```bash
   docker-compose restart
   ```

### Permission Issues (Linux)

If you encounter permission issues:

```bash
# Change ownership of files created by Docker
sudo chown -R $USER:$USER .
```

### Container Won't Start

Check the logs for errors:

```bash
docker-compose logs backend
docker-compose logs frontend
```

Common issues:
- Missing `package.json` or `package-lock.json`
- Syntax errors in source files
- Port conflicts

## Architecture

```
┌─────────────────────────────────────────┐
│         QuizMate Container              │
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │   Frontend   │   │    Backend    │  │
│  │  (Static)    │◄──│  Express +    │  │
│  │              │   │  Socket.IO    │  │
│  └──────────────┘   └───────────────┘  │
│                                         │
│         Port 8080 (HTTP)                │
└─────────────────────────────────────────┘
              │
              ▼
       Host Port 80
```

## Production Features

✅ **Multi-stage Build**: Frontend is pre-built for optimal performance
✅ **Alpine Linux**: Minimal ~50MB image size
✅ **Non-root User**: Runs as unprivileged `quiz-mate` user
✅ **Health Checks**: Automatic container health monitoring
✅ **Auto-restart**: Container restarts automatically on failure
✅ **Volume Persistence**: Configuration persists across container restarts

## Environment Variables

Available environment variables (set in `docker-compose.yml`):

- `HTTP_PORT`: HTTP server port inside container (default: `8080`)
- `HTTPS_PORT`: HTTPS server port (optional, requires cert files)
- `STATIC_ASSETS_SOURCE`: Where to serve static assets from
  - `local` - Serve from container (default)
  - `github` - Serve from GitHub Pages
  - Custom URL - Serve from your CDN
- `NODE_ENV`: Node environment (default: `production`)

## HTTPS Support

To enable HTTPS:

1. Place your SSL certificate and key in the `config/` directory:
   ```bash
   config/
   ├── quiz-mate.cfg
   ├── cert.pem
   └── key.pem
   ```

2. Update `config/quiz-mate.cfg`:
   ```ini
   https-port = 443
   https-cert-file = /config/cert.pem
   https-key-file = /config/key.pem
   ```

3. Update `docker-compose.yml` to expose HTTPS port:
   ```yaml
   ports:
     - "80:8080"   # HTTP
     - "443:443"   # HTTPS
   ```

4. Restart the container:
   ```bash
   docker-compose restart
   ```

## Advanced Usage

### Using with Reverse Proxy (nginx, Caddy, Traefik)

You can run QuizMate behind a reverse proxy for better SSL management:

```yaml
services:
  quiz-mate:
    ports:
      - "127.0.0.1:8080:8080"  # Only expose to localhost
    # ... rest of config
```

Then configure your reverse proxy to forward requests to `localhost:8080`.

### Custom Build Arguments

Build with custom arguments:

```bash
docker-compose build --build-arg NODE_VERSION=20-alpine
```

### Running Multiple Instances

To run multiple QuizMate instances on the same host:

1. Create a new directory for each instance
2. Copy `docker-compose.yml` and adjust ports
3. Each instance will have its own config volume

## Deployment Examples

### AWS EC2 / DigitalOcean Droplet

```bash
# Install Docker and Docker Compose
# Clone or upload your QuizMate files
cd quiz-mate

# Start the service
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### Docker Swarm / Kubernetes

For orchestrated deployments, convert the `docker-compose.yml` to your platform's format:

```bash
# Docker Swarm
docker stack deploy -c docker-compose.yml quiz-mate

# Kubernetes (using Kompose)
kompose convert
kubectl apply -f .
```

## Monitoring & Maintenance

### Health Checks

The container includes automatic health checks every 30 seconds:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' quiz-mate
```

### Log Rotation

Configure Docker log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Backup Configuration

```bash
# Backup config directory
tar -czf quiz-mate-config-backup.tar.gz config/

# Restore
tar -xzf quiz-mate-config-backup.tar.gz
```

## Performance Tuning

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  quiz-mate:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          memory: 256M
```

### Node.js Optimization

For high-traffic scenarios, set Node.js options:

```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
```

## Troubleshooting

For QuizMate-specific issues, refer to the main [README.md](README.md).

For Docker-specific issues:
- Check logs: `docker-compose logs -f`
- Check container status: `docker-compose ps`
- Inspect container: `docker inspect quiz-mate`
- Check network: `docker network inspect quiz-mate_quiz-mate-network`

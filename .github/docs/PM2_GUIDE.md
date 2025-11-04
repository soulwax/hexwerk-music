# PM2 Production Guide for Starchild Music

## Quick Start

### Production Mode

```bash
# Build and start with ecosystem config
npm run build
pm2 start ecosystem.config.cjs --env production

# Or use the updated npm script
npm run pm2:start
```

### Development Mode

```bash
# Start with hot-reload watching
pm2 start ecosystem.config.cjs --only hexmusic-dev
```

## Available Commands

### Using Ecosystem File (Recommended)

```bash
# Start production cluster
pm2 start ecosystem.config.cjs --env production

# Start only production app
pm2 start ecosystem.config.cjs --only hexmusic-prod

# Start only development app
pm2 start ecosystem.config.cjs --only hexmusic-dev

# Reload (zero-downtime restart)
pm2 reload ecosystem.config.cjs --env production

# Restart all instances
pm2 restart ecosystem.config.cjs

# Stop all
pm2 stop ecosystem.config.cjs

# Delete all from PM2
pm2 delete ecosystem.config.cjs
```

### Process Management

```bash
# View status
pm2 status
pm2 list

# View logs (all instances)
pm2 logs

# View logs for specific app
pm2 logs hexmusic-prod

# View logs with filtering
pm2 logs --lines 100
pm2 logs --err  # Only errors

# Clear logs
pm2 flush

# Monitor resources in real-time
pm2 monit

# Show detailed info
pm2 show hexmusic-prod
```

## Performance Optimization

### 1. Cluster Mode Benefits

- **4 instances** running across CPU cores
- Automatic load balancing
- Zero-downtime deployments with `pm2 reload`
- Fault tolerance (if one instance crashes, others continue)

### 2. Memory Management

- Auto-restart at **2GB per instance** (prevents memory leaks)
- Total memory usage: ~8GB for all instances (33% of available RAM)
- Leaves plenty of room for PostgreSQL, caching, and system

### 3. Scaling

```bash
# Scale up to 6 instances (use all cores)
pm2 scale hexmusic-prod 6

# Scale down to 2 instances
pm2 scale hexmusic-prod 2

# Scale to max (auto-detect cores)
pm2 scale hexmusic-prod max
```

### 4. Log Rotation (Prevent log files from growing too large)

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 100M        # Rotate at 100MB
pm2 set pm2-logrotate:retain 10            # Keep 10 old logs
pm2 set pm2-logrotate:compress true        # Compress old logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true    # Rotate PM2 module logs
pm2 set pm2-logrotate:workerInterval 30    # Check every 30 seconds
```

## Auto-Startup on System Reboot

```bash
# Generate startup script (run once)
pm2 startup

# Save current process list
pm2 save

# Now PM2 will auto-start on reboot with saved processes
```

To disable:

```bash
pm2 unstartup
```

## Deployment Workflow

### Zero-Downtime Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if package.json changed)
npm install

# 3. Build the application
npm run build

# 4. Reload (zero-downtime restart)
pm2 reload ecosystem.config.cjs --env production

# Or use a single command
npm run deploy
```

### Full Restart (if needed)

```bash
npm run build
pm2 restart ecosystem.config.cjs --env production
```

## Monitoring & Debugging

### Real-time Monitoring

```bash
# Built-in monitoring
pm2 monit

# Or use PM2 Plus (web-based monitoring)
pm2 link <secret> <public>  # Sign up at https://pm2.io
```

### Health Checks

```bash
# Check if app is responsive
pm2 ping hexmusic-prod

# Detailed process info
pm2 describe hexmusic-prod

# Show environment variables
pm2 env 0  # Replace 0 with instance ID
```

### Performance Metrics

```bash
# Show metrics
pm2 metrics

# Show detailed process stats
pm2 show hexmusic-prod
```

## Troubleshooting

### App Won't Start

```bash
# Check logs
pm2 logs hexmusic-prod --lines 50

# Check error logs specifically
pm2 logs hexmusic-prod --err --lines 50

# Try starting in fork mode (single instance) for debugging
pm2 start ecosystem.config.cjs --only hexmusic-prod -i 1
```

### High Memory Usage

```bash
# Check current memory per instance
pm2 list

# If consistently hitting 2GB limit, consider:
# 1. Analyzing memory leaks with profiling
# 2. Reducing instances: pm2 scale hexmusic-prod 2
# 3. Increasing max_memory_restart in ecosystem config
```

### High CPU Usage

```bash
# Check CPU per instance
pm2 monit

# Profile CPU usage
pm2 profile start
# ... let it run for a bit ...
pm2 profile stop

# Consider reducing instances if consistently maxed
pm2 scale hexmusic-prod 2
```

### Database Connection Issues

```bash
# Check environment variables are loaded
pm2 describe hexmusic-prod | grep env

# Restart with fresh environment
pm2 restart hexmusic-prod --update-env

# Check database connectivity from shell
psql $DATABASE_URL
```

## Environment Variables

PM2 loads environment variables in this order:

1. `.env.production` (if exists)
2. `.env` (if exists)
3. `env_production` block in ecosystem.config.cjs
4. System environment variables

To update environment variables:

```bash
# 1. Update .env.production
# 2. Reload with update-env flag
pm2 reload hexmusic-prod --update-env
```

## Best Practices

### 1. Always Build Before Starting

```bash
npm run build && pm2 reload ecosystem.config.cjs --env production
```

### 2. Use Reload, Not Restart

- **Reload**: Zero-downtime (waits for new instances to be ready)
- **Restart**: Brief downtime (kills all instances first)

### 3. Monitor Logs Regularly

```bash
# Set up log monitoring
pm2 logs --lines 100 --format

# Or use PM2 Plus for alerts
```

### 4. Regular Maintenance

```bash
# Weekly log cleanup
pm2 flush

# Check for PM2 updates
npm install pm2@latest -g
pm2 update

# Backup process list
pm2 save
```

### 5. Load Testing

```bash
# Install load testing tool
npm install -g autocannon

# Test your cluster
autocannon -c 100 -d 30 http://localhost:3222
```

## Configuration Tuning

Edit `ecosystem.config.cjs` based on your needs:

| Setting | Current | When to Change |
|---------|---------|----------------|
| `instances` | 4 | Increase for more traffic, decrease if memory constrained |
| `max_memory_restart` | 2G | Increase if legitimate high memory usage, decrease to catch leaks faster |
| `max_restarts` | 10 | Increase for unstable deployments (not recommended) |
| `kill_timeout` | 5000ms | Increase if graceful shutdown takes longer |

## Next.js Specific Optimizations

### 1. Static Generation

Ensure static pages are pre-generated during build:

```json
// next.config.mjs
export default {
  output: 'standalone', // Optional: reduces deployment size
};
```

### 2. Cache Headers

Next.js automatically sets cache headers. Verify with:

```bash
curl -I http://localhost:3222/_next/static/...
```

### 3. Image Optimization

Next.js Image component is already optimized, but consider:

- Setting up external image optimization service
- Using CloudFront/CDN for static assets

## Advanced: PM2 Plus Integration

For production monitoring:

```bash
# 1. Sign up at https://pm2.io
# 2. Link your PM2
pm2 link <secret> <public>

# Features unlocked:
# - Real-time monitoring dashboard
# - Error tracking and alerting
# - Custom metrics
# - Transaction tracing
# - Remote actions
```

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# PM2 shortcuts for Starchild Music
alias pm2-start='npm run build && pm2 start ecosystem.config.cjs --env production'
alias pm2-reload='npm run build && pm2 reload ecosystem.config.cjs --env production'
alias pm2-logs='pm2 logs hexmusic-prod'
alias pm2-status='pm2 list'
alias pm2-monitor='pm2 monit'
alias pm2-reset='pm2 delete all && pm2 kill'
```

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Production Checklist](https://nextjs.org/docs/deployment#production)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Plus](https://pm2.io/)

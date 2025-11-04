# PM2 Quick Reference - HexMusic

## 🚀 Quick Start Commands

```bash
./pm2-setup.sh              # Interactive setup (first time)
npm run pm2:start           # Start production cluster
npm run pm2:status          # Check status
npm run pm2:logs            # View logs
npm run deploy              # Deploy updates (zero-downtime)
```

## 📊 Common Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | Build & start production cluster (4 instances) |
| `npm run pm2:dev` | Start development mode with watch |
| `npm run pm2:reload` | Zero-downtime restart |
| `npm run pm2:restart` | Hard restart (brief downtime) |
| `npm run pm2:stop` | Stop all instances |
| `npm run pm2:status` | Show process status |
| `npm run pm2:logs` | Stream production logs |
| `npm run pm2:logs:error` | Stream error logs only |
| `npm run pm2:monit` | Real-time resource monitoring |
| `npm run deploy` | Full deployment (build + reload) |

## 🔍 Monitoring

```bash
pm2 status                  # Process list
pm2 monit                   # Real-time monitoring
pm2 logs hexmusic-prod      # Stream logs
pm2 logs --lines 100        # Last 100 lines
pm2 logs --err              # Errors only
pm2 describe hexmusic-prod  # Detailed info
```

## 🎯 Scaling

```bash
pm2 scale hexmusic-prod 6   # Scale to 6 instances
pm2 scale hexmusic-prod 2   # Scale down to 2
pm2 scale hexmusic-prod max # Scale to max (all cores)
```

## 🔄 Deployment Workflow

```bash
# Standard deployment (recommended)
npm run deploy

# Or manual steps:
git pull origin main
npm install          # If dependencies changed
npm run deploy
```

## 🛠️ Troubleshooting

```bash
# App won't start
pm2 logs hexmusic-prod --err --lines 50
pm2 describe hexmusic-prod

# Reset everything
npm run pm2:delete
pm2 kill
npm run pm2:start

# Check environment
pm2 show hexmusic-prod | grep env

# Memory issues
pm2 scale hexmusic-prod 2   # Reduce instances
```

## 📝 Log Management

```bash
pm2 flush                   # Clear all logs
pm2 logs --format           # Formatted logs
pm2 logs --timestamp        # With timestamps
pm2 logs --nostream         # Show logs without streaming

# Log files location
logs/pm2/out.log           # Standard output
logs/pm2/error.log         # Error output
logs/pm2/combined.log      # Combined logs
```

## ⚙️ Configuration (ecosystem.config.cjs)

| Setting | Value | Purpose |
|---------|-------|---------|
| Instances | 4 | Balance performance & memory |
| Max Memory | 2GB | Restart if exceeded |
| Mode | Cluster | Load balancing |
| Port | 3222 | Application port |
| Kill Timeout | 5s | Graceful shutdown time |

## 🔐 Environment Variables

Variables loaded from:
1. `.env.production` (production)
2. `.env` (fallback)
3. `ecosystem.config.cjs` (defaults)

To update:
```bash
# Edit .env.production, then:
npm run pm2:reload
```

## 🌟 Auto-Startup on Reboot

```bash
# Setup (run once)
pm2 startup
pm2 save

# Disable
pm2 unstartup
```

## 📈 Performance Monitoring

```bash
# Real-time metrics
pm2 monit

# Process details
pm2 show hexmusic-prod

# Custom metrics (if PM2 Plus enabled)
pm2 link <secret> <public>
```

## 🚨 Health Checks

```bash
# Check if responsive
pm2 ping hexmusic-prod

# Detailed process info
pm2 describe hexmusic-prod

# Resource usage
pm2 list
```

## 🎨 Log Rotation Setup

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

## 📱 Process States

| State | Meaning |
|-------|---------|
| `online` | Running normally |
| `stopping` | Gracefully shutting down |
| `stopped` | Not running |
| `launching` | Starting up |
| `errored` | Crashed (will auto-restart) |

## 🔥 Emergency Commands

```bash
# Kill all PM2 processes
pm2 kill

# Delete all apps
pm2 delete all

# Reset and restart
pm2 delete all && pm2 kill
npm run pm2:start
pm2 save
```

## 💡 Best Practices

✅ **DO:**
- Use `pm2 reload` for deployments (zero-downtime)
- Monitor logs regularly
- Set up log rotation
- Use `pm2 save` after changes
- Keep PM2 updated: `npm install pm2@latest -g`

❌ **DON'T:**
- Use `pm2 restart` unless necessary (causes downtime)
- Run `pm2 delete` in production without backup
- Ignore memory warnings
- Skip `npm run build` before deployment

## 📚 Resources

- [Full Guide](./PM2_GUIDE.md)
- [PM2 Docs](https://pm2.keymetrics.io/)
- [Next.js Production](https://nextjs.org/docs/deployment)

---

**Current Setup:** 4 instances × 2GB = 8GB max memory usage
**System:** 6 cores, 23GB RAM
**Port:** 3222
**Logs:** `./logs/pm2/`

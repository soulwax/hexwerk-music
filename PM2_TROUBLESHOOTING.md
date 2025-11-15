# PM2 Troubleshooting Guide

## Common Issues When Backend Works in Dev but Fails with PM2

### 1. Environment Variables Not Loaded

PM2 doesn't automatically load `.env` files`. You need to either:

**Option A: Use PM2 ecosystem file with env vars**
```javascript
module.exports = {
  apps: [{
    name: 'starchild-music-backend',
    script: './dist/src/main.js',
    env: {
      NODE_ENV: 'production',
      // Add ALL your environment variables here
      PORT: '3001',
      DATABASE_URL: 'your-db-url',
      STREAMING_KEY: 'your-key',
      // ... all other env vars
    }
  }]
};
```

**Option B: Use .env file with PM2**
```bash
pm2 start ecosystem.config.cjs --env production
```

And create a `.env.production` file in the backend directory.

**Option C: Use dotenv in your backend code**
Make sure your backend loads environment variables:
```typescript
import dotenv from 'dotenv';
dotenv.config(); // Loads .env file
```

### 2. Port Binding Issues in Cluster Mode

When using `exec_mode: 'cluster'`, each instance tries to bind to the same port. Your backend needs to handle this:

```typescript
// Backend should use process.env.PORT or a default
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Check if port is already in use:**
```bash
lsof -i :3001  # Replace with your port
netstat -tulpn | grep :3001
```

### 3. Path Issues

The script path `./dist/src/main.js` might be wrong. Check:

```bash
# From backend directory
ls -la dist/src/main.js
# If it doesn't exist, check:
ls -la dist/
# The actual path might be:
# - dist/main.js
# - dist/index.js
# - build/main.js
```

### 4. Database Connection Pool Issues

Cluster mode creates multiple instances, each needing database connections. Check your database connection pool settings:

```typescript
// Make sure pool size accounts for cluster instances
const poolSize = process.env.DB_POOL_SIZE || 10;
// If you have 4 CPU cores, you might need 4 * poolSize
```

### 5. CORS Configuration

Make sure your backend allows requests from your frontend domain:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://starchildmusic.com',
  credentials: true
}));
```

### 6. Logging and Debugging

Add better logging to see what's happening:

```javascript
// In ecosystem.config.cjs
env: {
  NODE_ENV: 'production',
  DEBUG: '*', // Enable debug logging
  LOG_LEVEL: 'debug'
}
```

Check PM2 logs:
```bash
pm2 logs starchild-music-backend --lines 100
pm2 logs starchild-music-backend --err --lines 100  # Only errors
```

### 7. Quick Diagnostic Steps

1. **Check if backend is actually running:**
   ```bash
   pm2 list
   pm2 info starchild-music-backend
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs starchild-music-backend --lines 50
   ```

3. **Test backend directly:**
   ```bash
   curl http://localhost:3001/music/stream?id=123&key=your-key
   # Or whatever your backend URL is
   ```

4. **Check environment variables:**
   ```bash
   pm2 env 0  # Shows env vars for process 0
   ```

5. **Restart with verbose logging:**
   ```bash
   pm2 restart starchild-music-backend --update-env
   pm2 logs starchild-music-backend --lines 100
   ```

### 8. Recommended PM2 Config Fix

```javascript
module.exports = {
  apps: [{
    name: 'starchild-music-backend',
    script: './dist/src/main.js',
    instances: 2, // Start with 2, not 'max' - easier to debug
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--openssl-legacy-provider',
      // Add all your env vars here explicitly
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    max_memory_restart: '1G',
    watch: false,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    instance_var: 'INSTANCE_ID',
  }],
};
```

### 9. Frontend Debugging

The frontend now has better error logging. Check browser console and Next.js server logs for:
- `[Stream API]` prefixed messages
- Connection errors
- Timeout errors
- Backend URL being used

### Most Likely Issues (in order):

1. **Environment variables not loaded** - 90% of PM2 issues
2. **Wrong script path** - 5% of issues  
3. **Port already in use** - 3% of issues
4. **Database connection pool exhausted** - 2% of issues


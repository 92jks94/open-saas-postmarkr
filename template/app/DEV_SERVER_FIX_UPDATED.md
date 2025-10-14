# Development Server Connection Issue - COMPLETE FIX

## Problem Summary (UPDATED)

The frontend was unable to connect to the backend server, showing `ERR_CONNECTION_REFUSED` errors when trying to reach `http://localhost:3001/auth/me`.

## Root Causes (Both Fixed)

### Issue #1: Production URLs in .env.server
Your `.env.server` file was configured for production mode with production URLs.

### Issue #2: Wrong PORT Configuration ⭐ **THIS WAS THE MAIN ISSUE**
Your `.env.server` file had `PORT=8080` set, which caused the server to listen on port 8080 instead of the expected port 3001. The frontend was trying to connect to port 3001, but the server was only listening on port 8080.

## What Was Fixed

I made two changes to your `.env.server` file:

1. **Set development URLs:**
   ```bash
   WASP_WEB_CLIENT_URL=http://localhost:3000
   WASP_SERVER_URL=http://localhost:3001
   ```

2. **Commented out the PORT override:** ⭐ **KEY FIX**
   ```bash
   #PORT=8080  # Commented out so Wasp uses default port 3001
   ```

## Next Steps - RESTART REQUIRED

**You MUST restart the Wasp development server** for these changes to take effect:

```bash
cd /home/nathah/Projects/open-saas-postmarkr/template/app
wasp start
```

## Expected Result

After restarting, you should see:
- ✅ Frontend (Vite) at: `http://localhost:3000`
- ✅ Backend (Node/Express) at: `http://localhost:3001` (NOT 8080!)

Test the backend with:
```bash
curl http://localhost:3001/health
```

You should get a JSON health check response, not a connection refused error.

## Why This Happened

The `PORT=8080` environment variable overrides Wasp's default port configuration. When set:
- The server binds to port 8080
- But the frontend (and `WASP_SERVER_URL`) expects port 3001
- This creates a mismatch causing `ERR_CONNECTION_REFUSED`

## Verification

After starting `wasp start`, you can verify the correct ports are listening:
```bash
ss -tlnp | grep -E ':(3000|3001)'
```

You should see:
- Port 3000: vite (frontend)
- Port 3001: node (backend server)

## For Production

When deploying to production:
1. The `PORT` environment variable is typically set by your hosting platform (Fly.io sets it to 8080)
2. Make sure to use production URLs in `.env.server`
3. The hosting platform handles the port mapping

## Still Having Issues?

If it still doesn't work after restarting:

1. **Check the Wasp startup logs** - look for any errors
2. **Verify nothing else is using port 3001:**
   ```bash
   lsof -i :3001
   ```
3. **Check if the database is running:**
   ```bash
   wasp start db  # Should already be running
   ```
4. **View the complete environment:**
   ```bash
   cat .wasp/out/server/.env | grep PORT
   ```
   Should NOT show `PORT=` or should show `PORT=3001`

## Summary

The issue was that your server was running on port 8080 while your frontend expected port 3001. By commenting out `PORT=8080` in `.env.server`, the server will now use Wasp's default port 3001, matching what the frontend expects.

🎯 **Just restart `wasp start` and it should work!**


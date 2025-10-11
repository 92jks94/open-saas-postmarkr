# ⚠️ CRITICAL: How to Properly Restart Wasp Dev Server

## Why This Matters
Vite (which Wasp uses) **only reads `.env.client` when the dev server starts**. 
Simply refreshing your browser or hot-reloading will NOT pick up new environment variables!

## How to Restart (Choose Your Method)

### Method 1: Terminal Where `wasp start` is Running
1. **Go to the terminal** where you see the Wasp dev server running
2. **Press `Ctrl+C`** (or `Cmd+C` on Mac) to stop it
3. **Wait for it to fully stop** (you'll see "Server stopped" or similar)
4. **Run `wasp start` again**
5. **Wait for both** client and server to finish building (usually 30-60 seconds)

### Method 2: If You Lost the Terminal
1. **Open Task Manager** (Windows) or **Activity Monitor** (Mac)
2. **Find and kill** any `node` or `wasp` processes
3. **Open a fresh terminal** in your project root
4. **Run `wasp start`**

### Method 3: WSL Users
```bash
# Kill any existing Wasp processes
pkill -f wasp
pkill -f node

# Start fresh
wasp start
```

## After Restart: What to Check

### Step 1: Wait for Build to Complete
You should see output like:
```
✅ Client ready in X seconds
✅ Server ready in X seconds
🚀 Your app is running at http://localhost:3000
```

### Step 2: Open Browser with DevTools
1. Go to http://localhost:3000
2. Open DevTools (F12)
3. Go to Console tab
4. **Clear console** (trash icon)

### Step 3: Accept Cookies
1. Click "Accept all" on the cookie banner
2. Look for the **DEBUG logs**:
```
🔍 DEBUG: All import.meta.env: { MODE: "development", VITE_GOOGLE_ANALYTICS_ID: "G-6H2SB3GJDW", ... }
🔍 DEBUG: GA_ANALYTICS_ID value: G-6H2SB3GJDW
✅ Initializing Google Analytics with ID: G-6H2SB3GJDW
✅ Google Analytics script loaded successfully
```

## ❌ If You Still See "Google Analytics ID not provided"

Check the DEBUG log output and tell me what you see for:
- `🔍 DEBUG: All import.meta.env:`
- `🔍 DEBUG: GA_ANALYTICS_ID value:`

This will tell us if:
1. ✅ Vite is loading `.env.client` → We'll see `VITE_GOOGLE_ANALYTICS_ID: "G-6H2SB3GJDW"`
2. ❌ Vite is NOT loading `.env.client` → We'll see it's missing or undefined

## Common Mistakes

### ❌ Just Refreshing Browser
```
Browser refresh → Code changes load ✅
Browser refresh → Environment variables load ❌
```

### ❌ Hot Module Reload (HMR)
When you edit code and it auto-refreshes, env vars don't reload!

### ✅ Full Server Restart
Only a **complete stop and start** of `wasp start` loads new env vars!

---

**DO THIS NOW:**
1. Stop `wasp start` with Ctrl+C
2. Run `wasp start` again
3. Wait for full build
4. Check console for DEBUG logs
5. Report back what you see!


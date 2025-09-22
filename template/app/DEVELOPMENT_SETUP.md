# Nathan created

# Development Setup Guide

This guide ensures your Wasp development environment works reliably every time.

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual Setup
```bash
# 1. Clean up any existing processes
./cleanup-dev.sh

# 2. Start the development environment
source ~/.bashrc
cd /home/nathah/Projects/open-saas-postmarkr/template/app
wasp start db &
sleep 15
wasp start
```

## 🔧 Troubleshooting

### If Wasp Command Not Found
```bash
./fix-bashrc.sh
source ~/.bashrc
```

### If Port Conflicts
```bash
./cleanup-dev.sh
```

### If Database Issues
```bash
# Check if Docker is running
docker ps

# Restart database
wasp start db
```

## 📁 Scripts Available

- **`start-dev.sh`** - Complete development environment startup
- **`cleanup-dev.sh`** - Stop all development processes
- **`fix-bashrc.sh`** - Fix PATH configuration issues

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Database**: PostgreSQL in Docker container

## ✅ Verification

After running `./start-dev.sh`, you should see:
1. ✅ Wasp found: 0.18.0
2. ✅ Database is running
3. 🚀 Starting Wasp development server...
4. 📱 Application available at http://localhost:3000

## 🔄 Restart After System Reboot

1. Open WSL terminal
2. Navigate to project: `cd /home/nathah/Projects/open-saas-postmarkr/template/app`
3. Run: `./start-dev.sh`

That's it! Everything should work automatically.

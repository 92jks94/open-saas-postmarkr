# Google Analytics API SSL/TLS Fix

## Problem
The Google Analytics API was experiencing SSL/TLS decoder errors with the message:
```
error:1E08010C:DECODER routines::unsupported
```

This error occurs due to compatibility issues between Node.js 22.x and OpenSSL 3.x when using the Google Analytics Data API client.

## Solution
We've implemented several fixes to resolve this issue:

### 1. Runtime SSL Configuration
The Google Analytics client now automatically sets the `NODE_OPTIONS` environment variable to use the legacy OpenSSL provider:
```typescript
if (!process.env.NODE_OPTIONS?.includes('--openssl-legacy-provider')) {
  process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --openssl-legacy-provider';
}
```

### 2. Retry Logic with Error Detection
All Google Analytics API functions now include:
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **SSL Error Detection**: Specifically detects decoder errors and provides helpful logging
- **Graceful Fallback**: Falls back to previous data when API calls fail

### 3. Startup Scripts
Two startup scripts are provided to ensure the SSL fix is applied:

#### Linux/macOS (WSL)
```bash
./start-with-ssl-fix.sh
```

#### Windows
```cmd
start-with-ssl-fix.bat
```

## Usage

### Option 1: Use the Startup Scripts
Run one of the startup scripts instead of `wasp start`:
- **Linux/macOS/WSL**: `./start-with-ssl-fix.sh`
- **Windows**: `start-with-ssl-fix.bat`

### Option 2: Set Environment Variable Manually
Before starting the application, set the NODE_OPTIONS environment variable:
```bash
export NODE_OPTIONS="--openssl-legacy-provider"
wasp start
```

### Option 3: Package.json Script (Alternative)
You can also add this to your package.json scripts:
```json
{
  "scripts": {
    "start:ssl-fix": "NODE_OPTIONS='--openssl-legacy-provider' wasp start"
  }
}
```

## Technical Details

### Root Cause
The error occurs because:
1. Node.js 22.x uses OpenSSL 3.x by default
2. The Google Analytics Data API client uses gRPC with specific SSL/TLS requirements
3. Some legacy SSL routines are not supported in OpenSSL 3.x by default
4. The `--openssl-legacy-provider` flag enables backward compatibility

### Error Handling
The updated code includes:
- **Automatic Detection**: Identifies SSL decoder errors specifically
- **Retry Mechanism**: Attempts the API call up to 3 times
- **Exponential Backoff**: Waits 2, 4, 6 seconds between retries
- **Detailed Logging**: Provides clear error messages and debugging information

### Fallback Behavior
When Google Analytics API calls fail:
- The application logs the error with detailed information
- Previous day's data is used as fallback
- The application continues to function normally
- Users see a message indicating fallback data is being used

## Verification
After applying the fix, you should see:
1. No more `error:1E08010C:DECODER routines::unsupported` errors
2. Successful Google Analytics API calls in the server logs
3. Proper analytics data being displayed in the dashboard

## Troubleshooting
If you still experience issues:
1. Ensure you're using the startup script or have set NODE_OPTIONS
2. Check that your Google Analytics credentials are correctly configured
3. Verify your Google Analytics property ID is valid
4. Check the server logs for any remaining error messages

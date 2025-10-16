@echo off
REM Script to start the Wasp application with SSL/TLS fixes for Google Analytics API
REM This addresses the "error:1E08010C:DECODER routines::unsupported" issue

echo 🔧 Starting Wasp application with SSL/TLS fixes...
echo 📊 This will help resolve Google Analytics API decoder errors

REM Set NODE_OPTIONS to use legacy OpenSSL provider
set NODE_OPTIONS=--openssl-legacy-provider

echo ✅ NODE_OPTIONS set to: %NODE_OPTIONS%
echo 🚀 Starting Wasp development server...

REM Start the Wasp development server
wasp start

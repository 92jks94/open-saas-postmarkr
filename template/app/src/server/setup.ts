// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
// If you're using ECMAScript Modules (ESM) syntax, use `import "./instrument.js";`
import "../instrument.js";

import { validateServerStartup } from './startupValidation';
import type { MiddlewareConfigFn } from 'wasp/server';
import cors from 'cors';

// Validate CORS environment variables
function validateCorsEnvironment(): void {
  const clientUrl = process.env.WASP_WEB_CLIENT_URL;
  const serverUrl = process.env.WASP_SERVER_URL;
  
  console.log('🔧 CORS Environment Validation:');
  console.log(`   WASP_WEB_CLIENT_URL: ${clientUrl || 'NOT SET'}`);
  console.log(`   WASP_SERVER_URL: ${serverUrl || 'NOT SET'}`);
  
  if (!clientUrl) {
    console.warn('⚠️  WARNING: WASP_WEB_CLIENT_URL not set. CORS may not work properly.');
  }
  
  if (!serverUrl) {
    console.warn('⚠️  WARNING: WASP_SERVER_URL not set. CORS may not work properly.');
  }
}

// Server setup function called by Wasp on server startup
export async function setupServer(): Promise<void> {
  // Sentry is already initialized via instrument.js import at the top of this file
  
  // Validate CORS environment
  validateCorsEnvironment();
  
  // Run comprehensive startup validation asynchronously
  // This prevents blocking the server from responding to health checks
  // which is critical for Fly.io deployments
  setImmediate(async () => {
    try {
      await validateServerStartup();
      console.log('✅ Server startup validation completed successfully');
    } catch (error) {
      console.error('❌ Startup validation failed:', error);
      // Don't throw error - server is already running
    }
  });
  
  console.log('🚀 Server is ready to accept requests');
}

// Server middleware configuration function
export const serverMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // Configure CORS to allow client-server communication
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('🔍 CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      // Get allowed origins from environment variables
      const clientUrl = process.env.WASP_WEB_CLIENT_URL;
      const serverUrl = process.env.WASP_SERVER_URL;
      
      const allowedOrigins = [
        'http://localhost:3000', // Development
        'http://localhost:3001', // Development server
        'https://postmarkr-client.fly.dev', // Production client (old)
        'https://postmarkr-server.fly.dev', // Production server (old)
        'https://postmarkr-server-client.fly.dev', // Production client (current)
        'https://postmarkr-server-server.fly.dev', // Production server (current)
        'https://postmarkr.com', // Production domain
        'https://www.postmarkr.com', // Production domain with www
      ];
      
      // Add environment-based URLs if they exist
      if (clientUrl && !allowedOrigins.includes(clientUrl)) {
        allowedOrigins.push(clientUrl);
      }
      if (serverUrl && !allowedOrigins.includes(serverUrl)) {
        allowedOrigins.push(serverUrl);
      }
      
      // Always log CORS checks in production for debugging
      console.log(`🔍 CORS check: origin="${origin}", allowed=${allowedOrigins.includes(origin)}`);
      console.log(`🔍 Allowed origins: ${allowedOrigins.join(', ')}`);
      
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };
  
  middlewareConfig.set('cors', cors(corsOptions));
  
  // Note: Rate limiting is implemented at the operation level instead of middleware level
  // This provides better control and is more compatible with Wasp's architecture
  
  // Sentry is already initialized above
  // The integrations will automatically handle request tracking
  return middlewareConfig;
};
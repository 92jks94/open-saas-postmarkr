/**
 * Server configuration for production deployment
 * This module handles server binding configuration for different environments
 */

/**
 * Gets the host address for server binding
 * In production (especially on Fly.io), we need to bind to 0.0.0.0
 * In development, we can bind to localhost
 */
export function getServerHost(): string {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const customHost = process.env.SERVER_HOST;
  
  // If a custom host is specified, use it
  if (customHost) {
    return customHost;
  }
  
  // In production, bind to 0.0.0.0 to allow external connections
  if (nodeEnv === 'production') {
    return '0.0.0.0';
  }
  
  // In development, bind to localhost
  return 'localhost';
}

/**
 * Gets the port for server binding
 * Uses PORT environment variable or defaults to 3001
 */
export function getServerPort(): number {
  const port = process.env.PORT || '3001';
  return parseInt(port, 10);
}

/**
 * Logs server binding information
 */
export function logServerBinding(host: string, port: number): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`🌐 Server configured for ${nodeEnv.toUpperCase()} environment`);
  console.log(`🔗 Binding to: ${host}:${port}`);
  
  if (nodeEnv === 'production' && host === '0.0.0.0') {
    console.log('✅ Production binding configured - server accessible externally');
  } else if (nodeEnv === 'development' && host === 'localhost') {
    console.log('🔧 Development binding configured - server accessible locally');
  }
}

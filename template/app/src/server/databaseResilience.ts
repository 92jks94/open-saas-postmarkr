import { PrismaClient } from '@prisma/client';
import { RETRY_CONFIG } from './constants/resilience';

/**
 * Database connection resilience utilities
 * Provides retry logic, connection pooling, and health monitoring
 */

interface ConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  connectionTimeout: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  maxRetries: 5,
  retryDelay: RETRY_CONFIG.BASE_DELAY_MS,
  healthCheckInterval: 30000, // 30 seconds
  connectionTimeout: RETRY_CONFIG.CONNECTION_TIMEOUT_MS,
};

class DatabaseResilience {
  private prisma: PrismaClient;
  private config: ConnectionConfig;
  private isHealthy: boolean = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private lastHealthCheck: Date = new Date();

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
    
    this.startHealthMonitoring();
  }

  /**
   * Connect to database with retry logic
   */
  async connect(): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.config.maxRetries) {
      try {
        console.log(`🔄 Database connection attempt ${attempts + 1}/${this.config.maxRetries}`);
        
        await Promise.race([
          this.prisma.$connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout)
          )
        ]);
        
        // Test the connection
        await this.prisma.$queryRaw`SELECT 1 as test`;
        
        this.isHealthy = true;
        console.log('✅ Database connection established successfully');
        return;
        
      } catch (error) {
        attempts++;
        console.error(`❌ Database connection attempt ${attempts} failed:`, error);
        
        if (attempts >= this.config.maxRetries) {
          console.error('🚨 Maximum database connection retries exceeded');
          this.isHealthy = false;
          throw new Error(`Database connection failed after ${this.config.maxRetries} attempts: ${error}`);
        }
        
        console.log(`⏳ Retrying in ${this.config.retryDelay}ms...`);
        await this.delay(this.config.retryDelay);
      }
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform a health check on the database connection
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      console.error('🚨 Database health check failed:', error);
      this.isHealthy = false;
      
      // Attempt to reconnect if health check fails
      try {
        await this.connect();
        return true;
      } catch (reconnectError) {
        console.error('🚨 Database reconnection failed:', reconnectError);
        return false;
      }
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    lastHealthCheck: Date;
    uptime: number;
  } {
    return {
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      uptime: Date.now() - this.lastHealthCheck.getTime(),
    };
  }

  /**
   * Gracefully disconnect
   */
  async disconnect(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }

  /**
   * Get the Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const databaseResilience = new DatabaseResilience();

// Export the class for testing
export { DatabaseResilience };

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connection...');
  await databaseResilience.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connection...');
  await databaseResilience.disconnect();
  process.exit(0);
});

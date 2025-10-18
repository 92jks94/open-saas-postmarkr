/**
 * Structured Logging Helper for Lob Operations
 * 
 * Provides consistent, structured logging across all Lob-related operations.
 * All logs include timestamps, context, and standardized formatting for easy
 * parsing and monitoring.
 */

import { LOB_MONITORING_CONFIG } from './config';
import { LobErrorCode, getLobError, requiresAdminAlert, isCriticalError } from './errors';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

/**
 * Base log entry structure
 */
interface BaseLogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Lob operation log entry
 */
interface LobOperationLogEntry extends BaseLogEntry {
  operation: string;
  userId?: string;
  mailPieceId?: string;
  lobId?: string;
  duration?: number;
}

/**
 * Lob error log entry
 */
interface LobErrorLogEntry extends BaseLogEntry {
  errorCode?: LobErrorCode;
  error?: string;
  stack?: string;
  requiresAlert?: boolean;
}

/**
 * Format a log entry for console output
 */
function formatLogEntry(entry: BaseLogEntry): string {
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    critical: '🔴',
  }[entry.level];
  
  const prefix = `${emoji} [${entry.level.toUpperCase()}] ${entry.timestamp} [${entry.context}]`;
  const message = entry.message;
  const metadata = entry.metadata ? `\n${JSON.stringify(entry.metadata, null, 2)}` : '';
  
  return `${prefix} ${message}${metadata}`;
}

/**
 * Check if logging is enabled for the given level
 */
function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
  const configLevel = LOB_MONITORING_CONFIG.logLevel as LogLevel;
  const currentLevelIndex = levels.indexOf(level);
  const configLevelIndex = levels.indexOf(configLevel);
  
  return currentLevelIndex >= configLevelIndex;
}

/**
 * Core logging function
 */
function log(entry: BaseLogEntry): void {
  if (!shouldLog(entry.level)) {
    return;
  }
  
  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
    case 'critical':
      console.error(formatted);
      break;
  }
}

/**
 * Lob Logger class
 */
export class LobLogger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      context: this.context,
      message,
      metadata,
    });
  }
  
  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      context: this.context,
      message,
      metadata,
    });
  }
  
  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      context: this.context,
      message,
      metadata,
    });
  }
  
  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, any>): void {
    log({
      timestamp: new Date().toISOString(),
      level: 'error',
      context: this.context,
      message,
      metadata,
    });
  }
  
  /**
   * Log critical message (always logged, regardless of log level)
   */
  critical(message: string, metadata?: Record<string, any>): void {
    const entry: BaseLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'critical',
      context: this.context,
      message,
      metadata,
    };
    
    // Always log critical messages
    console.error(formatLogEntry(entry));
  }
  
  /**
   * Log Lob operation start
   */
  operationStart(operation: string, metadata?: Record<string, any>): void {
    this.info(`🚀 Operation started: ${operation}`, metadata);
  }
  
  /**
   * Log Lob operation success
   */
  operationSuccess(operation: string, duration?: number, metadata?: Record<string, any>): void {
    this.info(`✅ Operation completed: ${operation}`, {
      ...metadata,
      durationMs: duration,
    });
  }
  
  /**
   * Log Lob operation failure
   */
  operationFailure(operation: string, error: unknown, metadata?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.error(`❌ Operation failed: ${operation}`, {
      ...metadata,
      error: errorMessage,
      stack: errorStack,
    });
  }
  
  /**
   * Log Lob API request
   */
  apiRequest(operation: string, metadata?: Record<string, any>): void {
    if (LOB_MONITORING_CONFIG.verboseLogging) {
      this.debug(`📮 Lob API Request: ${operation}`, metadata);
    }
  }
  
  /**
   * Log Lob API response
   */
  apiResponse(operation: string, statusCode: number, metadata?: Record<string, any>): void {
    if (LOB_MONITORING_CONFIG.verboseLogging) {
      this.debug(`📬 Lob API Response: ${operation}`, {
        ...metadata,
        statusCode,
      });
    }
  }
  
  /**
   * Log Lob API error with error code
   */
  apiError(errorCode: LobErrorCode, metadata?: Record<string, any>): void {
    const errorDef = getLobError(errorCode);
    const level = isCriticalError(errorCode) ? 'critical' : 'error';
    
    const entry: LobErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message: errorDef.message,
      errorCode,
      metadata: {
        ...metadata,
        userMessage: errorDef.userMessage,
        action: errorDef.action,
        severity: errorDef.severity,
      },
      requiresAlert: requiresAdminAlert(errorCode),
    };
    
    log(entry);
    
    // Additional alert for critical errors
    if (requiresAdminAlert(errorCode)) {
      this.alert(errorCode, metadata);
    }
  }
  
  /**
   * Log alert (for critical issues requiring immediate attention)
   */
  alert(errorCode: LobErrorCode, metadata?: Record<string, any>): void {
    const errorDef = getLobError(errorCode);
    
    this.critical(`🚨 ALERT: ${errorDef.message}`, {
      errorCode,
      ...metadata,
      action: errorDef.action,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Integrate with alerting service (PagerDuty, Slack, etc.)
    // In production, this should send actual alerts
  }
  
  /**
   * Log retry attempt
   */
  retryAttempt(operation: string, attempt: number, maxAttempts: number, metadata?: Record<string, any>): void {
    this.warn(`🔄 Retry attempt ${attempt}/${maxAttempts} for ${operation}`, metadata);
  }
  
  /**
   * Log circuit breaker state change
   */
  circuitBreakerStateChange(newState: string, metadata?: Record<string, any>): void {
    const emoji = newState === 'OPEN' ? '🔴' : newState === 'HALF_OPEN' ? '🟡' : '🟢';
    this.warn(`${emoji} Circuit breaker state changed to ${newState}`, metadata);
  }
  
  /**
   * Log rate limit hit
   */
  rateLimitHit(operation: string, metadata?: Record<string, any>): void {
    this.warn(`🚫 Rate limit hit for ${operation}`, metadata);
  }
  
  /**
   * Log duplicate submission attempt
   */
  duplicateSubmissionAttempt(mailPieceId: string, existingLobId: string, metadata?: Record<string, any>): void {
    this.alert('DUPLICATE_SUBMISSION_ATTEMPTED', {
      mailPieceId,
      existingLobId,
      ...metadata,
    });
  }
  
  /**
   * Log webhook event
   */
  webhookEvent(eventType: string, metadata?: Record<string, any>): void {
    this.info(`📡 Webhook event received: ${eventType}`, metadata);
  }
  
  /**
   * Log payment verification
   */
  paymentVerification(mailPieceId: string, result: 'verified' | 'pending' | 'failed', metadata?: Record<string, any>): void {
    const emoji = result === 'verified' ? '✅' : result === 'pending' ? '⏳' : '❌';
    this.info(`${emoji} Payment verification: ${mailPieceId} - ${result}`, metadata);
  }
  
  /**
   * Log non-critical error (doesn't break main flow)
   */
  nonCriticalError(context: string, error: unknown, metadata?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.warn(`[NON_CRITICAL] ${context}`, {
      error: errorMessage,
      stack: errorStack,
      ...metadata,
    });
  }
  
  /**
   * Log performance metric
   */
  metric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    if (LOB_MONITORING_CONFIG.metricsEnabled) {
      this.debug(`📊 Metric: ${name}`, {
        value,
        unit,
        ...metadata,
      });
    }
  }
}

/**
 * Create a logger for a specific context
 */
export function createLobLogger(context: string): LobLogger {
  return new LobLogger(context);
}

/**
 * Default logger for general Lob operations
 */
export const lobLogger = createLobLogger('LOB');

/**
 * Helper function to time an operation
 */
export async function timeOperation<T>(
  logger: LobLogger,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  logger.operationStart(operation, metadata);
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.operationSuccess(operation, duration, metadata);
    logger.metric(`${operation}_duration`, duration, 'ms');
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.operationFailure(operation, error, { ...metadata, durationMs: duration });
    throw error;
  }
}


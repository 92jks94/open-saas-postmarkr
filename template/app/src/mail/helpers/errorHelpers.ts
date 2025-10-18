/**
 * Centralized Error Handling for Lob Operations
 * 
 * Provides standardized error handling across all Lob-related operations.
 * Uses the error catalog and structured logging for consistency.
 */

import { HttpError } from 'wasp/server';
import { 
  getLobError, 
  mapLobApiErrorToErrorCode, 
  mapHttpStatusToErrorCode, 
  type LobErrorCode 
} from '../../server/lob/errors';
import { createLobLogger } from '../../server/lob/logger';

const logger = createLobLogger('ErrorHandler');

/**
 * Centralized error handler for Lob-related operations
 * Converts all errors to standardized HttpError with proper codes and messages
 * 
 * @param error - The error to handle
 * @param context - Operation context for logging
 * @throws {HttpError} Always throws with standardized error message
 */
export function handleLobOperationError(error: unknown, context?: string): never {
  // Already an HttpError - rethrow as-is
  if (error instanceof HttpError) {
    throw error;
  }

  // Handle Lob API errors
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as any).message || String(error);
    const statusCode = (error as any).status || (error as any).statusCode;
    
    // Map to error code
    let errorCode: LobErrorCode;
    if (statusCode) {
      errorCode = mapHttpStatusToErrorCode(statusCode);
    } else {
      errorCode = mapLobApiErrorToErrorCode(errorMessage);
    }
    
    const errorDef = getLobError(errorCode);
    
    // Log with context
    logger.apiError(errorCode, {
      originalError: errorMessage,
      context,
      statusCode,
    });
    
    throw new HttpError(errorDef.httpStatus, errorDef.userMessage);
  }

  // Unknown error
  logger.error('Unknown error in Lob operation', {
    error: String(error),
    context,
  });
  
  const errorDef = getLobError('INTERNAL_ERROR');
  throw new HttpError(errorDef.httpStatus, errorDef.userMessage);
}

/**
 * Wrap operation with standardized error handling
 * Usage: return await withErrorHandling(() => myOperation(), 'OperationName');
 * 
 * @param operation - The async operation to execute
 * @param operationName - Name for logging context
 * @returns Result of the operation
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleLobOperationError(error, operationName);
  }
}

/**
 * Handle database errors with standardized messages
 * 
 * @param error - The database error
 * @param context - Operation context for logging
 * @throws {HttpError} Always throws with standardized error message
 */
export function handleDatabaseError(error: unknown, context?: string): never {
  logger.error('Database error', {
    error: error instanceof Error ? error.message : String(error),
    context,
  });
  
  const errorDef = getLobError('DATABASE_ERROR');
  throw new HttpError(errorDef.httpStatus, errorDef.userMessage);
}

/**
 * Handle validation errors with standardized messages
 * 
 * @param error - The validation error (typically Zod error)
 * @param context - Operation context for logging
 * @throws {HttpError} Always throws with standardized error message
 */
export function handleValidationError(error: unknown, context?: string): never {
  // Zod errors
  if (error instanceof Error && error.name === 'ZodError') {
    logger.warn('Validation error', {
      error: error.message,
      context,
    });
    
    const errorDef = getLobError('VALIDATION_ERROR');
    throw new HttpError(errorDef.httpStatus, `${errorDef.userMessage}: ${error.message}`);
  }
  
  // Generic validation error
  logger.warn('Validation error', {
    error: error instanceof Error ? error.message : String(error),
    context,
  });
  
  const errorDef = getLobError('VALIDATION_ERROR');
  throw new HttpError(errorDef.httpStatus, errorDef.userMessage);
}

/**
 * Universal error handler that routes to appropriate handler
 * Simplifies error handling to a single call
 * 
 * @param error - Any error type
 * @param context - Operation context for logging
 * @throws {HttpError} Always throws with standardized error message
 */
export function handleError(error: unknown, context?: string): never {
  // HttpError - rethrow
  if (error instanceof HttpError) {
    throw error;
  }
  
  // Zod validation error
  if (error instanceof Error && error.name === 'ZodError') {
    handleValidationError(error, context);
  }
  
  // Prisma/Database error
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    // Prisma error codes start with 'P'
    if (prismaError.code && typeof prismaError.code === 'string' && prismaError.code.startsWith('P')) {
      handleDatabaseError(error, context);
    }
  }
  
  // Default to Lob operation error handler
  handleLobOperationError(error, context);
}


/**
 * Global Error Handler for Chrome Extension Issues
 * 
 * This module handles Chrome extension related errors that can occur
 * in production environments and prevents them from affecting the user experience.
 */

// Declare Chrome extension types for TypeScript
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        onError?: {
          addListener: (callback: (error: { message: string }) => void) => void;
        };
      };
    };
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorMessage = error?.message || error?.toString() || '';
  
  // Check if this is a Chrome extension related error
  if (errorMessage.includes('Chrome API') || 
      errorMessage.includes('message port closed') ||
      errorMessage.includes('runtime.lastError') ||
      errorMessage.includes('listener indicated an asynchronous response')) {
    
    // Suppress Chrome extension errors
    console.debug('Suppressed Chrome extension error:', errorMessage);
    event.preventDefault(); // Prevent the error from being logged to console
    return;
  }
  
  // Log other errors normally
  console.error('Unhandled promise rejection:', error);
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  const error = event.error;
  const errorMessage = error?.message || event.message || '';
  
  // Check if this is a Chrome extension related error
  if (errorMessage.includes('Chrome API') || 
      errorMessage.includes('message port closed') ||
      errorMessage.includes('runtime.lastError') ||
      errorMessage.includes('listener indicated an asynchronous response')) {
    
    // Suppress Chrome extension errors
    console.debug('Suppressed Chrome extension error:', errorMessage);
    event.preventDefault(); // Prevent the error from being logged to console
    return;
  }
  
  // Log other errors normally
  console.error('JavaScript error:', error);
});

// Handle Chrome extension specific errors
if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
  // Suppress Chrome extension errors
  const originalOnError = window.chrome.runtime.onError;
  if (originalOnError) {
    originalOnError.addListener((error) => {
      console.debug('Suppressed Chrome runtime error:', error.message);
      // Don't propagate the error
    });
  }
}

export {}; // Make this a module

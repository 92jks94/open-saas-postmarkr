/**
 * React Initialization Fix
 * 
 * This ensures React's internal APIs are properly initialized
 * before any components try to use them.
 */

import React from 'react';
import ReactDOM from 'react-dom';

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Ensure React internals are properly initialized
  const reactInternals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  
  if (reactInternals && !reactInternals.ReactCurrentBatchConfig) {
    reactInternals.ReactCurrentBatchConfig = {
      transition: null,
    };
  }
  
  // Also check for ReactDOM internals
  const reactDOMInternals = (ReactDOM as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  
  if (reactDOMInternals && !reactDOMInternals.ReactCurrentBatchConfig) {
    reactDOMInternals.ReactCurrentBatchConfig = {
      transition: null,
    };
  }
}

export {};

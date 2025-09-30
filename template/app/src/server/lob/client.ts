import Lob from 'lob';
import { getEnvVar } from '../envValidation';

// Get the appropriate Lob API key based on environment
function getLobApiKey(): string | null {
  try {
    const environment = getEnvVar('LOB_ENVIRONMENT', 'test');
    
    if (environment === 'live' || environment === 'prod') {
      try {
        const key = getEnvVar('LOB_PROD_KEY');
        console.log('🔑 Using Lob production API key');
        return key || null;
      } catch {
        console.warn('⚠️ Lob production key not found, falling back to test key');
        try {
          const testKey = getEnvVar('LOB_TEST_KEY');
          return testKey || null;
        } catch {
          return null;
        }
      }
    } else {
      try {
        const key = getEnvVar('LOB_TEST_KEY');
        console.log('🔑 Using Lob test API key');
        return key || null;
      } catch {
        console.warn('⚠️ Lob test key not found');
        return null;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error getting Lob environment configuration:', error);
    return null;
  }
}

// Initialize Lob client only if API key is available
const lobApiKey = getLobApiKey();
export const lob = lobApiKey ? new Lob(lobApiKey) : null;

// Log initialization status
if (lob) {
  console.log('✅ Lob client initialized successfully');
} else {
  console.warn('⚠️ Lob client not initialized - API key missing or invalid');
}

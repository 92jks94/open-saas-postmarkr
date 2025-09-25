import Lob from 'lob';
import { getEnvVar } from '../envValidation';

// Get the appropriate Lob API key based on environment
function getLobApiKey(): string | null {
  const environment = getEnvVar('LOB_ENVIRONMENT', 'test');
  
  if (environment === 'live' || environment === 'prod') {
    try {
      const key = getEnvVar('LOB_PROD_KEY');
      return key || null;
    } catch {
      return null;
    }
  } else {
    try {
      const key = getEnvVar('LOB_TEST_KEY');
      return key || null;
    } catch {
      return null;
    }
  }
}

// Initialize Lob client only if API key is available
const lobApiKey = getLobApiKey();
export const lob = lobApiKey ? new Lob(lobApiKey) : null;

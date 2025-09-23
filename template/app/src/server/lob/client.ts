import Lob from 'lob';
import { requireNodeEnvVar } from '../utils';

// Get the appropriate Lob API key based on environment
function getLobApiKey(): string {
  const environment = process.env.LOB_ENVIRONMENT || 'test';
  
  if (environment === 'live' || environment === 'prod') {
    return requireNodeEnvVar('LOB_PROD_KEY');
  } else {
    return requireNodeEnvVar('LOB_TEST_KEY');
  }
}

export const lob = new Lob(getLobApiKey());

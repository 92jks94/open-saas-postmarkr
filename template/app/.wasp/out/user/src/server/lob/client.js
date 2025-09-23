import Lob from 'lob';
// Get the appropriate Lob API key based on environment
function getLobApiKey() {
    const environment = process.env.LOB_ENVIRONMENT || 'test';
    if (environment === 'live' || environment === 'prod') {
        return process.env.LOB_PROD_KEY || null;
    }
    else {
        return process.env.LOB_TEST_KEY || null;
    }
}
// Initialize Lob client only if API key is available
const lobApiKey = getLobApiKey();
export const lob = lobApiKey ? new Lob(lobApiKey) : null;

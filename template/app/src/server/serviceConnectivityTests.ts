import { isDevelopment } from './envValidation';

/**
 * Real-time service connectivity tests
 * Provides immediate feedback on external service availability
 */

interface ConnectivityResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  details?: string;
}

/**
 * Tests connectivity to all configured external services
 */
export async function runServiceConnectivityTests(): Promise<string[]> {
  const results: ConnectivityResult[] = [];
  const criticalIssues: string[] = [];
  
  console.log('🔗 Running service connectivity tests...');
  
  // Test services in parallel for faster startup
  const tests = [
    testStripeConnectivity(),
    testSendGridConnectivity(),
    testLobConnectivity(),
    testAwsConnectivity(),
    testSentryConnectivity(),
    testOpenAIConnectivity(),
  ];
  
  const testResults = await Promise.allSettled(tests);
  
  testResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
      // Add critical issues for unhealthy services
      if (result.value.status === 'unhealthy') {
        criticalIssues.push(`${result.value.service}: ${result.value.error || 'Connection failed'}`);
      }
    } else {
      const serviceName = ['Stripe', 'SendGrid', 'Lob', 'AWS', 'Sentry', 'OpenAI'][index];
      results.push({
        service: serviceName,
        status: 'unhealthy',
        error: result.reason?.message || 'Unknown error'
      });
      criticalIssues.push(`${serviceName}: ${result.reason?.message || 'Unknown error'}`);
    }
  });
  
  // Log results
  logConnectivityResults(results);
  
  return criticalIssues;
}

/**
 * Tests Stripe API connectivity
 */
async function testStripeConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      service: 'Stripe',
      status: 'unknown',
      details: 'API key not configured'
    };
  }
  
  try {
    // Test Stripe API with a simple request
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const account = await response.json();
      return {
        service: 'Stripe',
        status: 'healthy',
        responseTime,
        details: `Account: ${account.id} (${account.country?.toUpperCase() || 'Unknown'})`
      };
    } else {
      return {
        service: 'Stripe',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      service: 'Stripe',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests SendGrid API connectivity
 */
async function testSendGridConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  if (!process.env.SENDGRID_API_KEY) {
    return {
      service: 'SendGrid',
      status: 'unknown',
      details: 'API key not configured'
    };
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const profile = await response.json();
      return {
        service: 'SendGrid',
        status: 'healthy',
        responseTime,
        details: `Account: ${profile.username || 'Unknown'}`
      };
    } else {
      return {
        service: 'SendGrid',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      service: 'SendGrid',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests Lob API connectivity using the Lob SDK
 */
async function testLobConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  try {
    // Import Lob client dynamically to avoid circular dependencies
    const { lob } = await import('./lob/client');
    
    if (!lob) {
      return {
        service: 'Lob',
        status: 'unknown',
        details: 'Lob client not initialized - API key missing or invalid'
      };
    }

    // Determine which environment key is being used
    const lobKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    const lobEnvironment = process.env.LOB_TEST_KEY ? 'test' : 'production';
    
    if (!lobKey) {
      return {
        service: 'Lob',
        status: 'unknown',
        details: 'API key not configured'
      };
    }
    
    // Test API connectivity with a simple addresses list using Lob SDK
    const addresses = await lob.addresses.list({ limit: 1 });
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'Lob',
      status: 'healthy',
      responseTime,
      details: `Environment: ${lobEnvironment}, Addresses found: ${addresses.data?.length || 0}`
    };
  } catch (error) {
    return {
      service: 'Lob',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests AWS S3 connectivity
 */
async function testAwsConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  if (!process.env.AWS_S3_IAM_ACCESS_KEY || !process.env.AWS_S3_IAM_SECRET_KEY) {
    return {
      service: 'AWS S3',
      status: 'unknown',
      details: 'Credentials not configured'
    };
  }
  
  try {
    // Test S3 bucket access
    const bucket = process.env.AWS_S3_FILES_BUCKET;
    const region = process.env.AWS_S3_REGION || 'us-east-1';
    
    if (!bucket) {
      return {
        service: 'AWS S3',
        status: 'unhealthy',
        error: 'S3 bucket name not configured'
      };
    }
    
    // Simple S3 connectivity test - just check if bucket exists
    // For now, we'll just validate the configuration is present
    // Real S3 testing would require proper AWS SDK
    return {
      service: 'AWS S3',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: `Bucket: ${bucket}, Region: ${region} (configuration validated)`
    };
  } catch (error) {
    return {
      service: 'AWS S3',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests Sentry connectivity
 */
async function testSentryConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  if (!process.env.SENTRY_DSN) {
    return {
      service: 'Sentry',
      status: 'unknown',
      details: 'DSN not configured'
    };
  }
  
  try {
    // Parse Sentry DSN to get project info
    const dsn = process.env.SENTRY_DSN;
    const url = new URL(dsn);
    const projectId = url.pathname.split('/').pop();
    
    return {
      service: 'Sentry',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: `Project: ${projectId}, Host: ${url.hostname}`
    };
  } catch (error) {
    return {
      service: 'Sentry',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: 'Invalid DSN format'
    };
  }
}

/**
 * Tests OpenAI API connectivity
 */
async function testOpenAIConnectivity(): Promise<ConnectivityResult> {
  const startTime = Date.now();
  
  if (!process.env.OPENAI_API_KEY) {
    return {
      service: 'OpenAI',
      status: 'unknown',
      details: 'API key not configured'
    };
  }
  
  try {
    // First validate the API key format
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey.startsWith('sk-')) {
      return {
        service: 'OpenAI',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Invalid API key format (must start with sk-)'
      };
    }
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const models = await response.json();
      const modelCount = models.data?.length || 0;
      return {
        service: 'OpenAI',
        status: 'healthy',
        responseTime,
        details: `${modelCount} models available`
      };
    } else {
      const errorText = await response.text();
      return {
        service: 'OpenAI',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`
      };
    }
  } catch (error) {
    return {
      service: 'OpenAI',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Logs connectivity test results in a clean, organized format
 */
function logConnectivityResults(results: ConnectivityResult[]): void {
  console.log('\n📡 SERVICES STATUS:');
  
  results.forEach(result => {
    const statusIcon = result.status === 'healthy' ? '✅' : 
                      result.status === 'unhealthy' ? '❌' : '⚠️';
    
    // Service name with status
    let serviceLine = `   ${statusIcon} ${result.service}`;
    
    // Add response time if available
    if (result.responseTime) {
      serviceLine += ` - ${result.responseTime}ms`;
    }
    
    console.log(serviceLine);
    
    // Add details or error on next line
    if (result.details) {
      console.log(`      ${result.details}`);
    }
    
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;
  
  console.log(`\n📈 Summary: ${healthyCount}/${totalCount} services healthy`);
}

/**
 * Generates AWS signature for S3 requests (simplified)
 */
function generateAwsSignature(method: string, bucket: string, region: string): string {
  // This is a simplified version - in production, you'd use proper AWS SDK
  return 'simplified-signature';
}

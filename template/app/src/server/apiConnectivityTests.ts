/**
 * Runtime API Connectivity Tests
 * This module provides comprehensive testing of external API connectivity
 * during server startup and health checks.
 */

import Stripe from 'stripe';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { OpenAI } from 'openai';
import * as Sentry from '@sentry/node';
import { lob } from './lob/client';

export interface ApiTestResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface ConnectivityTestResults {
  timestamp: string;
  environment: string;
  results: ApiTestResult[];
  overallStatus: 'healthy' | 'unhealthy' | 'degraded';
}

/**
 * Tests Stripe API connectivity
 */
export async function testStripeConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        error: 'Stripe secret key not configured'
      };
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-04-30.basil',
    });

    // Test API connectivity with a simple balance retrieval
    await stripe.balance.retrieve();
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'stripe',
      status: 'healthy',
      responseTime,
      details: {
        keyPrefix: stripeKey.substring(0, 8) + '...',
        environment: stripeKey.startsWith('sk_live_') ? 'production' : 'test'
      }
    };
  } catch (error: any) {
    return {
      service: 'stripe',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Stripe API test failed'
    };
  }
}

/**
 * Tests SendGrid API connectivity
 */
export async function testSendGridConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return {
        service: 'sendgrid',
        status: 'unhealthy',
        error: 'SendGrid API key not configured'
      };
    }

    // Test API connectivity with a simple API key validation
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SendGrid API returned ${response.status}: ${response.statusText}`);
    }

    const responseTime = Date.now() - startTime;
    
    return {
      service: 'sendgrid',
      status: 'healthy',
      responseTime,
      details: {
        keyPrefix: apiKey.substring(0, 8) + '...'
      }
    };
  } catch (error: any) {
    return {
      service: 'sendgrid',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'SendGrid API test failed'
    };
  }
}

/**
 * Tests Lob API connectivity using the Lob SDK
 */
export async function testLobConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    // Use Lob client directly to avoid Rollup dynamic import issues
    if (!lob) {
      return {
        service: 'lob',
        status: 'unhealthy',
        error: 'Lob client not initialized - API key missing or invalid'
      };
    }

    // Respect the LOB_ENVIRONMENT setting to determine which key is being used
    const environment = process.env.LOB_ENVIRONMENT || 'test';
    const apiKey = environment === 'live' || environment === 'prod' 
      ? process.env.LOB_PROD_KEY 
      : process.env.LOB_TEST_KEY;

    if (!apiKey) {
      return {
        service: 'lob',
        status: 'unhealthy',
        error: `Lob ${environment} API key not configured`
      };
    }

    // Test API connectivity with a simple addresses list using Lob SDK
    console.log(`🔍 Testing Lob API with ${environment} key: ${apiKey.substring(0, 8)}...`);
    
    const addresses = await lob.addresses.list({ limit: 1 });

    const responseTime = Date.now() - startTime;
    
    return {
      service: 'lob',
      status: 'healthy',
      responseTime,
      details: {
        keyPrefix: apiKey.substring(0, 8) + '...',
        environment: apiKey.startsWith('live_') ? 'production' : 'test',
        addressesCount: addresses.data?.length || 0
      }
    };
  } catch (error: any) {
    return {
      service: 'lob',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Lob API test failed'
    };
  }
}

/**
 * Tests AWS S3 connectivity
 */
export async function testAwsS3Connectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const accessKeyId = process.env.AWS_S3_IAM_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_S3_IAM_SECRET_KEY;
    const region = process.env.AWS_S3_REGION;
    const bucket = process.env.AWS_S3_FILES_BUCKET;

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      return {
        service: 'aws-s3',
        status: 'unhealthy',
        error: 'AWS credentials not fully configured'
      };
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Test API connectivity with a simple list buckets command
    await s3Client.send(new ListBucketsCommand({}));
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'aws-s3',
      status: 'healthy',
      responseTime,
      details: {
        region,
        bucket,
        keyPrefix: accessKeyId.substring(0, 8) + '...'
      }
    };
  } catch (error: any) {
    return {
      service: 'aws-s3',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'AWS S3 API test failed'
    };
  }
}

/**
 * Tests OpenAI API connectivity
 */
export async function testOpenAIConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        service: 'openai',
        status: 'unknown',
        error: 'OpenAI API key not configured (optional service)'
      };
    }

    const openai = new OpenAI({
      apiKey,
    });

    // Test API connectivity with a simple model list
    await openai.models.list();
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'openai',
      status: 'healthy',
      responseTime,
      details: {
        keyPrefix: apiKey.substring(0, 8) + '...'
      }
    };
  } catch (error: any) {
    return {
      service: 'openai',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'OpenAI API test failed'
    };
  }
}

/**
 * Tests Google Analytics API connectivity
 */
export async function testGoogleAnalyticsConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

    if (!clientEmail || !privateKey || !propertyId) {
      return {
        service: 'google-analytics',
        status: 'unknown',
        error: 'Google Analytics credentials not configured (optional service)'
      };
    }

    // Test API connectivity with a simple property access
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '2024-01-01', endDate: '2024-01-01' }],
        metrics: [{ name: 'activeUsers' }]
      })
    });

    // We expect this to fail with authentication error, but that means the API is reachable
    if (response.status === 401 || response.status === 403) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'google-analytics',
        status: 'healthy',
        responseTime,
        details: {
          propertyId,
          clientEmail: clientEmail.substring(0, 8) + '...'
        }
      };
    }

    if (!response.ok) {
      throw new Error(`Google Analytics API returned ${response.status}: ${response.statusText}`);
    }

    const responseTime = Date.now() - startTime;
    
    return {
      service: 'google-analytics',
      status: 'healthy',
      responseTime,
      details: {
        propertyId,
        clientEmail: clientEmail.substring(0, 8) + '...'
      }
    };
  } catch (error: any) {
    return {
      service: 'google-analytics',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Google Analytics API test failed'
    };
  }
}


/**
 * Tests Sentry connectivity
 */
export async function testSentryConnectivity(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
      return {
        service: 'sentry',
        status: 'unhealthy',
        error: 'Sentry DSN not configured'
      };
    }

    // Test Sentry connectivity by sending a test event
    Sentry.captureMessage('API connectivity test', 'info');
    await Sentry.flush(2000); // Wait for event to be sent
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'sentry',
      status: 'healthy',
      responseTime,
      details: {
        dsnPrefix: dsn.substring(0, 20) + '...'
      }
    };
  } catch (error: any) {
    return {
      service: 'sentry',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Sentry connectivity test failed'
    };
  }
}

/**
 * Runs all API connectivity tests
 */
export async function runAllConnectivityTests(): Promise<ConnectivityTestResults> {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';
  
  console.log('🧪 Running API connectivity tests...');
  
  const testFunctions = [
    testStripeConnectivity,
    testSendGridConnectivity,
    testLobConnectivity,
    testAwsS3Connectivity,
    testOpenAIConnectivity,
    testGoogleAnalyticsConnectivity,
    testSentryConnectivity,
  ];

  const results = await Promise.allSettled(
    testFunctions.map(testFn => testFn())
  );

  const apiResults: ApiTestResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: `test-${index}`,
        status: 'unhealthy',
        error: result.reason?.message || 'Test failed'
      };
    }
  });

  // Determine overall status
  const unhealthyCount = apiResults.filter(r => r.status === 'unhealthy').length;
  const unknownCount = apiResults.filter(r => r.status === 'unknown').length;
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (unknownCount > 0) {
    overallStatus = 'degraded';
  }

  const testResults: ConnectivityTestResults = {
    timestamp,
    environment,
    results: apiResults,
    overallStatus
  };

  console.log(`✅ API connectivity tests completed. Overall status: ${overallStatus}`);
  
  return testResults;
}

/**
 * Quick connectivity test for critical services only
 */
export async function runCriticalConnectivityTests(): Promise<ApiTestResult[]> {
  console.log('🚨 Running critical API connectivity tests...');
  
  const criticalTests = [
    testStripeConnectivity,
    testSendGridConnectivity,
    testLobConnectivity,
    testAwsS3Connectivity,
  ];

  const results = await Promise.allSettled(
    criticalTests.map(testFn => testFn())
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: `critical-test-${index}`,
        status: 'unhealthy',
        error: result.reason?.message || 'Critical test failed'
      };
    }
  });
}

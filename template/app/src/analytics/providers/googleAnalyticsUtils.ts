import { BetaAnalyticsDataClient } from '@google-analytics/data';

console.log('📊 Google Analytics Utils - Module Loading');
console.log('⏱️  Timestamp:', new Date().toISOString());

const CLIENT_EMAIL = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
const PRIVATE_KEY_RAW = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

console.log('🔍 Environment variables check:');
console.log('   CLIENT_EMAIL present?', !!CLIENT_EMAIL);
console.log('   CLIENT_EMAIL value:', CLIENT_EMAIL ? `${CLIENT_EMAIL.substring(0, 20)}...` : 'NOT SET');
console.log('   PRIVATE_KEY_RAW present?', !!PRIVATE_KEY_RAW);
console.log('   PRIVATE_KEY_RAW length:', PRIVATE_KEY_RAW ? PRIVATE_KEY_RAW.length : 0);
console.log('   PROPERTY_ID present?', !!PROPERTY_ID);
console.log('   PROPERTY_ID value:', PROPERTY_ID || 'NOT SET');

let PRIVATE_KEY: string | undefined;
if (PRIVATE_KEY_RAW) {
  try {
    console.log('🔐 Decoding base64 private key...');
    PRIVATE_KEY = Buffer.from(PRIVATE_KEY_RAW, 'base64').toString('utf-8');
    console.log('✅ Private key decoded successfully');
    console.log('   Decoded key length:', PRIVATE_KEY.length);
    console.log('   Key starts with:', PRIVATE_KEY.substring(0, 27)); // "-----BEGIN PRIVATE KEY-----"
    console.log('   Key ends with:', PRIVATE_KEY.substring(PRIVATE_KEY.length - 25)); // "-----END PRIVATE KEY-----"
    
    // Validate key format
    if (!PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ Invalid private key format - missing BEGIN PRIVATE KEY header');
    }
    if (!PRIVATE_KEY.includes('END PRIVATE KEY')) {
      console.error('❌ Invalid private key format - missing END PRIVATE KEY footer');
    }
  } catch (error) {
    console.error('❌ Failed to decode private key from base64');
    console.error('🔍 Error:', error);
    PRIVATE_KEY = undefined;
  }
} else {
  console.warn('⚠️  PRIVATE_KEY_RAW not set');
}

// Only initialize the client if all required environment variables are present
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

if (CLIENT_EMAIL && PRIVATE_KEY && PROPERTY_ID) {
  try {
    console.log('🚀 Initializing Google Analytics Data Client...');
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      },
    });
    console.log('✅ Google Analytics Data Client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics Data Client');
    console.error('🔍 Error:', error);
    console.error('📚 Stack:', error instanceof Error ? error.stack : 'No stack trace');
    analyticsDataClient = null;
  }
} else {
  console.warn('⚠️  Google Analytics Data Client NOT initialized - missing required environment variables');
  console.log('   Missing:', [
    !CLIENT_EMAIL && 'CLIENT_EMAIL',
    !PRIVATE_KEY && 'PRIVATE_KEY',
    !PROPERTY_ID && 'PROPERTY_ID'
  ].filter(Boolean).join(', '));
}

export async function getSources() {
  console.log('📊 GA API: getSources() called');
  console.log('⏱️  Timestamp:', new Date().toISOString());
  
  if (!analyticsDataClient) {
    console.error('❌ GA API: Client not initialized');
    console.error('💡 Missing env vars:', [
      !CLIENT_EMAIL && 'GOOGLE_ANALYTICS_CLIENT_EMAIL',
      !PRIVATE_KEY && 'GOOGLE_ANALYTICS_PRIVATE_KEY',
      !PROPERTY_ID && 'GOOGLE_ANALYTICS_PROPERTY_ID'
    ].filter(Boolean).join(', '));
    throw new Error('Google Analytics is not configured. Please set GOOGLE_ANALYTICS_CLIENT_EMAIL, GOOGLE_ANALYTICS_PRIVATE_KEY, and GOOGLE_ANALYTICS_PROPERTY_ID environment variables.');
  }
  
  try {
    console.log('🔍 GA API: Requesting sources data...');
    console.log('   Property:', `properties/${PROPERTY_ID}`);
    console.log('   Date range: 2020-01-01 to today');
    
    const startTime = Date.now();
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2020-01-01',
          endDate: 'today',
        },
      ],
      // for a list of dimensions and metrics see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
      dimensions: [
        {
          name: 'source',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ GA API: Response received (${duration}ms)`);
    console.log('   Row count:', response?.rows?.length || 0);
    console.log('   Response metadata:', response?.metadata);

    let activeUsersPerReferrer: any[] = [];
    if (response?.rows) {
      activeUsersPerReferrer = response.rows.map((row) => {
        if (row.dimensionValues && row.metricValues) {
          return {
            source: row.dimensionValues[0].value,
            visitors: row.metricValues[0].value,
          };
        }
      });
      console.log('✅ GA API: Processed sources:', activeUsersPerReferrer.length);
    } else {
      console.error('❌ GA API: No response rows from Google Analytics');
      console.error('   Full response:', JSON.stringify(response, null, 2));
      throw new Error('No response from Google Analytics');
    }

    return activeUsersPerReferrer;
  } catch (error) {
    console.error('❌ GA API: getSources() failed');
    console.error('🔍 Error:', error);
    console.error('📚 Stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error instanceof Error && 'code' in error) {
      console.error('🔍 Error code:', (error as any).code);
      console.error('🔍 Error details:', (error as any).details);
    }
    throw error;
  }
}

export async function getDailyPageViews() {
  const totalViews = await getTotalPageViews();
  const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();

  return {
    totalViews,
    prevDayViewsChangePercent,
  };
}

async function getTotalPageViews() {
  console.log('📊 GA API: getTotalPageViews() called');
  
  if (!analyticsDataClient) {
    console.error('❌ GA API: Client not initialized');
    throw new Error('Google Analytics is not configured. Please set GOOGLE_ANALYTICS_CLIENT_EMAIL, GOOGLE_ANALYTICS_PRIVATE_KEY, and GOOGLE_ANALYTICS_PROPERTY_ID environment variables.');
  }
  
  try {
    console.log('🔍 GA API: Requesting total page views...');
    console.log('   Property:', `properties/${PROPERTY_ID}`);
    
    const startTime = Date.now();
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2020-01-01', // go back to earliest date of your app
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ GA API: Total page views response received (${duration}ms)`);
    
    let totalViews = 0;
    if (response?.rows) {
      // @ts-ignore
      totalViews = parseInt(response.rows[0].metricValues[0].value);
      console.log('   Total views:', totalViews);
    } else {
      console.error('❌ GA API: No response rows');
      console.error('   Full response:', JSON.stringify(response, null, 2));
      throw new Error('No response from Google Analytics');
    }
    return totalViews;
  } catch (error) {
    console.error('❌ GA API: getTotalPageViews() failed');
    console.error('🔍 Error:', error);
    throw error;
  }
}

async function getPrevDayViewsChangePercent() {
  console.log('📊 GA API: getPrevDayViewsChangePercent() called');
  
  if (!analyticsDataClient) {
    console.error('❌ GA API: Client not initialized');
    throw new Error('Google Analytics is not configured. Please set GOOGLE_ANALYTICS_CLIENT_EMAIL, GOOGLE_ANALYTICS_PRIVATE_KEY, and GOOGLE_ANALYTICS_PROPERTY_ID environment variables.');
  }
  
  try {
    console.log('🔍 GA API: Requesting previous day views change...');
    
    const startTime = Date.now();
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,

      dateRanges: [
        {
          startDate: '2daysAgo',
          endDate: 'yesterday',
        },
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: true,
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ GA API: Previous day views response received (${duration}ms)`);
    console.log('   Row count:', response?.rows?.length || 0);

    let viewsFromYesterday;
    let viewsFromDayBeforeYesterday;

    if (response?.rows && response.rows.length === 2) {
      // @ts-ignore
      viewsFromYesterday = response.rows[0].metricValues[0].value;
      // @ts-ignore
      viewsFromDayBeforeYesterday = response.rows[1].metricValues[0].value;

      if (viewsFromYesterday && viewsFromDayBeforeYesterday) {
        viewsFromYesterday = parseInt(viewsFromYesterday);
        viewsFromDayBeforeYesterday = parseInt(viewsFromDayBeforeYesterday);
        
        console.log('   Yesterday views:', viewsFromYesterday);
        console.log('   Day before views:', viewsFromDayBeforeYesterday);
        
        if (viewsFromYesterday === 0 || viewsFromDayBeforeYesterday === 0) {
          console.log('   Change: 0% (zero values)');
          return '0';
        }
        console.table({ viewsFromYesterday, viewsFromDayBeforeYesterday });

        const change = ((viewsFromYesterday - viewsFromDayBeforeYesterday) / viewsFromDayBeforeYesterday) * 100;
        console.log(`   Change: ${change.toFixed(0)}%`);
        return change.toFixed(0);
      }
    } else {
      console.warn('⚠️  GA API: Unexpected response format or insufficient data');
      console.log('   Expected 2 rows, got:', response?.rows?.length || 0);
      return '0';
    }
  } catch (error) {
    console.error('❌ GA API: getPrevDayViewsChangePercent() failed');
    console.error('🔍 Error:', error);
    throw error;
  }
}

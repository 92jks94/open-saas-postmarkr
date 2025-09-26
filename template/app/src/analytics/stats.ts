import { type DailyStats } from 'wasp/entities';
import { type DailyStatsJob } from 'wasp/server/jobs';
import Stripe from 'stripe';
import { stripe } from '../payment/stripe/stripeClient';
import { getDailyPageViews, getSources } from './providers/googleAnalyticsUtils';
import { paymentProcessor } from '../payment/paymentProcessor';
import { SubscriptionStatus } from '../payment/plans';
import { 
  retryWithBackoff, 
  getCachedGAData, 
  setCachedGAData, 
  validateGAData, 
  calculateEnhancedSourceMetrics,
  cleanupExpiredCache 
} from './utils';

export type DailyStatsProps = { dailyStats?: DailyStats; weeklyStats?: DailyStats[]; isLoading?: boolean };

export const calculateDailyStats: DailyStatsJob<never, void> = async (_args, context) => {
  const nowUTC = new Date(Date.now());
  nowUTC.setUTCHours(0, 0, 0, 0);

  const yesterdayUTC = new Date(nowUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

  // Clean up expired cache entries
  cleanupExpiredCache();

  try {
    const yesterdaysStats = await context.entities.DailyStats.findFirst({
      where: {
        date: {
          equals: yesterdayUTC,
        },
      },
    });

    const userCount = await context.entities.User.count({});
    // users can have paid but canceled subscriptions which terminate at the end of the period
    // we don't want to count those users as current paying users
    const paidUserCount = await context.entities.User.count({
      where: {
        subscriptionStatus: SubscriptionStatus.Active,
      },
    });

    let userDelta = userCount;
    let paidUserDelta = paidUserCount;
    if (yesterdaysStats) {
      userDelta -= yesterdaysStats.userCount;
      paidUserDelta -= yesterdaysStats.paidUserCount;
    }

    const totalRevenue = await fetchTotalStripeRevenue();

    // Try to get cached Google Analytics data first
    let cachedData = getCachedGAData(nowUTC);
    let totalViews: number;
    let prevDayViewsChangePercent: string;
    let sources: Array<{ source: string; visitors: number }>;

    if (cachedData) {
      console.log('Using cached Google Analytics data');
      totalViews = cachedData.data.totalViews;
      prevDayViewsChangePercent = cachedData.data.prevDayViewsChangePercent;
      sources = cachedData.data.sources;
    } else {
      console.log('Fetching fresh Google Analytics data');
      try {
        // Fetch GA data with retry logic and error handling
        const gaData = await retryWithBackoff(async () => {
          const [pageViewsData, sourcesData] = await Promise.all([
            getDailyPageViews(),
            getSources()
          ]);
          
          return {
            totalViews: pageViewsData.totalViews,
            prevDayViewsChangePercent: pageViewsData.prevDayViewsChangePercent,
            sources: sourcesData
          };
        });

        // Validate the data
        const validation = validateGAData(gaData);
        if (!validation.isValid) {
          console.warn('Invalid Google Analytics data:', validation.errors);
          throw new Error(`Invalid GA data: ${validation.errors.join(', ')}`);
        }

        totalViews = gaData.totalViews;
        prevDayViewsChangePercent = gaData.prevDayViewsChangePercent || "0";
        sources = gaData.sources;

        // Cache the data for future use
        setCachedGAData(nowUTC, {
          totalViews,
          prevDayViewsChangePercent,
          sources
        });

      } catch (error) {
        console.error('Google Analytics API error:', error);
        
        // Fallback to previous day's data or default values
        if (yesterdaysStats) {
          totalViews = yesterdaysStats.totalViews;
          prevDayViewsChangePercent = yesterdaysStats.prevDayViewsChangePercent || "0";
          console.log('Using previous day\'s GA data as fallback');
        } else {
          totalViews = 0;
          prevDayViewsChangePercent = "0";
          console.log('Using default GA values as fallback');
        }
        
        // Get sources from previous day or use empty array
        const previousSources = await context.entities.PageViewSource.findMany({
          where: {
            date: yesterdayUTC,
          },
        });
        
        sources = previousSources.length > 0 
          ? previousSources.map(s => ({ source: s.name, visitors: s.visitors }))
          : [];
          
        console.log('Using previous day\'s sources data as fallback');
      }
    }

    let dailyStats = await context.entities.DailyStats.findUnique({
      where: {
        date: nowUTC,
      },
    });

    if (!dailyStats) {
      console.log('No daily stat found for today, creating one...');
      dailyStats = await context.entities.DailyStats.create({
        data: {
          date: nowUTC,
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue,
        },
      });
    } else {
      console.log('Daily stat found for today, updating it...');
      dailyStats = await context.entities.DailyStats.update({
        where: {
          id: dailyStats.id,
        },
        data: {
          totalViews,
          prevDayViewsChangePercent,
          userCount,
          paidUserCount,
          userDelta,
          paidUserDelta,
          totalRevenue,
        },
      });
    }

    // Calculate enhanced source metrics
    const enhancedSources = calculateEnhancedSourceMetrics(sources, totalRevenue, userCount);
    
    // Store enhanced source data
    for (const source of enhancedSources) {
      await context.entities.PageViewSource.upsert({
        where: {
          date_name: {
            date: nowUTC,
            name: source.source,
          },
        },
        create: {
          date: nowUTC,
          name: source.source,
          visitors: source.visitors,
          conversionRate: source.conversionRate,
          qualityScore: source.qualityScore,
          revenuePerVisitor: source.revenuePerVisitor,
          trendDirection: source.trendDirection,
          trendPercentage: source.trendPercentage,
          lastActivity: source.lastActivity,
          dailyStatsId: dailyStats.id,
        },
        update: {
          visitors: source.visitors,
          conversionRate: source.conversionRate,
          qualityScore: source.qualityScore,
          revenuePerVisitor: source.revenuePerVisitor,
          trendDirection: source.trendDirection,
          trendPercentage: source.trendPercentage,
          lastActivity: source.lastActivity,
        },
      });
    }

    // Log enhanced source metrics for monitoring
    console.log('Enhanced source metrics:', enhancedSources.map(s => ({
      source: s.source,
      visitors: s.visitors,
      conversionRate: `${s.conversionRate}%`,
      qualityScore: s.qualityScore,
      trend: s.trendDirection
    })));

    console.table({ dailyStats });
  } catch (error: unknown) {
    console.error('Error calculating daily stats: ', error);
    await context.entities.Logs.create({
      data: {
        message: `Error calculating daily stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: 'job-error',
      },
    });
  }
};

async function fetchTotalStripeRevenue() {
  let totalRevenue = 0;
  let params: Stripe.BalanceTransactionListParams = {
    limit: 100,
    // created: {
    //   gte: startTimestamp,
    //   lt: endTimestamp
    // },
    type: 'charge',
  };

  let hasMore = true;
  while (hasMore) {
    const balanceTransactions = await stripe.balanceTransactions.list(params);

    for (const transaction of balanceTransactions.data) {
      if (transaction.type === 'charge') {
        totalRevenue += transaction.amount;
      }
    }

    if (balanceTransactions.has_more) {
      // Set the starting point for the next iteration to the last object fetched
      params.starting_after = balanceTransactions.data[balanceTransactions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Revenue is in cents so we convert to dollars (or your main currency unit)
  return totalRevenue / 100;
}



import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@prisma/client';

/**
 * Time series data point interface
 */
interface TimeSeriesDataPoint {
  createdAt: Date;
  _count: number;
}

/**
 * Processed time series data interface
 */
interface ProcessedTimeSeries {
  dates: string[];
  values: number[];
}

/**
 * Dashboard API Route
 * 
 * Provides comprehensive real estate market analytics including:
 * - Basic metrics (total listings, average price, recent activity)
 * - Assumable mortgage analytics
 * - Price distribution analysis
 * - Weekly and Monthly trends
 * - Listing lifecycle metrics
 * 
 * @returns {Promise<NextResponse>} JSON response containing dashboard data
 * @throws {Error} If database queries fail
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch core metrics in parallel for better performance
    const [totalActive, avgPrice, recentMetrics, assumableMortgages, activeListings] = await Promise.all([
      // Total active listings count
      prisma.listing.count({
        where: { status: ListingStatus.ACTIVE }
      }),
      // Average price of active listings
      prisma.listing.aggregate({
        where: { status: ListingStatus.ACTIVE },
        _avg: { price: true }
      }),
      // New listings in last 30 days
      prisma.listing.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: ListingStatus.ACTIVE
        }
      }),
      // Assumable mortgage details for analytics
      prisma.assumableMortgage.findMany({
        select: {
          currentBalance: true,
          interestRate: true,
          createdAt: true,
          remainingTerm: true
        }
      }),
      // Active listing details for lifecycle analysis
      prisma.listing.findMany({
        where: { status: ListingStatus.ACTIVE },
        select: {
          createdAt: true,
          lastStatusChange: true,
          updatedAt: true,
          denormalizedAssumableLoanType: true
        }
      })
    ]);

    // Calculate average days on market with safeguards against invalid dates
    const now = new Date();
    const daysOnMarketList = activeListings.map(listing => {
      const startDate = listing.createdAt;
      let endDate = listing.lastStatusChange || now;
      // Prevent negative days on market due to data inconsistencies
      if (endDate < startDate) endDate = now;
      return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    });
    const averageDaysOnMarket = Math.round(
      daysOnMarketList.reduce((sum, days) => sum + days, 0) / daysOnMarketList.length
    );

    // Calculate listing update frequency (updates per day)
    const updateFrequencies = activeListings.map(listing => {
      const daysActive = Math.max(1, Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const updates = Math.floor((now.getTime() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      return updates / daysActive;
    });
    const averageUpdateFrequency = Math.round(
      updateFrequencies.reduce((sum, freq) => sum + freq, 0) / updateFrequencies.length
    );

    // Get top 3 loan type distribution for active listings
    const loanDistribution = await prisma.listing.groupBy({
      by: ['denormalizedAssumableLoanType'],
      where: { 
        status: ListingStatus.ACTIVE,
        denormalizedAssumableLoanType: { not: null }
      },
      _count: {
        denormalizedAssumableLoanType: true
      },
      orderBy: {
        _count: {
          denormalizedAssumableLoanType: 'desc'
        }
      },
      take: 3
    });

    // Define price ranges for distribution analysis
    const priceRanges = [
      { min: 0, max: 250000, label: '0-250k' },
      { min: 250000, max: 500000, label: '250k-500k' },
      { min: 500000, max: 750000, label: '500k-750k' },
      { min: 750000, max: 1000000, label: '750k-1M' },
      { min: 1000000, max: null, label: '1M+' }
    ];

    // Count listings in each price range
    const priceDistributionPromises = priceRanges.map(range => 
      prisma.listing.count({
        where: {
          status: ListingStatus.ACTIVE,
          price: {
            gte: range.min,
            ...(range.max ? { lt: range.max } : {})
          }
        }
      })
    );

    // Get time series data for trend analysis
    const timeSeriesPromises = {
      weekly: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      }),
      monthly: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })
    };

    // Get overall status distribution
    const statusDistribution = await prisma.listing.groupBy({
      by: ['status'],
      _count: true
    });

    // Execute all remaining promises in parallel
    const [
      priceDistributionCounts,
      timeSeries
    ] = await Promise.all([
      Promise.all(priceDistributionPromises),
      Promise.all([timeSeriesPromises.weekly, timeSeriesPromises.monthly])
    ]);

    /**
     * Process time series data into grouped intervals
     * @param {TimeSeriesDataPoint[] | undefined} data - Raw time series data
     * @param {'weekly'|'monthly'} interval - Grouping interval
     * @returns {ProcessedTimeSeries} Processed data with dates and values
     */
    const processTimeSeries = (data: TimeSeriesDataPoint[] | undefined, interval: 'weekly' | 'monthly'): ProcessedTimeSeries => {
      if (!data || data.length === 0) {
        return { dates: [], values: [] };
      }

      const groupedData = new Map<string, number>();
      
      data.forEach(item => {
        const date = new Date(item.createdAt);
        let key: string;
        
        if (interval === 'weekly') {
          // Group by week starting Sunday
          const day = date.getDay();
          const diff = date.getDate() - day;
          const startOfWeek = new Date(date.setDate(diff));
          key = startOfWeek.toISOString().split('T')[0];
        } else {
          // Group by month
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const currentCount = groupedData.get(key) || 0;
        groupedData.set(key, currentCount + item._count);
      });

      // Sort entries chronologically
      const sortedEntries = Array.from(groupedData.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      return {
        dates: sortedEntries.map(([date]) => date),
        values: sortedEntries.map(([, count]) => count)
      };
    };

    // Calculate mortgage age distribution in 5-year intervals
    const mortgageAgeDistribution = {
      '0-5 years': 0,
      '5-10 years': 0,
      '10-15 years': 0,
      '15-20 years': 0,
      '20+ years': 0
    };

    assumableMortgages.forEach(mortgage => {
      const age = (now.getTime() - mortgage.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age <= 5) mortgageAgeDistribution['0-5 years']++;
      else if (age <= 10) mortgageAgeDistribution['5-10 years']++;
      else if (age <= 15) mortgageAgeDistribution['10-15 years']++;
      else if (age <= 20) mortgageAgeDistribution['15-20 years']++;
      else mortgageAgeDistribution['20+ years']++;
    });

    // Calculate mortgage balance distribution
    type BalanceDistribution = {
      '0-100k': number;
      '100k-250k': number;
      '250k-500k': number;
      '500k+': number;
    };

    const balanceDistribution: BalanceDistribution = {
      '0-100k': 0,
      '100k-250k': 0,
      '250k-500k': 0,
      '500k+': 0
    };

    /**
     * Categorize mortgage balances into predefined ranges
     * @param {number} balance - Current mortgage balance
     * @returns {keyof BalanceDistribution} Category label
     */
    const categorizeBalance = (balance: number): keyof BalanceDistribution => {
      if (balance <= 100000) return '0-100k';
      if (balance <= 250000) return '100k-250k';
      if (balance <= 500000) return '250k-500k';
      return '500k+';
    };

    assumableMortgages.forEach(mortgage => {
      const balance = Number(mortgage.currentBalance);
      balanceDistribution[categorizeBalance(balance)]++;
    });

    // Calculate interest rate distribution
    type InterestRateRanges = {
      '0-3%': number;
      '3-4%': number;
      '4-5%': number;
      '5-6%': number;
      '6%+': number;
    };

    const interestRateRanges: InterestRateRanges = {
      '0-3%': 0,
      '3-4%': 0,
      '4-5%': 0,
      '5-6%': 0,
      '6%+': 0
    };

    /**
     * Categorize interest rates into predefined ranges
     * @param {number} rate - Current interest rate
     * @returns {keyof InterestRateRanges} Category label
     */
    const categorizeInterestRate = (rate: number): keyof InterestRateRanges => {
      if (rate <= 3) return '0-3%';
      if (rate <= 4) return '3-4%';
      if (rate <= 5) return '4-5%';
      if (rate <= 6) return '5-6%';
      return '6%+';
    };

    assumableMortgages.forEach(mortgage => {
      const rate = Number(mortgage.interestRate);
      interestRateRanges[categorizeInterestRate(rate)]++;
    });

    // Calculate days on market by type
    type DaysOnMarketByType = {
      '0-30 days': number;
      '30-60 days': number;
      '60-90 days': number;
      '90+ days': number;
    };

    const daysOnMarketByType: DaysOnMarketByType = {
      '0-30 days': 0,
      '30-60 days': 0,
      '60-90 days': 0,
      '90+ days': 0
    };

    /**
     * Categorize days on market into predefined ranges
     * @param {number} days - Number of days on market
     * @returns {keyof DaysOnMarketByType} Category label
     */
    const categorizeDaysOnMarket = (days: number): keyof DaysOnMarketByType => {
      if (days <= 30) return '0-30 days';
      if (days <= 60) return '30-60 days';
      if (days <= 90) return '60-90 days';
      return '90+ days';
    };

    activeListings.forEach(listing => {
      const days = Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      daysOnMarketByType[categorizeDaysOnMarket(days)]++;
    });

    // Calculate update frequency distribution
    type UpdateFrequencyRanges = {
      'Daily': number;
      'Weekly': number;
      'Monthly': number;
      'Quarterly': number;
    };

    const updateFrequencyRanges: UpdateFrequencyRanges = {
      'Daily': 0,
      'Weekly': 0,
      'Monthly': 0,
      'Quarterly': 0
    };

    /**
     * Categorize update frequency into predefined ranges
     * @param {number} frequency - Updates per day
     * @returns {keyof UpdateFrequencyRanges} Category label
     */
    const categorizeUpdateFrequency = (frequency: number): keyof UpdateFrequencyRanges => {
      if (frequency >= 1) return 'Daily';
      if (frequency >= 0.25) return 'Weekly';
      if (frequency >= 0.033) return 'Monthly';
      return 'Quarterly';
    };

    activeListings.forEach(listing => {
      const daysActive = Math.max(1, Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const updates = Math.floor((now.getTime() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = updates / daysActive;
      updateFrequencyRanges[categorizeUpdateFrequency(frequency)]++;
    });

    /**
     * Compile all dashboard data into a structured response
     * @returns {Object} Formatted dashboard data
     */
    return NextResponse.json({
      data: {
        totalListings: totalActive,
        metrics: {
          averagePrice: avgPrice._avg.price || 0,
          averageDaysOnMarket,
          averageUpdateFrequency,
          totalNewListingsLast30Days: recentMetrics
        },
        assumableListings: {
          labels: loanDistribution.map(d => d.denormalizedAssumableLoanType || 'Unknown'),
          values: loanDistribution.map(d => d._count.denormalizedAssumableLoanType),
        },
        priceDistribution: {
          labels: priceRanges.map(r => r.label),
          values: priceDistributionCounts,
        },
        listingTrends: {
          weekly: processTimeSeries(timeSeries[0], 'weekly'),
          monthly: processTimeSeries(timeSeries[1], 'monthly')
        },
        mortgageAnalytics: {
          ageDistribution: {
            labels: Object.keys(mortgageAgeDistribution),
            values: Object.values(mortgageAgeDistribution)
          },
          balanceDistribution: {
            labels: Object.keys(balanceDistribution),
            values: Object.values(balanceDistribution)
          },
          interestRateDistribution: {
            labels: Object.keys(interestRateRanges),
            values: Object.values(interestRateRanges)
          }
        },
        geographicData: [], // Placeholder for future implementation
        listingLifecycle: {
          statusDistribution: {
            labels: statusDistribution.map(s => s.status),
            values: statusDistribution.map(s => s._count)
          },
          daysOnMarketByType: {
            labels: Object.keys(daysOnMarketByType),
            values: Object.values(daysOnMarketByType)
          },
          updateFrequency: {
            labels: Object.keys(updateFrequencyRanges),
            values: Object.values(updateFrequencyRanges)
          }
        }
      },
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN_ERROR';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
} 
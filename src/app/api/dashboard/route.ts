import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@prisma/client';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get basic metrics
    const [totalActive, avgPrice, recentMetrics, assumableMortgages, activeListings] = await Promise.all([
      prisma.listing.count({
        where: { status: ListingStatus.ACTIVE }
      }),
      prisma.listing.aggregate({
        where: { status: ListingStatus.ACTIVE },
        _avg: { price: true }
      }),
      prisma.listing.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: ListingStatus.ACTIVE
        }
      }),
      prisma.assumableMortgage.findMany({
        select: {
          currentBalance: true,
          interestRate: true,
          createdAt: true,
          remainingTerm: true
        }
      }),
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

    // Calculate average days on market
    const now = new Date();
    const daysOnMarketList = activeListings.map(listing => {
      const startDate = listing.createdAt;
      let endDate = listing.lastStatusChange || now;
      if (endDate < startDate) endDate = now; // safeguard
      return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    });
    const averageDaysOnMarket = Math.round(
      daysOnMarketList.reduce((sum, days) => sum + days, 0) / daysOnMarketList.length
    );

    // Calculate average update frequency
    const updateFrequencies = activeListings.map(listing => {
      const daysActive = Math.max(1, Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const updates = Math.floor((now.getTime() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      return updates / daysActive;
    });
    const averageUpdateFrequency = Math.round(
      updateFrequencies.reduce((sum, freq) => sum + freq, 0) / updateFrequencies.length
    );

    // Get loan type distribution
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

    // Get price distribution
    const priceRanges = [
      { min: 0, max: 250000, label: '0-250k' },
      { min: 250000, max: 500000, label: '250k-500k' },
      { min: 500000, max: 750000, label: '500k-750k' },
      { min: 750000, max: 1000000, label: '750k-1M' },
      { min: 1000000, max: null, label: '1M+' }
    ];

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

    // Get time series data
    const timeSeriesPromises = {
      weekly: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      }),
      monthly: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })
    };

    // Get status distribution
    const statusDistribution = await prisma.listing.groupBy({
      by: ['status'],
      _count: true
    });

    const [
      priceDistributionCounts,
      timeSeries
    ] = await Promise.all([
      Promise.all(priceDistributionPromises),
      Promise.all([timeSeriesPromises.weekly, timeSeriesPromises.monthly])
    ]);

    // Process time series data
    const processTimeSeries = (data: any[] | undefined, interval: 'weekly' | 'monthly') => {
      if (!data || data.length === 0) {
        return { dates: [], values: [] };
      }

      const groupedData = new Map();
      
      data.forEach(item => {
        const date = new Date(item.createdAt);
        let key: string;
        
        if (interval === 'weekly') {
          // Get the start of the week (Sunday)
          const day = date.getDay();
          const diff = date.getDate() - day;
          const startOfWeek = new Date(date.setDate(diff));
          key = startOfWeek.toISOString().split('T')[0];
        } else {
          // Get the start of the month
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const currentCount = groupedData.get(key) || 0;
        groupedData.set(key, currentCount + item._count);
      });

      // Sort by date
      const sortedEntries = Array.from(groupedData.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      return {
        dates: sortedEntries.map(([date]) => date),
        values: sortedEntries.map(([, count]) => count)
      };
    };

    // Calculate mortgage age distribution
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

    // Calculate balance distribution
    const balanceDistribution = {
      '0-100k': 0,
      '100k-250k': 0,
      '250k-500k': 0,
      '500k+': 0
    };

    assumableMortgages.forEach(mortgage => {
      const balance = Number(mortgage.currentBalance);
      if (balance <= 100000) balanceDistribution['0-100k']++;
      else if (balance <= 250000) balanceDistribution['100k-250k']++;
      else if (balance <= 500000) balanceDistribution['250k-500k']++;
      else balanceDistribution['500k+']++;
    });

    // Calculate interest rate distribution
    const interestRateRanges = {
      '0-3%': 0,
      '3-4%': 0,
      '4-5%': 0,
      '5-6%': 0,
      '6%+': 0
    };

    assumableMortgages.forEach(mortgage => {
      const rate = Number(mortgage.interestRate);
      if (rate <= 3) interestRateRanges['0-3%']++;
      else if (rate <= 4) interestRateRanges['3-4%']++;
      else if (rate <= 5) interestRateRanges['4-5%']++;
      else if (rate <= 6) interestRateRanges['5-6%']++;
      else interestRateRanges['6%+']++;
    });

    // Calculate days on market by type
    const daysOnMarketByType = {
      '0-30 days': 0,
      '30-60 days': 0,
      '60-90 days': 0,
      '90+ days': 0
    };

    activeListings.forEach(listing => {
      const days = Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) daysOnMarketByType['0-30 days']++;
      else if (days <= 60) daysOnMarketByType['30-60 days']++;
      else if (days <= 90) daysOnMarketByType['60-90 days']++;
      else daysOnMarketByType['90+ days']++;
    });

    // Calculate update frequency distribution
    const updateFrequencyRanges = {
      'Daily': 0,
      'Weekly': 0,
      'Monthly': 0,
      'Quarterly': 0
    };

    activeListings.forEach(listing => {
      const daysActive = Math.max(1, Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const updates = Math.floor((now.getTime() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = updates / daysActive;
      
      if (frequency >= 1) updateFrequencyRanges['Daily']++;
      else if (frequency >= 0.25) updateFrequencyRanges['Weekly']++;
      else if (frequency >= 0.033) updateFrequencyRanges['Monthly']++;
      else updateFrequencyRanges['Quarterly']++;
    });

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
        geographicData: [],
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
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@prisma/client';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get basic metrics
    const [totalActive, avgPrice, recentMetrics] = await Promise.all([
      prisma.listing.count({
        where: { status: ListingStatus.ACTIVE }
      }),
      prisma.listing.aggregate({
        where: { status: ListingStatus.ACTIVE },
        _avg: { price: true }
      }),
      prisma.listing.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: ListingStatus.ACTIVE
        },
        _count: true,
        _avg: {
          daysOnMarket: true,
          lastUpdateDays: true
        }
      })
    ]);

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

    // Get mortgage analytics
    const mortgageRanges = {
      age: [
        { min: 0, max: 5, label: '0-5 years' },
        { min: 5, max: 10, label: '5-10 years' },
        { min: 10, max: 15, label: '10-15 years' },
        { min: 15, max: 20, label: '15-20 years' },
        { min: 20, max: null, label: '20+ years' }
      ],
      balance: [
        { min: 0, max: 100000, label: '0-100k' },
        { min: 100000, max: 250000, label: '100k-250k' },
        { min: 250000, max: 500000, label: '250k-500k' },
        { min: 500000, max: null, label: '500k+' }
      ]
    };

    // Get time series data
    const timeSeriesPromises = {
      daily: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      }),
      weekly: prisma.listing.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })
    };

    const [
      priceDistributionCounts,
      timeSeries
    ] = await Promise.all([
      Promise.all(priceDistributionPromises),
      Promise.all(Object.values(timeSeriesPromises))
    ]);

    // Process time series data
    const processTimeSeries = (data: any[], interval: 'daily' | 'weekly') => {
      return {
        dates: data.map(d => d.createdAt.toISOString().split('T')[0]),
        values: data.map(d => d._count)
      };
    };

    return NextResponse.json({
      data: {
        totalListings: totalActive,
        metrics: {
          averagePrice: avgPrice._avg.price || 0,
          averageDaysOnMarket: recentMetrics._avg.daysOnMarket || 0,
          averageUpdateFrequency: recentMetrics._avg.lastUpdateDays || 0,
          totalNewListingsLast30Days: recentMetrics._count
        },
        assumableListings: {
          labels: loanDistribution.map(d => d.denormalizedAssumableLoanType),
          values: loanDistribution.map(d => d._count.denormalizedAssumableLoanType),
        },
        priceDistribution: {
          labels: priceRanges.map(r => r.label),
          values: priceDistributionCounts,
        },
        listingTrends: {
          daily: processTimeSeries(timeSeries[0], 'daily'),
          weekly: processTimeSeries(timeSeries[1], 'weekly'),
          monthly: {
            dates: [],
            values: []
          } // To be implemented
        },
        mortgageAnalytics: {
          ageDistribution: {
            labels: mortgageRanges.age.map(r => r.label),
            values: [] // To be implemented
          },
          balanceDistribution: {
            labels: mortgageRanges.balance.map(r => r.label),
            values: [] // To be implemented
          },
          interestRateDistribution: {
            labels: [],
            values: []
          } // To be implemented
        },
        geographicData: [], // To be implemented
        listingLifecycle: {
          statusDistribution: {
            labels: Object.values(ListingStatus),
            values: [] // To be implemented
          },
          daysOnMarketByType: {
            labels: [],
            values: []
          }, // To be implemented
          updateFrequency: {
            labels: [],
            values: []
          } // To be implemented
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
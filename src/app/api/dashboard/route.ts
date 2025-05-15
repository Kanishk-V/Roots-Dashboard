import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@prisma/client';

export async function GET() {
  try {
    // Get counts and averages directly from the database
    const [totalActive, avgPrice] = await Promise.all([
      prisma.listing.count({
        where: { status: ListingStatus.ACTIVE }
      }),
      prisma.listing.aggregate({
        where: { status: ListingStatus.ACTIVE },
        _avg: { price: true }
      })
    ]);

    // Get loan type distribution with a single efficient query
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
      take: 3 // Limit to just VA, FHA, and Conventional
    });

    return NextResponse.json({
      data: {
        totalListings: totalActive,
        metrics: {
          averagePrice: avgPrice._avg.price || 0,
        },
        assumableListings: {
          labels: loanDistribution.map(d => d.denormalizedAssumableLoanType),
          values: loanDistribution.map(d => d._count.denormalizedAssumableLoanType),
        },
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
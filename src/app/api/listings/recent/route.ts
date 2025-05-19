import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/listings/recent
 *
 * Returns the 10 most recent real estate listings from the database.
 * Each listing includes key details such as address, price, and property info.
 *
 * Response: Array of listing objects (JSON)
 * Error: 500 status with error message if the query fails
 */
export async function GET() {
  try {
    // Query the database for the 10 most recently created listings
    const listings = await prisma.listing.findMany({
      take: 10, // Limit to 10 listings
      orderBy: {
        createdAt: 'desc' // Newest first
      },
      select: {
        id: true,           // Listing ID
        address: true,      // Street address
        city: true,         // City
        state: true,        // State
        price: true,        // Listing price
        bedrooms: true,     // Number of bedrooms
        bathrooms: true,    // Number of bathrooms
        squareFeet: true,   // Square footage
        propertyType: true, // Property type (e.g., house, condo)
        photoUrls: true,    // Array of photo URLs
        status: true,       // Listing status (e.g., active, sold)
        createdAt: true     // Date the listing was created
      }
    })

    // Return the listings as a JSON response
    return NextResponse.json(listings)
  } catch (error) {
    // Log and return an error if the query fails
    console.error('Error fetching recent listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent listings' },
      { status: 500 }
    )
  }
} 
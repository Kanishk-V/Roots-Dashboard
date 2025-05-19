import { NextResponse } from 'next/server'
import { ListingService } from '@/services/listing.service'

// Create an instance of the ListingService to handle database operations
const listingService = new ListingService()

/**
 * API Route: /api/listings
 *
 * Provides CRUD operations and search for real estate listings.
 * - GET: Fetch listings (all, by id, or by search query)
 * - POST: Create a new listing
 * - PUT: Update an existing listing
 * - DELETE: Delete a listing by id
 */

/**
 * GET /api/listings
 *
 * Query params:
 *   - id: (optional) fetch a single listing by ID
 *   - query: (optional) search listings by query string
 *
 * If neither is provided, returns all listings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const id = searchParams.get('id')

  try {
    if (id) {
      // Fetch a single listing by ID
      const listing = await listingService.findById(id)
      return NextResponse.json(listing)
    }

    if (query) {
      // Search listings by query string
      const listings = await listingService.search(query)
      return NextResponse.json(listings)
    }

    // Fetch all listings
    const listings = await listingService.findAll()
    return NextResponse.json(listings)
  } catch (error) {
    // Return error if any database operation fails
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

/**
 * POST /api/listings
 *
 * Creates a new listing with the provided JSON body.
 * Returns the created listing.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const listing = await listingService.create(data)
    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

/**
 * PUT /api/listings
 *
 * Updates an existing listing with the provided JSON body.
 * Returns the updated listing.
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const listing = await listingService.update(data)
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

/**
 * DELETE /api/listings
 *
 * Query param:
 *   - id: (required) the ID of the listing to delete
 *
 * Deletes the listing and returns a success message.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      // ID is required for deletion
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await listingService.delete(id)
    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
} 
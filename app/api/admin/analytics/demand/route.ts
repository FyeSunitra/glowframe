import { NextRequest, NextResponse } from 'next/server'

const DEMAND_STATS = { avgUtilisation: 72, avgDaysPerBooking: 3.2, zeroBookingListings: 14, avgTimeToFirstBooking: 8 }

const TOP_CAMERAS = [
  { rank: 1, name: 'Canon EOS R5', color: '#F3C9D2', owner: 'Somchai P.', bookings: 18, revenue: 81000, utilisation: 90 },
  { rank: 2, name: 'Sony A7 IV', color: '#D9E7F2', owner: 'Narin K.', bookings: 12, revenue: 48000, utilisation: 75 },
  { rank: 3, name: 'Nikon Z6 III', color: '#F7E3B7', owner: 'Teerapat W.', bookings: 9, revenue: 42750, utilisation: 60 },
  { rank: 4, name: 'Fujifilm X-T5', color: '#D7ECD9', owner: 'Ploy S.', bookings: 7, revenue: 22750, utilisation: 45 },
  { rank: 5, name: 'OM System OM-1', color: '#F3C9D2', owner: 'Pim A.', bookings: 5, revenue: 17500, utilisation: 35 },
]

const TOP_OWNERS = [
  { rank: 1, owner: 'Somchai P.', listings: 3, bookings: 22, grossEarnings: 94600, platformFees: 9460 },
  { rank: 2, owner: 'Narin K.', listings: 1, bookings: 12, grossEarnings: 48000, platformFees: 4800 },
  { rank: 3, owner: 'Ploy S.', listings: 2, bookings: 10, grossEarnings: 37200, platformFees: 3720 },
]

const DEMAND_BY_CITY = [
  { city: 'Bangkok', bookings: 28, activeListings: 62, supplyGap: -34 },
  { city: 'Chiang Mai', bookings: 12, activeListings: 8, supplyGap: 4 },
  { city: 'Phuket', bookings: 8, activeListings: 4, supplyGap: 4 },
  { city: 'Pattaya', bookings: 5, activeListings: 6, supplyGap: -1 },
]

const DELIVERY_BREAKDOWN = [
  { method: 'Pickup', bookings: 18, share: 53, avgFee: 0 },
  { method: 'Grab', bookings: 12, share: 35, avgFee: 180 },
  { method: 'Post', bookings: 4, share: 12, avgFee: 120 },
]

export async function GET() {
  return NextResponse.json({ data: { stats: DEMAND_STATS, topCameras: TOP_CAMERAS, topOwners: TOP_OWNERS, demandByCity: DEMAND_BY_CITY, deliveryBreakdown: DELIVERY_BREAKDOWN } })
}

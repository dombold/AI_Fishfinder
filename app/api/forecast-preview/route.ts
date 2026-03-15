import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAllMarineData } from '@/lib/marine-api'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const lat  = parseFloat(searchParams.get('lat') ?? '')
  const lng  = parseFloat(searchParams.get('lng') ?? '')
  const startDate = searchParams.get('startDate') ?? ''
  const endDate   = searchParams.get('endDate') ?? ''

  // Validate bounds (WA)
  if (isNaN(lat) || lat < -35 || lat > -13) {
    return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
  }
  if (isNaN(lng) || lng < 113 || lng > 129) {
    return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
  }
  if (!startDate || !endDate || endDate < startDate) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  // Build dates array
  const dates: string[] = []
  const cur = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }

  try {
    const marineData = await fetchAllMarineData(lat, lng, dates)
    return NextResponse.json({
      days: marineData.map(d => ({
        date: d.date,
        tides: d.tides,
        periods: d.periods,
        windHourly: d.windHourly,
        nearestStation: d.nearestStation,
      })),
    })
  } catch (err) {
    console.error('Forecast preview error:', err)
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 500 })
  }
}

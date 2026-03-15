import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchAllMarineData } from '@/lib/marine-api'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
    })
    if (!fishingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Build list of dates
    const dates: string[] = []
    const start = new Date(fishingSession.startDate)
    const end = new Date(fishingSession.endDate)
    const cur = new Date(start)
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }

    const marineData = await fetchAllMarineData(fishingSession.latitude, fishingSession.longitude, dates)

    // Store each day's data
    for (const day of marineData) {
      await prisma.marineData.upsert({
        where: { sessionId_date: { sessionId, date: day.date } },
        create: {
          sessionId,
          date: day.date,
          willyWeatherData: JSON.stringify({
            nearestStation: day.nearestStation,
            windHourly: day.windHourly,
            tides: day.tides,
            moonPhase: day.moonPhase,
            moonIllumination: day.moonIllumination,
            moonrise: day.moonrise,
            moonset: day.moonset,
            sunrise: day.sunrise,
            sunset: day.sunset,
            pressureTrend: day.pressureTrend,
          }),
          openMeteoData: JSON.stringify({ periods: day.periods }),
          tideData: JSON.stringify(day.tides),
        },
        update: {
          willyWeatherData: JSON.stringify({
            nearestStation: day.nearestStation,
            windHourly: day.windHourly,
            tides: day.tides,
            moonPhase: day.moonPhase,
            moonIllumination: day.moonIllumination,
            moonrise: day.moonrise,
            moonset: day.moonset,
            sunrise: day.sunrise,
            sunset: day.sunset,
            pressureTrend: day.pressureTrend,
          }),
          openMeteoData: JSON.stringify({ periods: day.periods }),
          tideData: JSON.stringify(day.tides),
          fetchedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, daysProcessed: marineData.length })
  } catch (err) {
    console.error('Marine data fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch marine data' }, { status: 500 })
  }
}

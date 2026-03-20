import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateFishingPlan } from '@/lib/claude-api'
import type { DayMarineData, TideEvent, PeriodSummary, PressureHourlyPoint } from '@/lib/marine-api'
import { getNearestBoatRamps } from '@/lib/boat-ramps'
import { getDepthAt, getNearbyReefs } from '@/lib/seafloor'
import { getChlorophyll, getSalinity, getSshAnomaly } from '@/lib/ocean-data'
import { getSubsurfaceTemps } from '@/lib/subsurface-temp'
import { getCrowdSummaryForBioregion } from '@/lib/crowd-source-aggregator'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const fishingSession = await prisma.fishingSession.findUnique({
    where: { id: sessionId, userId: session.user.id },
    include: {
      selectedSpecies: true,
      marineData: true,
      user: true,
    },
  })

  if (!fishingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Mark as generating
  await prisma.fishingSession.update({
    where: { id: sessionId },
    data: { status: 'GENERATING' },
  })

  try {
    // Reconstruct DayMarineData from DB
    const marineDataByDay: DayMarineData[] = fishingSession.marineData.map(md => {
      const willy = JSON.parse(md.willyWeatherData)
      const omData = JSON.parse(md.openMeteoData)

      return {
        date: md.date,
        tides: (JSON.parse(md.tideData) as TideEvent[]),
        periods: (omData.periods as PeriodSummary[]),
        windHourly: willy.windHourly ?? [],
        pressureHourly: (willy.pressureHourly ?? []) as PressureHourlyPoint[],
        pressureHPa: willy.pressureHPa ?? null,
        nearestStation: willy.nearestStation ?? '',
        moonPhase: willy.moonPhase ?? 'Unknown',
        moonIllumination: willy.moonIllumination ?? 0,
        moonrise: willy.moonrise ?? '',
        moonset: willy.moonset ?? '',
        sunrise: willy.sunrise ?? '',
        sunset: willy.sunset ?? '',
        pressureTrend: willy.pressureTrend ?? 'steady',
      }
    })

    // Sort by date
    marineDataByDay.sort((a, b) => a.date.localeCompare(b.date))

    const [nearbyBoatRamps, locationDepth, nearbyReefs, chlorophyll, salinity, sshAnomaly, subsurfaceTemps, crowdSummary] = await Promise.all([
      getNearestBoatRamps(fishingSession.latitude, fishingSession.longitude),
      getDepthAt(fishingSession.latitude, fishingSession.longitude),
      getNearbyReefs(fishingSession.latitude, fishingSession.longitude),
      getChlorophyll(fishingSession.latitude, fishingSession.longitude),
      getSalinity(fishingSession.latitude, fishingSession.longitude),
      getSshAnomaly(fishingSession.latitude, fishingSession.longitude),
      getSubsurfaceTemps(fishingSession.latitude, fishingSession.longitude),
      getCrowdSummaryForBioregion(fishingSession.latitude, fishingSession.longitude),
    ])

    // Persist context for "Data Sources" modal
    const contextPayload = {
      locationDepthM: locationDepth,
      chlorophyllMgM3: chlorophyll,
      salinityPSU: salinity,
      sshAnomalyM: sshAnomaly,
      subsurfaceTemps,
      nearbyBoatRamps,
      nearbyReefs,
      fetchedAt: new Date().toISOString(),
    }
    await prisma.fishingSession.update({
      where: { id: sessionId },
      data: { contextData: JSON.stringify(contextPayload) },
    })

    const plans = await generateFishingPlan({
      latitude: fishingSession.latitude,
      longitude: fishingSession.longitude,
      startDate: fishingSession.startDate,
      endDate: fishingSession.endDate,
      fishingType: fishingSession.fishingType,
      targetType: fishingSession.targetType,
      selectedSpecies: fishingSession.selectedSpecies.map(s => s.speciesName),
      sounderType: fishingSession.user.sounderType,
      seasicknessTolerance: fishingSession.user.seasicknessTolerance,
      marineDataByDay,
      nearbyBoatRamps,
      locationDepth,
      nearbyReefs,
      chlorophyll,
      salinity,
      sshAnomaly,
      subsurfaceTemps,
      crowdSummary,
    })

    // Store each day's plan
    for (const plan of plans) {
      await prisma.fishingPlan.upsert({
        where: { sessionId_date: { sessionId, date: plan.date } },
        create: { sessionId, date: plan.date, planContent: JSON.stringify(plan) },
        update: { planContent: JSON.stringify(plan), generatedAt: new Date() },
      })
    }

    await prisma.fishingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETE' },
    })

    return NextResponse.json({ success: true, planCount: plans.length })
  } catch (err: any) {
    console.error('Plan generation error:', err)
    await prisma.fishingSession.update({
      where: { id: sessionId },
      data: { status: 'ERROR', errorMessage: err?.message ?? 'Unknown error' },
    })
    return NextResponse.json({ error: 'Plan generation failed' }, { status: 500 })
  }
}

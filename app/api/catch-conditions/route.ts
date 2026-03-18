import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAllMarineData } from '@/lib/marine-api'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get('lat') ?? '')
    const lng = parseFloat(searchParams.get('lng') ?? '')
    const date = searchParams.get('date') ?? ''
    const time = searchParams.get('time') ?? null   // HH:MM or null

    if (isNaN(lat) || isNaN(lng) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
    }
    if (lat < -35 || lat > -13 || lng < 113 || lng > 129) {
      return NextResponse.json({ error: 'Coordinates outside WA' }, { status: 400 })
    }

    // ── Fetch marine data (tides + moon), SST, and bathymetry depth in parallel ─
    const [dayDataArr, sstRes, depthRes] = await Promise.all([
      fetchAllMarineData(lat, lng, [date]).catch(() => []),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
        `&hourly=sea_surface_temperature&start_date=${date}&end_date=${date}`
      ).catch(() => null),
      fetch(
        `https://api.opentopodata.org/v1/gebco2020?locations=${lat},${lng}`
      ).catch(() => null),
    ])

    const dayData = dayDataArr[0] ?? null

    // ── SST ────────────────────────────────────────────────────────────────
    let sst: number | null = null
    try {
      if (sstRes?.ok) {
        const sstJson = await sstRes.json()
        const times: string[] = sstJson.hourly?.time ?? []
        const temps: (number | null)[] = sstJson.hourly?.sea_surface_temperature ?? []
        const targetHour = time ? parseInt(time.split(':')[0], 10) : 12
        let bestIdx = -1
        let bestDiff = Infinity
        times.forEach((t, i) => {
          const h = new Date(t).getHours()
          const diff = Math.abs(h - targetHour)
          if (diff < bestDiff && temps[i] !== null) {
            bestDiff = diff
            bestIdx = i
          }
        })
        if (bestIdx >= 0 && temps[bestIdx] !== null) {
          sst = Math.round((temps[bestIdx] as number) * 10) / 10
        }
      }
    } catch {
      sst = null
    }

    // ── Tide direction ─────────────────────────────────────────────────────
    let tideDirection: 'incoming' | 'outgoing' | 'slack' | null = null
    if (time && dayData?.tides?.length) {
      const catchMs = new Date(`${date}T${time}:00`).getTime()
      const SLACK_MS = 30 * 60 * 1000

      const sorted = [...dayData.tides].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      )

      const prev = [...sorted].reverse().find(t => new Date(t.time).getTime() < catchMs)
      const next = sorted.find(t => new Date(t.time).getTime() > catchMs)

      if (prev && next) {
        const prevMs = new Date(prev.time).getTime()
        const nextMs = new Date(next.time).getTime()
        if (catchMs - prevMs <= SLACK_MS || nextMs - catchMs <= SLACK_MS) {
          tideDirection = 'slack'
        } else if (prev.type === 'LOW' && next.type === 'HIGH') {
          tideDirection = 'incoming'
        } else if (prev.type === 'HIGH' && next.type === 'LOW') {
          tideDirection = 'outgoing'
        }
      }
    }

    // ── Moon phase (date-based, no time required) ──────────────────────────
    const moonPhase = dayData?.moonPhase ?? null

    // ── Water depth from GEBCO bathymetry ──────────────────────────────────
    let waterDepthM: number | null = null
    try {
      if (depthRes?.ok) {
        const depthJson = await depthRes.json()
        const elevation: number | null = depthJson.results?.[0]?.elevation ?? null
        if (elevation !== null && elevation < 0) {
          waterDepthM = Math.round(Math.abs(elevation) * 10) / 10
        }
      }
    } catch {
      waterDepthM = null
    }

    return NextResponse.json({
      sst,
      tideDirection,
      moonPhase,
      waterDepthM,
      stationName: dayData?.nearestStation ?? null,
    })
  } catch (err: any) {
    console.error('[GET /api/catch-conditions]', err)
    return NextResponse.json({ sst: null, tideDirection: null, moonPhase: null, waterDepthM: null, stationName: null })
  }
}

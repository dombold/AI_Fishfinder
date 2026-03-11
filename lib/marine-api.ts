// Marine data fetching — WillyWeather (primary) + Open-Meteo Marine (SST/currents)

export interface TideEvent {
  time: string   // ISO string
  height: number // metres
  type: 'HIGH' | 'LOW'
}

export interface HourlyRecord {
  time: string
  waveHeight: number | null
  waveDirection: number | null
  wavePeriod: number | null
  swellHeight: number | null
  swellDirection: number | null
  swellPeriod: number | null
  currentVelocity: number | null
  currentDirection: number | null
  sst: number | null
}

export interface PeriodSummary {
  label: string         // e.g. "Pre-dawn 04:00–06:00"
  windSpeed: string
  windDirection: string
  windGusts: string
  swellHeight: string
  swellPeriod: string
  swellDirection: string
  sst: string
  currentSpeed: string
  currentDirection: string
  pressure: string
  precipitation: string
}

export interface DayMarineData {
  date: string            // YYYY-MM-DD
  tides: TideEvent[]
  periods: PeriodSummary[]
  moonPhase: string
  moonIllumination: number
  moonrise: string
  moonset: string
  sunrise: string
  sunset: string
  pressureTrend: string   // 'rising' | 'falling' | 'steady'
}

// Compass direction from degrees
function degreesToCompass(deg: number | null): string {
  if (deg === null) return 'N/A'
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function max(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (!nums.length) return null
  return Math.max(...nums)
}

/** Convert Open-Meteo parallel arrays → array of hourly objects */
function zipOpenMeteoHourly(data: any): HourlyRecord[] {
  const h = data.hourly
  if (!h?.time) return []
  return h.time.map((time: string, i: number) => ({
    time,
    waveHeight:       h.wave_height?.[i] ?? null,
    waveDirection:    h.wave_direction?.[i] ?? null,
    wavePeriod:       h.wave_period?.[i] ?? null,
    swellHeight:      h.swell_wave_height?.[i] ?? null,
    swellDirection:   h.swell_wave_direction?.[i] ?? null,
    swellPeriod:      h.swell_wave_period?.[i] ?? null,
    currentVelocity:  h.ocean_current_velocity?.[i] ?? null,
    currentDirection: h.ocean_current_direction?.[i] ?? null,
    sst:              h.sea_surface_temperature?.[i] ?? null,
  }))
}

const PERIODS = [
  { label: 'Pre-dawn', start: 4,  end: 6  },
  { label: 'Morning',  start: 6,  end: 10 },
  { label: 'Midday',   start: 10, end: 14 },
  { label: 'Afternoon',start: 14, end: 18 },
  { label: 'Evening',  start: 18, end: 20 },
]

/** Summarise hourly Open-Meteo records into 5 named periods */
function summariseByPeriod(
  records: HourlyRecord[],
  willyPeriods: any[], // already parsed WillyWeather wind/swell by hour
  date: string
): PeriodSummary[] {
  return PERIODS.map(p => {
    const hrs = records.filter(r => {
      if (!r.time.startsWith(date)) return false
      const h = new Date(r.time).getHours()
      return h >= p.start && h < p.end
    })

    // WillyWeather wind/swell for this period
    const willy = willyPeriods.filter((w: any) => {
      const h = new Date(w.dateTime).getHours()
      return w.dateTime?.startsWith(date) && h >= p.start && h < p.end
    })

    const windSpeeds = willy.map((w: any) => w.speed).filter(Boolean)
    const windDirs   = willy.map((w: any) => w.direction).filter(Boolean)
    const gusts      = willy.map((w: any) => w.gustSpeed).filter(Boolean)
    const swellHts   = willy.map((w: any) => w.height).filter(Boolean)
    const swellPers  = willy.map((w: any) => w.period).filter(Boolean)
    const swellDirs  = willy.map((w: any) => w.directionText).filter(Boolean)
    const pressures  = willy.map((w: any) => w.pressure).filter(Boolean)
    const precips    = willy.map((w: any) => w.amount).filter(Boolean)

    const avgWind   = windSpeeds.length ? Math.round(windSpeeds.reduce((a:number,b:number)=>a+b,0)/windSpeeds.length) : null
    const maxGust   = gusts.length ? Math.round(Math.max(...gusts)) : null
    const avgSwell  = swellHts.length ? (swellHts.reduce((a:number,b:number)=>a+b,0)/swellHts.length).toFixed(1) : null
    const avgPer    = swellPers.length ? Math.round(swellPers.reduce((a:number,b:number)=>a+b,0)/swellPers.length) : null
    const avgPres   = pressures.length ? Math.round(pressures.reduce((a:number,b:number)=>a+b,0)/pressures.length) : null
    const totalPrec = precips.length ? precips.reduce((a:number,b:number)=>a+b,0).toFixed(1) : '0'

    // SST and currents from Open-Meteo
    const sstVals  = hrs.map(h => h.sst)
    const curVals  = hrs.map(h => h.currentVelocity)
    const curDirs  = hrs.map(h => h.currentDirection)
    const avgSst   = avg(sstVals)
    const avgCur   = avg(curVals)
    const avgCurDir = avg(curDirs)

    const dominantWindDir = windDirs.length
      ? windDirs.sort((a:string,b:string) => windDirs.filter((x:string)=>x===b).length - windDirs.filter((x:string)=>x===a).length)[0]
      : 'N/A'
    const dominantSwellDir = swellDirs.length
      ? swellDirs.sort((a:string,b:string) => swellDirs.filter((x:string)=>x===b).length - swellDirs.filter((x:string)=>x===a).length)[0]
      : 'N/A'

    return {
      label:            `${p.label} ${String(p.start).padStart(2,'0')}:00–${String(p.end).padStart(2,'0')}:00`,
      windSpeed:        avgWind !== null ? `${avgWind} kts` : 'N/A',
      windDirection:    dominantWindDir,
      windGusts:        maxGust !== null ? `${maxGust} kts` : 'N/A',
      swellHeight:      avgSwell !== null ? `${avgSwell}m` : 'N/A',
      swellPeriod:      avgPer !== null ? `${avgPer}s` : 'N/A',
      swellDirection:   dominantSwellDir,
      sst:              avgSst !== null ? `${avgSst.toFixed(1)}°C` : 'N/A',
      currentSpeed:     avgCur !== null ? `${(avgCur * 1.944).toFixed(1)} kts` : 'N/A', // m/s → knots
      currentDirection: degreesToCompass(avgCurDir),
      pressure:         avgPres !== null ? `${avgPres} hPa` : 'N/A',
      precipitation:    `${totalPrec}mm`,
    }
  })
}

/** Fetch tide + weather + astronomy data from WillyWeather API */
async function fetchWillyWeatherData(lat: number, lng: number, dates: string[]) {
  const apiKey = process.env.WILLYWEATHER_API_KEY
  if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_KEY') {
    // Return mock data when no key configured
    return dates.map(date => ({
      date,
      tides: [] as TideEvent[],
      windHourly: [],
      swellHourly: [],
      pressureHourly: [],
      moonPhase: 'Waxing Gibbous',
      moonIllumination: 65,
      moonrise: `${date}T20:15:00`,
      moonset: `${date}T07:30:00`,
      sunrise: `${date}T06:00:00`,
      sunset: `${date}T19:30:00`,
      pressureTrend: 'steady',
    }))
  }

  // Step 1: Find nearest WillyWeather location
  const searchUrl = `https://api.willyweather.com.au/v2/${apiKey}/search.json?query=${lat},${lng}&limit=1`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) throw new Error(`WillyWeather location search failed: ${searchRes.status}`)
  const searchData = await searchRes.json()
  const locationId = searchData?.location?.id
  if (!locationId) throw new Error('No WillyWeather location found for coordinates')

  const startDate = dates[0]
  const numDays = dates.length

  // Step 2: Fetch forecasts
  const forecastUrl = `https://api.willyweather.com.au/v2/${apiKey}/locations/${locationId}/weather.json?forecasts=tides,wind,swell,moonphases&startDate=${startDate}&days=${numDays}`
  const forecastRes = await fetch(forecastUrl)
  if (!forecastRes.ok) throw new Error(`WillyWeather forecast failed: ${forecastRes.status}`)
  const forecastData = await forecastRes.json()

  return dates.map(date => {
    const dayData = forecastData?.forecasts?.tides?.days?.find((d: any) => d.dateTime?.startsWith(date))
    const windDay = forecastData?.forecasts?.wind?.days?.find((d: any) => d.dateTime?.startsWith(date))
    const swellDay = forecastData?.forecasts?.swell?.days?.find((d: any) => d.dateTime?.startsWith(date))
    const moonDay = forecastData?.forecasts?.moonphases?.days?.find((d: any) => d.dateTime?.startsWith(date))

    const tides: TideEvent[] = (dayData?.entries ?? []).map((e: any) => ({
      time: e.dateTime,
      height: e.height,
      type: e.type === 'high' ? 'HIGH' : 'LOW',
    }))

    return {
      date,
      tides,
      windHourly: windDay?.entries ?? [],
      swellHourly: swellDay?.entries ?? [],
      pressureHourly: windDay?.entries ?? [],  // pressure often in wind entries
      moonPhase: moonDay?.phase ?? 'Unknown',
      moonIllumination: moonDay?.illumination ?? 0,
      moonrise: moonDay?.riseDateTime ?? '',
      moonset: moonDay?.setDateTime ?? '',
      sunrise: forecastData?.location?.sunrise ?? '',
      sunset: forecastData?.location?.sunset ?? '',
      pressureTrend: 'steady',  // calculated below if pressure data available
    }
  })
}

/** Fetch SST and ocean currents from Open-Meteo Marine */
async function fetchOpenMeteoMarine(lat: number, lng: number, startDate: string, endDate: string) {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)
  url.searchParams.set('hourly', [
    'wave_height', 'wave_direction', 'wave_period',
    'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
    'ocean_current_velocity', 'ocean_current_direction',
    'sea_surface_temperature',
  ].join(','))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo Marine API failed: ${res.status}`)
  return res.json()
}

/** Main function — fetches all marine data for a session */
export async function fetchAllMarineData(
  lat: number,
  lng: number,
  dates: string[]
): Promise<DayMarineData[]> {
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  // Fetch in parallel
  const [willyData, openMeteoRaw] = await Promise.all([
    fetchWillyWeatherData(lat, lng, dates),
    fetchOpenMeteoMarine(lat, lng, startDate, endDate),
  ])

  const hourlyRecords = zipOpenMeteoHourly(openMeteoRaw)

  return dates.map(date => {
    const willy = willyData.find(d => d.date === date)!

    // Merge WillyWeather wind/swell with Open-Meteo SST/currents into period summaries
    const allWillyHourly = [
      ...(willy.windHourly || []),
      ...(willy.swellHourly || []),
    ]
    const periods = summariseByPeriod(hourlyRecords, allWillyHourly, date)

    return {
      date,
      tides: willy.tides,
      periods,
      moonPhase: willy.moonPhase,
      moonIllumination: willy.moonIllumination,
      moonrise: willy.moonrise,
      moonset: willy.moonset,
      sunrise: willy.sunrise,
      sunset: willy.sunset,
      pressureTrend: willy.pressureTrend,
    }
  })
}

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

export interface WindHourlyPoint {
  time: string        // ISO string e.g. "2026-03-15T06:00:00"
  speedKts: number    // converted from WillyWeather km/h
  directionText: string
}

export interface DayMarineData {
  date: string            // YYYY-MM-DD
  tides: TideEvent[]
  periods: PeriodSummary[]
  windHourly: WindHourlyPoint[]
  nearestStation: string  // WillyWeather station name used for wind/tide data
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
  windHourly: any[],  // WillyWeather wind entries  { dateTime, speed (km/h), directionText }
  swellHourly: any[], // WillyWeather swell entries { dateTime, height (m), period (s), directionText }
  date: string
): PeriodSummary[] {
  return PERIODS.map(p => {
    const inPeriod = (dateTime: string) => {
      if (!dateTime?.startsWith(date)) return false
      const h = new Date(dateTime.replace(' ', 'T')).getHours()
      return h >= p.start && h < p.end
    }

    const hrs = records.filter(r => {
      if (!r.time.startsWith(date)) return false
      const h = new Date(r.time).getHours()
      return h >= p.start && h < p.end
    })

    const wind  = windHourly.filter((w: any) => inPeriod(w.dateTime))
    const swell = swellHourly.filter((w: any) => inPeriod(w.dateTime))

    // Wind speed: WillyWeather returns km/h → convert to knots (×0.53996)
    const windSpeedsKmh = wind.map((w: any) => w.speed).filter((v: any) => v != null && !isNaN(v))
    const windDirTexts  = wind.map((w: any) => w.directionText).filter(Boolean)
    const swellHts      = swell.map((w: any) => w.height).filter((v: any) => v != null && !isNaN(v))
    const swellPers     = swell.map((w: any) => w.period).filter((v: any) => v != null && !isNaN(v))
    const swellDirs     = swell.map((w: any) => w.directionText).filter(Boolean)

    const avgWindKts = windSpeedsKmh.length
      ? Math.round(windSpeedsKmh.reduce((a: number, b: number) => a + b, 0) / windSpeedsKmh.length * 0.53996)
      : null
    const avgSwell = swellHts.length
      ? (swellHts.reduce((a: number, b: number) => a + b, 0) / swellHts.length).toFixed(1)
      : null
    const avgPer = swellPers.length
      ? Math.round(swellPers.reduce((a: number, b: number) => a + b, 0) / swellPers.length)
      : null

    function dominant<T>(arr: T[]): T | string {
      if (!arr.length) return 'N/A'
      return arr.sort((a, b) => arr.filter(x => x === b).length - arr.filter(x => x === a).length)[0]
    }

    // SST and currents from Open-Meteo
    const avgSst    = avg(hrs.map(h => h.sst))
    const avgCur    = avg(hrs.map(h => h.currentVelocity))
    const avgCurDir = avg(hrs.map(h => h.currentDirection))

    return {
      label:            `${p.label} ${String(p.start).padStart(2,'0')}:00–${String(p.end).padStart(2,'0')}:00`,
      windSpeed:        avgWindKts !== null ? `${avgWindKts} kts` : 'N/A',
      windDirection:    String(dominant(windDirTexts)),
      windGusts:        'N/A', // WillyWeather free tier does not include gust data
      swellHeight:      avgSwell !== null ? `${avgSwell}m` : 'N/A',
      swellPeriod:      avgPer !== null ? `${avgPer}s` : 'N/A',
      swellDirection:   String(dominant(swellDirs)),
      sst:              avgSst !== null ? `${avgSst.toFixed(1)}°C` : 'N/A',
      currentSpeed:     avgCur !== null ? `${(avgCur * 1.944).toFixed(1)} kts` : 'N/A', // m/s → kts
      currentDirection: degreesToCompass(avgCurDir),
      pressure:         'N/A', // not in WillyWeather free forecast
      precipitation:    'N/A', // not in WillyWeather free forecast
    }
  })
}

// Static table of WA coastal WillyWeather station IDs.
// WillyWeather's coordinate search is unreliable — we find the nearest station
// via haversine distance instead.
const WA_STATIONS = [
  // ── Kimberley ──────────────────────────────────────────────────
  { id: 18886, lat: -13.7537, lng: 126.1505, name: 'Troughton Island' },
  { id: 27606, lat: -13.8951, lng: 126.0938, name: 'Cape Bougainville' },
  { id: 18882, lat: -14.0502, lng: 121.7944, name: 'Scott Reef' },
  { id: 15124, lat: -14.2945, lng: 126.6423, name: 'Kalumburu' },
  { id: 30820, lat: -14.09,   lng: 126.39,   name: 'Truscott' },
  { id: 18879, lat: -15.5258, lng: 123.1562, name: 'Adele Island' },
  { id: 15821, lat: -15.4874, lng: 128.1234, name: 'Wyndham' },
  { id: 15185, lat: -15.7739, lng: 128.739,  name: 'Kununurra' },
  { id: 14821, lat: -16.094,  lng: 123.6036, name: 'Cockatoo Island' },
  { id: 18902, lat: -16.1333, lng: 123.7333, name: 'Yampi Sound' },
  { id: 15166, lat: -16.1408, lng: 123.7682, name: 'Koolan Island' },
  { id: 18872, lat: -16.3875, lng: 123.1827, name: 'Sunday Island' },
  { id: 27719, lat: -16.3903, lng: 122.9261, name: 'Cape Leveque' },
  { id: 27722, lat: -16.5391, lng: 122.8171, name: 'Lombadina' },
  { id: 27697, lat: -16.5806, lng: 122.9631, name: 'Cygnet Bay' },
  { id: 14899, lat: -17.3048, lng: 123.6325, name: 'Derby' },
  { id: 25103, lat: -17.9826, lng: 122.2179, name: 'Roebuck Bay' },
  { id: 14735, lat: -17.9551, lng: 122.2415, name: 'Broome' },
  // ── Pilbara ────────────────────────────────────────────────────
  { id: 18870, lat: -19.588,  lng: 119.0991, name: 'Bedout Island' },
  { id: 14956, lat: -19.6119, lng: 120.9986, name: 'Eighty Mile Beach' },
  { id: 30821, lat: -19.7428, lng: 120.8432, name: 'Mandora' },
  { id: 15532, lat: -20.3142, lng: 118.578,  name: 'Port Hedland' },
  { id: 25407, lat: -20.3919, lng: 116.8909, name: 'Legendre Island' },
  { id: 14880, lat: -20.5654, lng: 116.6549, name: 'Dampier Archipelago' },
  { id: 14879, lat: -20.6617, lng: 116.7071, name: 'Dampier' },
  { id: 15527, lat: -20.6288, lng: 117.1958, name: 'Point Samson' },
  { id: 15778, lat: -20.6764, lng: 117.1393, name: 'Wickham' },
  { id: 14851, lat: -20.6783, lng: 117.1886, name: 'Cossack' },
  { id: 25409, lat: -20.7039, lng: 116.8468, name: 'Nickol Bay' },
  { id: 14651, lat: -20.7919, lng: 115.4001, name: 'Barrow Island' },
  { id: 15136, lat: -20.7367, lng: 116.8463, name: 'Karratha' },
  { id: 36310, lat: -20.6522, lng: 115.5777, name: 'Varanus Island' },
  { id: 15566, lat: -20.7692, lng: 117.1446, name: 'Roebourne' },
  { id: 27850, lat: -20.8343, lng: 116.2053, name: 'Cape Preston' },
  { id: 15772, lat: -20.8344, lng: 117.8441, name: 'Whim Creek' },
  { id: 15257, lat: -21.1935, lng: 115.9762, name: 'Mardie' },
  { id: 15664, lat: -21.4613, lng: 115.0089, name: 'Thevenard Island' },
  { id: 15478, lat: -21.6363, lng: 115.1124, name: 'Onslow' },
  // ── Gascoyne / Mid-West ────────────────────────────────────────
  { id: 39786, lat: -21.5917, lng: 113.8046, name: 'Exmouth' },
  { id: 15215, lat: -22.2148, lng: 114.0944, name: 'Learmonth' },
  { id: 14846, lat: -23.1428, lng: 113.7708, name: 'Coral Bay' },
  { id: 36263, lat: -24.0396, lng: 113.4251, name: 'Red Bluff' },
  { id: 14793, lat: -24.8837, lng: 113.657,  name: 'Carnarvon' },
  { id: 14673, lat: -24.8492, lng: 113.1426, name: 'Bernier Island' },
  { id: 14915, lat: -25.0792, lng: 113.1082, name: 'Dorre Island' },
  { id: 15592, lat: -25.2667, lng: 113.4667, name: 'Shark Bay' },
  { id: 15315, lat: -25.7942, lng: 113.7183, name: 'Monkey Mia' },
  { id: 14906, lat: -25.8215, lng: 113.0795, name: 'Dirk Hartog Island' },
  { id: 14897, lat: -25.9279, lng: 113.5337, name: 'Denham' },
  { id: 15694, lat: -26.1254, lng: 113.4204, name: 'Useless Loop' },
  { id: 15397, lat: -26.2556, lng: 113.8086, name: 'Nanga' },
  { id: 15054, lat: -26.435,  lng: 114.2011, name: 'Hamelin Pool' },
  { id: 15117, lat: -27.7106, lng: 114.1644, name: 'Kalbarri' },
  { id: 18833, lat: -28.3001, lng: 113.5952, name: 'North Island' },
  { id: 15082, lat: -28.3791, lng: 114.4314, name: 'Horrocks' },
  { id: 25869, lat: -28.4362, lng: 113.7353, name: 'Abrolhos East Wallabi Island' },
  { id: 18838, lat: -28.1916, lng: 114.2482, name: 'Port Gregory' },
  { id: 15002, lat: -28.7731, lng: 114.6113, name: 'Geraldton' },
  { id: 14909, lat: -29.2485, lng: 114.92,   name: 'Dongara' },
  { id: 15216, lat: -29.9451, lng: 114.9799, name: 'Leeman' },
  { id: 15035, lat: -30.0639, lng: 114.9687, name: 'Green Head' },
  { id: 15114, lat: -30.3079, lng: 115.0365, name: 'Jurien Bay' },
  { id: 14803, lat: -30.5036, lng: 115.07,   name: 'Cervantes' },
  // ── Swan Coast / Perth ─────────────────────────────────────────
  { id: 14555, lat: -31.0215, lng: 115.3321, name: 'Lancelin' },
  { id: 25752, lat: -31.0071, lng: 115.3167, name: 'Lancelin Island' },
  { id: 14556, lat: -31.1075, lng: 115.3728, name: 'Ledge Point' },
  { id: 14591, lat: -31.5011, lng: 115.5881, name: 'Two Rocks' },
  { id: 14599, lat: -31.5467, lng: 115.6321, name: 'Yanchep' },
  { id: 14560, lat: -31.6879, lng: 115.7067, name: 'Mindarie' },
  { id: 14572, lat: -31.7555, lng: 115.7276, name: 'Ocean Reef' },
  { id: 14542, lat: -31.8074, lng: 115.7435, name: 'Hillarys' },
  { id: 15973, lat: -31.8948, lng: 115.765,  name: 'Scarborough' },
  { id: 14468, lat: -31.9954, lng: 115.5396, name: 'Rottnest Island' },
  { id: 14576, lat: -31.9554, lng: 115.8586, name: 'Perth' },
  { id: 14524, lat: -31.9931, lng: 115.7571, name: 'Cottesloe' },
  { id: 14384, lat: -32.0531, lng: 115.7459, name: 'Fremantle' },
  { id: 14387, lat: -32.2258, lng: 115.6864, name: 'Garden Island' },
  { id: 28091, lat: -32.2265, lng: 115.6999, name: 'Colpoys Point' },
  { id: 14463, lat: -32.278,  lng: 115.7224, name: 'Rockingham' },
  { id: 14473, lat: -32.2955, lng: 115.7107, name: 'Shoalwater' },
  { id: 14422, lat: -32.5337, lng: 115.7217, name: 'Mandurah' },
  // ── Offshore Perth ─────────────────────────────────────────────
  { id: 39795, lat: -31.7,    lng: 115.133,  name: 'Perth FAD2 (offshore)' },
  { id: 39798, lat: -32.113,  lng: 115.121,  name: 'Perth FAD5 (offshore)' },
  // ── South-West ─────────────────────────────────────────────────
  { id: 15883, lat: -33.3271, lng: 115.637,  name: 'Bunbury' },
  { id: 19524, lat: -33.5315, lng: 115.0057, name: 'Cape Naturaliste' },
  { id: 18818, lat: -33.5418, lng: 115.0402, name: 'Bunker Bay' },
  { id: 14936, lat: -33.5573, lng: 115.0599, name: 'Eagle Bay' },
  { id: 14931, lat: -33.6159, lng: 115.1066, name: 'Dunsborough' },
  { id: 14768, lat: -33.6506, lng: 115.347,  name: 'Busselton' },
  { id: 15829, lat: -33.6651, lng: 115.054,  name: 'Yallingup' },
  { id: 19522, lat: -33.6588, lng: 115.016,  name: 'Smiths Beach' },
  { id: 19520, lat: -33.7008, lng: 114.9767, name: 'Cape Clairault' },
  { id: 15031, lat: -33.8673, lng: 114.9859, name: 'Gracetown' },
  { id: 15535, lat: -33.9851, lng: 114.9968, name: 'Prevelly' },
  { id: 18805, lat: -33.9711, lng: 114.9867, name: 'Margaret River Mouth' },
  { id: 15053, lat: -34.2283, lng: 115.056,  name: 'Hamelin Bay' },
  { id: 14625, lat: -34.3159, lng: 115.1597, name: 'Augusta' },
  { id: 19512, lat: -34.3755, lng: 115.1361, name: 'Cape Leeuwin' },
  { id: 15793, lat: -34.8371, lng: 116.0251, name: 'Windy Harbour' },
  { id: 15715, lat: -34.9764, lng: 116.7322, name: 'Walpole' },
  // ── Great Southern ─────────────────────────────────────────────
  { id: 15435, lat: -35.0003, lng: 116.8375, name: 'Nornalup' },
  { id: 15501, lat: -35.0343, lng: 116.932,  name: 'Peaceful Bay' },
  { id: 25397, lat: -35.0212, lng: 116.9569, name: 'Irwin Inlet' },
  { id: 14898, lat: -34.9628, lng: 117.3514, name: 'Denmark' },
  { id: 15474, lat: -35.0251, lng: 117.3332, name: 'Ocean Beach' },
  { id: 14605, lat: -35.0239, lng: 117.8835, name: 'Albany' },
  { id: 28235, lat: -34.9536, lng: 118.1703, name: 'Two Peoples Bay' },
  { id: 36000, lat: -34.8798, lng: 118.3999, name: 'Cheynes Beach' },
  { id: 39777, lat: -35.3922, lng: 118.0928, name: 'Albany FAD4 (offshore)' },
  // ── South Coast ────────────────────────────────────────────────
  { id: 14726, lat: -34.3924, lng: 119.3808, name: 'Bremer Bay' },
  { id: 15081, lat: -33.95,   lng: 120.1263, name: 'Hopetoun' },
  { id: 19447, lat: -33.9481, lng: 120.1188, name: 'Hopetoun West Beach' },
  { id: 14968, lat: -33.8613, lng: 121.8914, name: 'Esperance' },
  { id: 28298, lat: -33.9911, lng: 122.237,  name: 'Lucky Bay' },
  { id: 14782, lat: -34.0078, lng: 122.1865, name: 'Cape Le Grand' },
  { id: 14780, lat: -33.987,  lng: 123.1924, name: 'Cape Arid' },
  { id: 25023, lat: -33.969,  lng: 123.1642, name: 'Cape Arid Creek Entrance' },
  { id: 15094, lat: -33.6067, lng: 123.8914, name: 'Israelite Bay' },
  { id: 14969, lat: -31.6768, lng: 128.888,  name: 'Eucla' },
]

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestStation(lat: number, lng: number) {
  return WA_STATIONS.reduce((best, s) =>
    haversineKm(lat, lng, s.lat, s.lng) < haversineKm(lat, lng, best.lat, best.lng) ? s : best
  )
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
      moonPhase: 'Waxing Gibbous',
      moonIllumination: 65,
      moonrise: `${date}T20:15:00`,
      moonset: `${date}T07:30:00`,
      sunrise: `${date}T06:00:00`,
      sunset: `${date}T19:30:00`,
      pressureTrend: 'steady',
    }))
  }

  // Step 1: Find nearest WillyWeather station via haversine distance
  const station = nearestStation(lat, lng)
  const locationId = station.id
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

    // WillyWeather datetimes use "YYYY-MM-DD HH:MM:SS" — normalise to ISO
    const toISO = (dt: string) => dt ? dt.replace(' ', 'T') : ''

    const tides: TideEvent[] = (dayData?.entries ?? []).map((e: any) => ({
      time: toISO(e.dateTime),
      height: e.height,
      type: e.type === 'high' ? 'HIGH' : 'LOW',
    }))

    // moonphases entries are nested under days[].entries[]
    const moonEntry = moonDay?.entries?.[0]

    return {
      date,
      tides,
      windHourly: windDay?.entries ?? [],
      swellHourly: swellDay?.entries ?? [],
      moonPhase: moonEntry?.phase ?? 'Unknown',
      moonIllumination: moonEntry?.percentageFull ?? 0,
      moonrise: toISO(moonEntry?.riseDateTime ?? ''),
      moonset: toISO(moonEntry?.setDateTime ?? ''),
      sunrise: forecastData?.location?.sunrise ?? '',
      sunset: forecastData?.location?.sunset ?? '',
      pressureTrend: 'steady',
    }
  })
}

/** Fetch SST and ocean currents from Open-Meteo Marine.
 *  Returns empty hourly data for inland/shallow-coastal points where the
 *  marine grid has no coverage — wind/tide data from WillyWeather still shows.
 */
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

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      // 400 = no marine grid coverage (land / very shallow coast) — not fatal
      console.warn(`Open-Meteo Marine: no coverage at ${lat},${lng} (${res.status})`)
      return { hourly: {} }
    }
    return res.json()
  } catch (err) {
    console.warn('Open-Meteo Marine fetch failed:', err)
    return { hourly: {} }
  }
}

/** Main function — fetches all marine data for a session */
export async function fetchAllMarineData(
  lat: number,
  lng: number,
  dates: string[]
): Promise<DayMarineData[]> {
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  // Resolve nearest station name up front (same station used for all dates)
  const apiKey = process.env.WILLYWEATHER_API_KEY
  const stationName = (apiKey && apiKey !== 'REPLACE_WITH_YOUR_KEY')
    ? nearestStation(lat, lng).name
    : 'Demo data'

  // Fetch in parallel
  const [willyData, openMeteoRaw] = await Promise.all([
    fetchWillyWeatherData(lat, lng, dates),
    fetchOpenMeteoMarine(lat, lng, startDate, endDate),
  ])

  const hourlyRecords = zipOpenMeteoHourly(openMeteoRaw)

  return dates.map(date => {
    const willy = willyData.find(d => d.date === date)!

    const periods = summariseByPeriod(hourlyRecords, willy.windHourly || [], willy.swellHourly || [], date)

    const windHourly = (willy.windHourly || []).map((e: any) => ({
      time: e.dateTime.replace(' ', 'T'),
      speedKts: Math.round(e.speed * 0.53996 * 10) / 10,
      directionText: e.directionText ?? 'N/A',
    }))

    return {
      date,
      tides: willy.tides,
      periods,
      windHourly,
      nearestStation: stationName,
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

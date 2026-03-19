import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'About — AI Fishfinder' }

export default async function AboutPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% 0%, #0E2A45 0%, #0B1929 50%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span className="section-label" style={{ margin: '0 0 1rem', display: 'inline-block' }}>About</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-foam)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Built for Western<br />
            <span style={{ background: 'linear-gradient(135deg, var(--color-current), var(--color-seafoam))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Australian Anglers
            </span>
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            AI Fishfinder combines live marine data with artificial intelligence to produce personalised daily fishing briefings — covering tides, swell, wind, bite windows, species guidance, and current fishery regulations.
          </p>
        </div>

        {/* What it does */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>What it does</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <circle cx="18" cy="18" r="17" stroke="rgba(10,126,164,0.3)" strokeWidth="1"/>
                  <circle cx="18" cy="18" r="11" stroke="#0A7EA4" strokeWidth="1.5" strokeDasharray="3 2"/>
                  <circle cx="18" cy="18" r="5" stroke="#3CBFAE" strokeWidth="1.5"/>
                  <circle cx="18" cy="18" r="2" fill="#3CBFAE"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Live Marine Data</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Real swell, wind, tides and ocean temperature pulled from WillyWeather, Bureau of Meteorology, GEBCO, NOAA, and Open-Meteo — updated daily.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <path d="M4 24 C8 14, 14 14, 18 18 C22 22, 28 14, 32 10" stroke="#3CBFAE" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <circle cx="18" cy="18" r="3" fill="#C9A84C"/>
                  <path d="M18 10 L18 6 M24 12 L27 9 M12 12 L9 9" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>AI Fishing Plans</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Claude AI generates a personalised daily briefing for your location with optimal bite windows, tide phases, waypoints, and tactical notes.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <ellipse cx="18" cy="20" rx="9" ry="4.5" fill="#C9A84C" opacity="0.9"/>
                  <path d="M9 20 L4 14 L4 26 Z" fill="#C9A84C" opacity="0.8"/>
                  <path d="M6 28 L30 28" stroke="rgba(59,191,174,0.3)" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M2 28 C6 24, 10 24, 14 26 C18 28, 22 28, 26 26 C30 24, 34 24, 36 22" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Species & Closures</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Target up to 4 species with WA fishery closure warnings built in. Bag limits, minimum sizes, and seasonal closures are checked for your location.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <rect x="4" y="6" width="28" height="20" rx="2" stroke="#0A7EA4" strokeWidth="1.5" fill="none"/>
                  <circle cx="18" cy="14" r="3" stroke="#3CBFAE" strokeWidth="1.5"/>
                  <path d="M18 17 L18 22" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 30 L24 30" stroke="#0A7EA4" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M22 24 L18 28 L14 24" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Chartplotter Ready</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Export fishing spots as GPX files — load directly into Garmin, Simrad, Lowrance, Raymarine and other chartplotter systems.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <rect x="6" y="4" width="18" height="22" rx="2" stroke="#0A7EA4" strokeWidth="1.5" fill="none"/>
                  <circle cx="15" cy="12" r="4" stroke="#3CBFAE" strokeWidth="1.5" fill="none"/>
                  <path d="M11 16 C11 14, 19 14, 19 16" stroke="#3CBFAE" strokeWidth="1" fill="none"/>
                  <path d="M24 18 L30 12 L34 16" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="30" cy="12" r="2" fill="#C9A84C"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Catch Log & Photo Storage</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Log every catch with location, species, weight, length, time, and a photo. Environmental conditions auto-fill from your coordinates. Photos are stored permanently and shown as thumbnails alongside each entry.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="26" height="26" rx="4" stroke="#3CBFAE" strokeWidth="1.5" fill="none"/>
                  <path d="M18 12 L18 24 M12 18 L24 18" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="28" cy="10" r="4" fill="#0B1929" stroke="#C9A84C" strokeWidth="1.5"/>
                  <path d="M26 10 L27.5 11.5 L30.5 8.5" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Works Offline</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Install as a PWA and take it to sea. Save plans for offline reading before departure, log catches with GPS and camera while out of range, and sync everything automatically when you return to port.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <ellipse cx="18" cy="20" rx="10" ry="5" stroke="#3CBFAE" strokeWidth="1.5" fill="none"/>
                  <path d="M8 20 L4 16 L4 24 Z" fill="#3CBFAE" opacity="0.7"/>
                  <circle cx="22" cy="18" r="2" fill="#C9A84C"/>
                  <path d="M18 10 L18 6 M24 13 L27 10 M12 13 L9 10" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 28 L14 26 M18 29 L18 27 M24 28 L22 26" stroke="rgba(59,191,174,0.4)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Fish Identifier</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Caught an unknown fish? Upload a photo and pin the location — Claude AI identifies the species and instantly shows the WA bag limits, size limits, and any active closures for where you caught it.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <circle cx="12" cy="13" r="4" stroke="#3CBFAE" strokeWidth="1.5" fill="none"/>
                  <circle cx="24" cy="13" r="4" stroke="#0A7EA4" strokeWidth="1.5" fill="none"/>
                  <path d="M4 27 C4 22, 20 22, 20 27" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M16 27 C16 22, 32 22, 32 27" stroke="#0A7EA4" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Fishing Groups</h3>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Create a private group for your fishing crew and share catch logs with members. Invite-only access keeps your catches within your circle.
              </p>
            </div>

          </div>
        </section>

        {/* Data sources */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Data sources</h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {[
              { name: 'WillyWeather', role: 'Hourly wind, tides, swell forecasts for WA coastal stations' },
              { name: 'Bureau of Meteorology (BOM)', role: 'Weather station data, pressure trends, official forecasts' },
              { name: 'Open-Meteo Marine API', role: 'Sea surface temperature, wave height, ocean currents' },
              { name: 'GEBCO / NOAA', role: 'Bathymetry (depth data) for fishing ground identification' },
              { name: 'Anthropic Claude API', role: 'AI analysis and generation of personalised fishing briefings' },
              { name: 'WA DPIRD', role: 'Recreational fishing regulations, bag limits, size limits, closures' },
            ].map((src, i, arr) => (
              <div key={src.name} style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.5rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(107,143,163,0.1)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-current)', flexShrink: 0, marginTop: '0.35rem' }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-seafoam)', fontSize: '0.875rem', marginBottom: '0.125rem' }}>{src.name}</p>
                  <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{src.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>WA bioregion coverage</h2>
          <div className="card" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Regulations and species data are calibrated to the four official WA DPIRD bioregions — North Coast, Gascoyne, West Coast, and South Coast. Every plan includes region-specific bag limits, minimum sizes, and active closure warnings for your fishing location.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(107,143,163,0.6)', lineHeight: 1.6 }}>
              Regulations data is sourced from the DPIRD Recreational Fishing Guide 2026 and rules.fish.wa.gov.au. Always verify current rules at <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-seafoam)', textDecoration: 'none' }}>fish.wa.gov.au</a> before fishing — regulations are subject to change.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}

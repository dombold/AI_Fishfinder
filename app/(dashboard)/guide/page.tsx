import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Guide — AI Fishfinder' }

const toc = [
  { id: 'getting-started',  label: 'Getting Started' },
  { id: 'fishing-plans',    label: 'Generating a Fishing Plan' },
  { id: 'fish-identifier',  label: 'Fish Identifier' },
  { id: 'catch-log',        label: 'Catch Log' },
  { id: 'saved-plans',      label: 'Saved Plans & GPX Export' },
  { id: 'regulations',      label: 'Regulations Hub' },
  { id: 'profile',          label: 'Profile & Account' },
]

const tipBox: React.CSSProperties = {
  background: 'rgba(10,126,164,0.08)',
  borderLeft: '3px solid var(--color-current)',
  borderRadius: '0 6px 6px 0',
  padding: '0.875rem 1.125rem',
  marginTop: '1rem',
}

const stepNumber: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.625rem',
  height: '1.625rem',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, var(--color-current), var(--color-seafoam))',
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 700,
  flexShrink: 0,
  marginTop: '0.125rem',
}

const stepRow: React.CSSProperties = {
  display: 'flex',
  gap: '0.875rem',
  alignItems: 'flex-start',
  marginBottom: '0.875rem',
}

const stepText: React.CSSProperties = {
  color: 'var(--color-mist)',
  fontSize: '0.9375rem',
  lineHeight: 1.65,
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  color: 'var(--color-foam)',
  marginBottom: '1.25rem',
  letterSpacing: '-0.02em',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '4rem',
  scrollMarginTop: '80px',
}

export default async function GuidePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% 0%, #0E2A45 0%, #0B1929 50%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="section-label" style={{ margin: '0 0 1rem', display: 'inline-block' }}>User Guide</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-foam)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            How to Use<br />
            <span style={{ background: 'linear-gradient(135deg, var(--color-current), var(--color-seafoam))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              AI Fishfinder
            </span>
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
            Everything you need to know to get the most out of your AI-powered fishing assistant.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '4rem' }}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>On this page</p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem 1.5rem' }}>
            {toc.map((item, i) => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-current)', fontWeight: 700, minWidth: '1.25rem' }}>{String(i + 1).padStart(2, '0')}</span>
                <a
                  href={`#${item.id}`}
                  style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', textDecoration: 'none', lineHeight: 1.4 }}
                  onMouseEnter={undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ─── 1. Getting Started ─── */}
        <section id="getting-started" style={sectionStyle}>
          <h2 style={h2Style}>1. Getting Started</h2>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Create an account</strong> — click <em>Register</em> on the login page and enter a username and password. Your data is private and tied to your account.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Log in</strong> — use your credentials at the login screen. You'll be taken straight to the Plan dashboard.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Navigate the app</strong> — the top navigation bar gives you access to every feature: <em>Plan, Identify, Guide, Contact, About, Regulations</em>, and your user menu.</p>
            </div>
            <div style={tipBox}>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: 'var(--color-current)' }}>Tip:</strong> AI Fishfinder is designed specifically for Western Australian coastal fishing. Regulations, closures, and species data are all calibrated to WA DPIRD rules across the four official bioregions.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 2. Generating a Fishing Plan ─── */}
        <section id="fishing-plans" style={sectionStyle}>
          <h2 style={h2Style}>2. Generating a Fishing Plan</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Set your location</strong> — click the map to drop a pin, or type coordinates into the <em>Or enter coordinates</em> field below the map. Any standard format is accepted — see the coordinate formats box below.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Set the date range</strong> — choose a start date and end date for your trip. Plans cover up to 3 consecutive days and can be generated up to 7 days in advance. The AI uses live forecast data for the exact dates you select, so the tides, swell, and wind windows in your plan are specific to those days.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Choose Boat or Beach</strong> — this tells the AI how you're fishing. <em>Boat</em> unlocks offshore species and frames tactics around trolling, deep dropping, and anchoring over structure. <em>Beach</em> focuses on shore-accessible species and covers surfcasting, rock fishing, and estuary techniques. This choice also filters the species list to only show what's realistically catchable from that platform.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>4</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Choose Pelagic, Demersal, or Both</strong> — <em>Pelagic</em> targets mid-water and surface species that roam open water: mackerel, tuna, mahi-mahi, samson fish. <em>Demersal</em> targets bottom-dwelling species that live on or near the seabed: dhufish, snapper, baldchin groper, pink snapper. <em>Both</em> gives you a mixed-bag plan that covers the full water column. This selection filters the species dropdown to only show relevant options.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>5</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Choose your target species</strong> — select up to 4 species from the filtered list. The AI tailors bite windows, rig recommendations, and regulation checks specifically to the species you pick. Narrowing your selection to 1–2 species gives a more focused, actionable plan.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>6</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Click Generate</strong> — the plan is built in real time using live marine data (tides, swell, wind, SST) fetched for your exact location and dates.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>7</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Read your briefing</strong> — the plan includes optimal bite windows, tide phases, swell & wind conditions, suggested waypoints, species-specific tactics, and any active closure warnings for your area.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>8</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Save the plan</strong> — click <em>Save Plan</em> at the bottom of the briefing to add it to your Saved Plans library for later reference and GPX export.</p>
            </div>
          </div>
          <div style={tipBox}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--color-current)' }}>Tip:</strong> <strong style={{ color: 'var(--color-foam)' }}>Boat + Demersal</strong> is the most data-rich combination — the AI can suggest specific depth ranges, bottom structure, and reef edges based on your location. <strong style={{ color: 'var(--color-foam)' }}>Beach + Pelagic</strong> plans focus on surf conditions, gutters, and current lines. Plans are generated fresh each time, so re-generating on the day of your trip gives the most accurate forecast.
            </p>
          </div>
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Accepted coordinate formats</p>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {[
                ['Signed decimal', '-21.8891, 113.9659'],
                ['Cardinal suffix', '21.8891°S 113.9659°E'],
                ['Cardinal prefix', 'S21.8891 E113.9659'],
                ['Degrees decimal-minutes', "21°53.346'S 113°57.954'E"],
                ['Degrees minutes seconds', '21°53\'20"S 113°57\'57"E'],
              ].map(([label, example]) => (
                <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', minWidth: '180px' }}>{label}</span>
                  <code style={{ background: 'rgba(107,143,163,0.1)', padding: '0.1em 0.5em', borderRadius: '4px', fontSize: '0.8125rem', color: 'var(--color-seafoam)' }}>{example}</code>
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(107,143,163,0.6)', fontSize: '0.75rem', marginTop: '0.75rem', marginBottom: 0 }}>
              Coordinates are always stored and displayed as <code style={{ background: 'rgba(107,143,163,0.1)', padding: '0.1em 0.4em', borderRadius: '4px' }}>21.8891°S 113.9659°E</code> internally.
            </p>
          </div>
        </section>

        {/* ─── 3. Fish Identifier ─── */}
        <section id="fish-identifier" style={sectionStyle}>
          <h2 style={h2Style}>3. Fish Identifier</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Go to Identify</strong> — click <em>Identify</em> in the top navigation bar.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Upload a photo</strong> — click the upload area or drag a photo of your catch onto it. Supported formats: JPG, PNG, WEBP. The image is resized automatically for analysis.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Set the catch location</strong> — drop a pin on the map, or type coordinates into the field above the map in any standard format. This is used to check WA-region-specific regulations for that species at that location.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>4</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Click Identify</strong> — Claude AI analyses the image and returns the identified species along with bag limits, minimum size, and any active closures in your area.</p>
            </div>
          </div>
          <div style={tipBox}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--color-current)' }}>Tip:</strong> For best results, use a clear photo with good lighting showing the fish's side profile. If EXIF location data is embedded in your photo, the coordinate field auto-fills. You can also paste coordinates from any GPS device or app — all standard formats are accepted.
            </p>
          </div>
        </section>

        {/* ─── 4. Catch Log ─── */}
        <section id="catch-log" style={sectionStyle}>
          <h2 style={h2Style}>4. Catch Log</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Open Catch Log</strong> — select <em>Catch Log</em> from the user menu (top-right dropdown) or navigate directly to <code style={{ background: 'rgba(107,143,163,0.1)', padding: '0.1em 0.4em', borderRadius: '4px', fontSize: '0.85em' }}>/catch-log</code>.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Add a new entry</strong> — click <em>Log a Catch</em>. Fill in the species, date, location (type coordinates or click the map), quantity, and optionally weight, length, capture time, fishing method, and notes.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Environmental data is auto-filled</strong> — sea surface temperature, tide direction, and moon phase are recorded automatically from marine data at the time of entry.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>4</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Edit or delete</strong> — each log entry has Edit and Delete buttons. Edit updates any field; delete permanently removes the record after confirmation.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>5</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Browse on map</strong> — all logged catches are plotted on a map so you can review your fishing history geographically.</p>
            </div>
          </div>
          <div style={tipBox}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--color-current)' }}>Tip:</strong> Log a catch immediately after landing it so the auto-filled environmental data reflects actual conditions at the time.
            </p>
          </div>
        </section>

        {/* ─── 5. Saved Plans & GPX Export ─── */}
        <section id="saved-plans" style={sectionStyle}>
          <h2 style={h2Style}>5. Saved Plans & GPX Export</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Save a plan</strong> — after generating a fishing plan, scroll to the bottom and click <em>Save Plan</em>. The plan is stored to your account library.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Access saved plans</strong> — click <em>Saved Plans</em> in the user menu. Each saved plan shows the date, location, and target species at a glance.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Open a plan</strong> — click any saved plan to view the full briefing again including all waypoints and tactics.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>4</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Export as GPX</strong> — on the plan page, click <em>Download GPX</em>. The file contains all suggested waypoints and can be loaded directly into Garmin, Simrad, Lowrance, Raymarine, and other chartplotter systems.</p>
            </div>
          </div>
          <div style={tipBox}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--color-current)' }}>Tip:</strong> Transfer the GPX file to your chartplotter via SD card or USB before heading out. Most chartplotters accept GPX via their <em>Import Waypoints</em> menu.
            </p>
          </div>
        </section>

        {/* ─── 6. Regulations Hub ─── */}
        <section id="regulations" style={sectionStyle}>
          <h2 style={h2Style}>6. Regulations Hub</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              The Regulations dropdown in the top navigation provides three dedicated tools for staying compliant on the water.
            </p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', borderRadius: '8px', border: '1px solid rgba(107,143,163,0.1)' }}>
                <p style={{ fontWeight: 600, color: 'var(--color-seafoam)', fontSize: '0.9375rem', marginBottom: '0.375rem' }}>Active Closures</p>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>Lists current WA fishing closures by species and bioregion. Check this before every trip — closures are updated from WA DPIRD data and any active closure in your plan's location will trigger a warning during plan generation.</p>
              </div>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', borderRadius: '8px', border: '1px solid rgba(107,143,163,0.1)' }}>
                <p style={{ fontWeight: 600, color: 'var(--color-seafoam)', fontSize: '0.9375rem', marginBottom: '0.375rem' }}>Safety Guidelines</p>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>WA-specific on-water safety requirements including lifejacket rules, flare requirements, and vessel safety equipment checklists based on your distance from shore.</p>
              </div>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', borderRadius: '8px', border: '1px solid rgba(107,143,163,0.1)' }}>
                <p style={{ fontWeight: 600, color: 'var(--color-seafoam)', fontSize: '0.9375rem', marginBottom: '0.375rem' }}>Possession Limits</p>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>Bag limits and minimum size requirements for common WA recreational fish species, organised by bioregion. Figures are sourced from the DPIRD Recreational Fishing Guide 2026.</p>
              </div>
            </div>
          </div>
          <div style={tipBox}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--color-current)' }}>Important:</strong> Always verify the latest regulations at <strong style={{ color: 'var(--color-foam)' }}>fish.wa.gov.au</strong> before fishing. Rules can change — AI Fishfinder provides guidance but does not constitute legal advice.
            </p>
          </div>
        </section>

        {/* ─── 7. Profile & Account ─── */}
        <section id="profile" style={sectionStyle}>
          <h2 style={h2Style}>7. Profile & Account</h2>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={stepRow}>
              <span style={stepNumber}>1</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Open Profile</strong> — click your username or avatar in the top-right user menu and select <em>Profile</em>.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>2</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Update display name</strong> — enter a new display name and click Save to update how your name appears across the app.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>3</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Change password</strong> — enter your current password and a new password, then click <em>Update Password</em>. Use a strong, unique password.</p>
            </div>
            <div style={stepRow}>
              <span style={stepNumber}>4</span>
              <p style={stepText}><strong style={{ color: 'var(--color-foam)' }}>Sign out</strong> — select <em>Sign out</em> from the user dropdown in the top navigation. Your saved plans and catch log remain stored when you return.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(107,143,163,0.1)' }}>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Still have questions? We're happy to help.
          </p>
          <a href="/contact" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.9375rem' }}>
            Contact Support
          </a>
        </div>

      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'
import RegulationsPanel from '@/components/RegulationsPanel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Fishing Regulations — AI Fishfinder' }

const SAFETY_SECTIONS = [
  {
    area: 'All Vessels — All Waters',
    color: 'rgba(59,191,174,0.15)',
    border: 'rgba(59,191,174,0.3)',
    items: [
      'Approved lifejacket (PFD) for every person on board — Level 150 for exposed waters, Level 100/50S for sheltered waters',
      'Anchor with chain/rope — minimum 3× vessel length',
      'Bailer or bilge pump',
      'Torch or waterproof flashlight',
    ],
  },
  {
    area: 'Powered Vessels (Any Size)',
    color: 'rgba(10,126,164,0.15)',
    border: 'rgba(10,126,164,0.3)',
    items: [
      'Fire extinguisher — dry powder, minimum 0.9 kg ABE rating, required for enclosed engine spaces',
      'Horn, whistle, or sound-signalling device',
    ],
  },
  {
    area: 'Inshore — Within 2nm of Shore',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.25)',
    items: [
      '2× hand-held orange smoke flares OR 2× hand-held red flares',
      'VHF marine radio (recommended — monitor Channel 16)',
    ],
  },
  {
    area: 'Offshore — Beyond 2nm up to 20nm',
    color: 'rgba(224,92,42,0.1)',
    border: 'rgba(224,92,42,0.25)',
    items: [
      '4× hand-held red flares + 2× parachute rocket flares',
      'VHF marine radio (Channel 16 monitored at all times)',
      '406 MHz PLB (Personal Locator Beacon) or EPIRB — strongly recommended',
    ],
  },
  {
    area: 'Offshore — Beyond 20nm (Unlimited Waters)',
    color: 'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.3)',
    items: [
      '406 MHz EPIRB — mandatory',
      'Life raft or life buoy',
      'SART (Search and Rescue Transponder) — recommended',
      'Satellite phone or HF SSB radio',
    ],
  },
]

export default async function RegulationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      <DashboardNav />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="section-label" style={{ margin: '0 0 0.75rem', display: 'inline-block' }}>WA DPIRD 2026</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Fishing Regulations
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Bag limits, minimum sizes, possession limits, and active closures for Western Australian recreational fishing — organised by bioregion.
          </p>
        </div>

        {/* Active closure banner */}
        <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.35)', borderRadius: '0.75rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '0.875rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Active Closure — West Coast Bioregion</p>
              <p style={{ color: 'var(--color-foam)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.375rem' }}>
                <strong>Boat demersal scalefish fishing is CLOSED</strong> in the West Coast Bioregion (Kalbarri to Augusta) from 16 December 2025 until approximately September 2027. This affects Pink Snapper, Dhufish, Baldchin Groper, Breaksea Cod, Red Emperor, Redthroat Emperor, Spangled Emperor, Coral Trout, Tuskfish, and Black Snapper.
              </p>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                Land-based (beach) fishing for demersal species remains permitted with reduced bag limits. Source: <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-seafoam)', textDecoration: 'none' }}>DPIRD WA</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Boat safety equipment */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
            Required Boat Safety Equipment
          </h2>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            WA requirements under the Navigable Waters Regulations 2009 and Transport WA Recreational Boating Safety Handbook.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {SAFETY_SECTIONS.map(section => (
              <div
                key={section.area}
                style={{ padding: '1.125rem 1.375rem', background: section.color, border: `1px solid ${section.border}`, borderRadius: '0.625rem' }}
              >
                <p style={{ fontWeight: 700, color: 'var(--color-foam)', fontSize: '0.875rem', marginBottom: '0.625rem', letterSpacing: '0.01em' }}>
                  {section.area}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {section.items.map(item => (
                    <li key={item} style={{ display: 'flex', gap: '0.625rem', color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--color-seafoam)', flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.55)', lineHeight: 1.6 }}>
            Equipment requirements vary by vessel class and operating area. Always verify current requirements at{' '}
            <a href="https://www.transport.wa.gov.au/imarine/recreational-boating-safety.asp" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(107,143,163,0.8)', textDecoration: 'underline' }}>transport.wa.gov.au/imarine</a>{' '}
            before departure.
          </p>
        </section>

        {/* Fishing regulations table */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
            Species Bag Limits & Size Limits
          </h2>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Select your bioregion to see applicable rules. Rows highlighted in orange have an active closure. Rows with a SEASONAL badge have time-based restrictions.
          </p>

          <RegulationsPanel />
        </section>

      </div>
    </div>
  )
}

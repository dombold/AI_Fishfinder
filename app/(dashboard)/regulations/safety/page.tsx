import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Safety Equipment — AI Fishfinder' }

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

export default async function SafetyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      <DashboardNav />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="section-label" style={{ margin: '0 0 0.75rem', display: 'inline-block' }}>WA Transport 2026</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Required Safety Equipment
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            WA requirements under the Navigable Waters Regulations 2009 and Transport WA Recreational Boating Safety Handbook — organised by operating area.
          </p>
        </div>

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

      </div>
    </div>
  )
}

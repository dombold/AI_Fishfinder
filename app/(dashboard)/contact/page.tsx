import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contact — AI Fishfinder' }

export default async function ContactPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% 0%, #0E2A45 0%, #0B1929 50%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

        {/* Hero */}
        <div style={{ marginBottom: '3rem' }}>
          <span className="section-label" style={{ margin: '0 0 1rem', display: 'inline-block' }}>Contact</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--color-foam)', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Get in touch
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '1rem', lineHeight: 1.7 }}>
            Found a bug, have a feature request, or spotted a regulation error? We want to hear from you.
          </p>
        </div>

        {/* Contact options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(10,126,164,0.15)', border: '1px solid rgba(10,126,164,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#0A7EA4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.375rem' }}>Bug reports & feature requests</h3>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  Use GitHub Issues to report bugs or suggest improvements. Include steps to reproduce and what you expected to happen.
                </p>
                <a href="https://github.com/dombold/AI_Fishfinder/issues" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--color-seafoam)', background: 'rgba(107,143,163,0.08)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', display: 'inline-block', textDecoration: 'none' }}>
                  github.com/dombold/AI_Fishfinder/issues
                </a>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke="#C9A84C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.375rem' }}>Regulation corrections</h3>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  Spotted an outdated bag limit, incorrect size, or missing closure? Email us with the species, bioregion, and the correct rule from an official DPIRD source.
                </p>
                <a href="mailto:dominic_bolding@hotmail.com" style={{ fontSize: '0.8125rem', color: 'var(--color-seafoam)', background: 'rgba(107,143,163,0.08)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', display: 'inline-block', textDecoration: 'none' }}>
                  dominic_bolding@hotmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Disclaimer */}
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(107,143,163,0.7)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-mist)' }}>Regulations disclaimer:</strong> Fishing regulations provided on this platform are for guidance only and may not reflect the most current rules. Always verify with <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-seafoam)', textDecoration: 'none' }}>fish.wa.gov.au</a> or <a href="https://rules.fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-seafoam)', textDecoration: 'none' }}>rules.fish.wa.gov.au</a> before fishing.
          </p>
        </div>

      </div>
    </div>
  )
}

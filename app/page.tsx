import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% 0%, #0E2A45 0%, #0B1929 50%, #061018 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <header style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>
        <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '30px', width: 'auto' }} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/login" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem 3rem', textAlign: 'center' }}>

        <div style={{ maxWidth: '720px' }}>
          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', color: 'var(--color-foam)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            AI Fishing Intelligence<br />
            <span style={{ background: 'linear-gradient(135deg, var(--color-current), var(--color-seafoam))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              for WA Waters
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{ color: 'var(--color-mist)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 2.5rem' }}>
            Personalised daily briefings covering tides, swell, wind, bite windows and species guidance —
            built specifically for Western Australia anglers.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 2rem' }}>
              Create Free Account
            </Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-seafoam)', fontSize: '1rem', textDecoration: 'none', fontWeight: 500, padding: '0.75rem 1.5rem', border: '1px solid rgba(59,191,174,0.3)', borderRadius: '0.5rem' }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div style={{ width: '100%', maxWidth: '800px', margin: '4rem auto 0', borderTop: '1px solid rgba(107,143,163,0.12)' }} />

        {/* Feature carousel */}
        <style>{`
          @keyframes marquee-rtl {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .carousel-track {
            display: flex;
            gap: 1.25rem;
            width: max-content;
            animation: marquee-rtl 32s linear infinite;
          }
          .carousel-track:hover { animation-play-state: paused; }
          .carousel-wrap {
            overflow: hidden;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          }
        `}</style>

        <section style={{ width: '100%', maxWidth: '900px', padding: '3rem 0 0' }}>
          <div className="carousel-wrap">
            <div className="carousel-track">
              {/* Cards — rendered twice for seamless loop */}
              {[0, 1].map(pass => (
                <div key={pass} style={{ display: 'flex', gap: '1.25rem' }}>

                  <div className="card" style={{ padding: '1.75rem', textAlign: 'left', width: '280px', flexShrink: 0 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                        <circle cx="18" cy="18" r="17" stroke="rgba(10,126,164,0.3)" strokeWidth="1"/>
                        <circle cx="18" cy="18" r="11" stroke="#0A7EA4" strokeWidth="1.5" strokeDasharray="3 2"/>
                        <circle cx="18" cy="18" r="5" stroke="#3CBFAE" strokeWidth="1.5"/>
                        <circle cx="18" cy="18" r="2" fill="#3CBFAE"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Live Marine Data</h3>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Real swell, wind, tides and ocean temperature from multiple sources including WillyWeather, Bureau of Meteorology, GEBCO, NOAA and others.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '1.75rem', textAlign: 'left', width: '280px', flexShrink: 0 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                        <path d="M4 24 C8 14, 14 14, 18 18 C22 22, 28 14, 32 10" stroke="#3CBFAE" strokeWidth="2" strokeLinecap="round" fill="none"/>
                        <circle cx="18" cy="18" r="3" fill="#C9A84C"/>
                        <path d="M18 10 L18 6 M24 12 L27 9 M12 12 L9 9" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>AI Fishing Plans</h3>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Claude AI generates a personalised daily briefing with optimal bite windows, tide phases and waypoints.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '1.75rem', textAlign: 'left', width: '280px', flexShrink: 0 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                        <ellipse cx="18" cy="20" rx="9" ry="4.5" fill="#C9A84C" opacity="0.9"/>
                        <path d="M9 20 L4 14 L4 26 Z" fill="#C9A84C" opacity="0.8"/>
                        <path d="M16 15.5 C18 12, 22 12, 24 15.5" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity="0.7"/>
                        <circle cx="26" cy="19" r="1.5" fill="#0B1929"/>
                        <path d="M6 28 L30 28" stroke="rgba(59,191,174,0.3)" strokeWidth="1" strokeLinecap="round"/>
                        <path d="M2 28 C6 24, 10 24, 14 26 C18 28, 22 28, 26 26 C30 24, 34 24, 36 22" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Species & Closures</h3>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Target up to 4 species with real-time WA fishery closure warnings included in every plan.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '1.75rem', textAlign: 'left', width: '280px', flexShrink: 0 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                        <rect x="4" y="6" width="28" height="20" rx="2" stroke="#0A7EA4" strokeWidth="1.5" fill="none"/>
                        <circle cx="18" cy="14" r="3" stroke="#3CBFAE" strokeWidth="1.5"/>
                        <path d="M18 17 L18 22" stroke="#3CBFAE" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M12 30 L24 30" stroke="#0A7EA4" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M22 24 L18 28 L14 24" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Chartplotter Ready</h3>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Export your fishing spots as a GPX file — load directly into Garmin, Simrad, Lowrance, Raymarine and more.
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: '2rem', borderTop: '1px solid rgba(107,143,163,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '22px', width: 'auto', opacity: 0.7 }} />
        <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
          AI Fishfinder · Western Australia
        </p>
      </footer>

    </div>
  )
}

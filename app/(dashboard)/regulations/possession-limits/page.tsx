import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Possession Limits — AI Fishfinder' }

export default async function PossessionLimitsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      <DashboardNav />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="section-label" style={{ margin: '0 0 0.75rem', display: 'inline-block' }}>WA DPIRD 2026</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Possession Limits
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Maximum amounts of recreational catch you may legally possess at any one time in Western Australia.
          </p>
        </div>

        {/* General limit */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            General Finfish Possession Limit
          </h2>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            You may possess whichever of the following you choose:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
            {[
              '10 kg of fillets of any species (skin not required) plus an additional 10 kg of fillets from large pelagic species',
              '10 kg of fillets of any species plus one day\'s bag limit of whole fish or fish trunks',
              '2 days\' bag limit of whole fish or fish trunks',
            ].map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.875rem 1.125rem', background: 'rgba(59,191,174,0.07)', border: '1px solid rgba(59,191,174,0.2)', borderRadius: '0.5rem' }}>
                <span style={{ flexShrink: 0, width: '1.375rem', height: '1.375rem', borderRadius: '50%', background: 'rgba(59,191,174,0.2)', color: 'var(--color-seafoam)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <p style={{ color: 'var(--color-foam)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{opt}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.875rem 1.125rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ color: 'var(--color-sand)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Exception — Permanent Residence / Extended Charter</p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
              You may possess up to <strong style={{ color: 'var(--color-foam)' }}>20 kg of fish fillets</strong> at your permanent residence or after participating in an extended charter boat fishing trip. Fish must be clearly labelled with your name and date of catch.
            </p>
          </div>
        </section>

        {/* Regional exceptions */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Regional Exceptions
          </h2>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            Lower possession limits apply in these specific areas:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                area: 'Abrolhos Islands',
                limit: '5 kg of fillets from any species (skin required) plus 5 kg of fillets from large pelagic species',
                alt: 'OR one day\'s bag limit of whole fish or fish trunks',
              },
              {
                area: 'Shark Bay — Freycinet Estuary',
                limit: '5 kg of fillets',
                alt: 'OR one day\'s bag limit of whole or trunk fish',
              },
              {
                area: 'Lalang-garram/Camden Sound Marine Park (Jungulu Zone)',
                limit: '1 whole fish',
                alt: 'OR 2 fillets maximum',
              },
            ].map(row => (
              <div key={row.area} style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.5rem' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-foam)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>{row.area}</p>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                  {row.limit} <span style={{ color: 'rgba(107,143,163,0.6)' }}>{row.alt}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Species-specific */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Species-Specific Limits
          </h2>
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,143,163,0.06)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.5rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--color-foam)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Barramundi — Away from permanent residence</p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              Maximum of <strong style={{ color: 'var(--color-foam)' }}>2 whole barramundi</strong> or <strong style={{ color: 'var(--color-foam)' }}>4 fillets</strong>.
            </p>
          </div>
        </section>

        {/* Filleted fish rules */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Filleted Fish Rules
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              '2 fillets or pieces of fish = 1 whole finfish for the purpose of enforcing bag and boat limits on day trips.',
              'At sea (while fishing): fillets must have skin attached to allow species identification.',
              'Fish with a maximum size limit cannot be filleted at sea.',
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.625rem', color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--color-seafoam)', flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                {rule}
              </div>
            ))}
          </div>
        </section>

        {/* Exemptions */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Exemptions
          </h2>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '0.875rem', lineHeight: 1.6 }}>
            The following do <strong>not</strong> count toward possession limits:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Baitfish: hardyhead, sardines, whitebait, garfish, and mullet',
              'Commercially purchased fish (must have receipt or proof of purchase)',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.625rem', color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--color-seafoam)', flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Source */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.5)', lineHeight: 1.6 }}>
          Source:{' '}
          <a
            href="https://www.dpird.wa.gov.au/individuals/recreational-fishing/recreational-fishing-rules/recreational-bag-and-size-limits/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(107,143,163,0.75)', textDecoration: 'underline' }}
          >
            DPIRD WA — Recreational Bag and Size Limits
          </a>
          . Always verify current rules before your trip.
        </p>

      </div>
    </div>
  )
}

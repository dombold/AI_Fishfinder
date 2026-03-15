import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BriefingCard from '@/components/BriefingCard'
import PlanPoller from '@/components/PlanPoller'
import PrintButton from '@/components/PrintButton'
import SavePlanButton from '@/components/SavePlanButton'
import DataSourcesModal from '@/components/DataSourcesModal'
import ExportGPXButton from '@/components/ExportGPXButton'
import UserDropdown from '@/components/UserDropdown'
import type { DailyPlan } from '@/lib/claude-api'
import type { TideEvent, PeriodSummary } from '@/lib/marine-api'

export const dynamic = 'force-dynamic'

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const fishingSession = await prisma.fishingSession.findUnique({
    where: { id, userId: session.user.id },
    include: {
      selectedSpecies: true,
      fishingPlans: { orderBy: { date: 'asc' } },
      marineData: { orderBy: { date: 'asc' } },
    },
  })

  if (!fishingSession) notFound()

  const { status, errorMessage, latitude, longitude, fishingType, locationName, startDate, endDate, saved, contextData } = fishingSession
  const selectedSpecies = fishingSession.selectedSpecies.map(s => s.speciesName)

  // Still processing — show poller
  if (status === 'PENDING' || status === 'GENERATING') {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
        <nav style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '26px', width: 'auto' }} />
          </Link>
        </nav>
        <PlanPoller sessionId={id} initialStatus={status} />
      </div>
    )
  }

  // Error state
  if (status === 'ERROR') {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
        <nav style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '26px', width: 'auto' }} />
          </Link>
        </nav>
        <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Plan Generation Failed</h2>
          {errorMessage && <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage}</p>}
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Try Again</Link>
        </div>
      </div>
    )
  }

  // COMPLETE — render briefing cards
  const plans: DailyPlan[] = fishingSession.fishingPlans.map(fp => {
    const content = typeof fp.planContent === 'string' ? JSON.parse(fp.planContent) : fp.planContent
    return content as DailyPlan
  })

  // Map date → tides + periods for charts
  const marineByDate: Record<string, { tides: TideEvent[]; periods: PeriodSummary[] }> = Object.fromEntries(
    fishingSession.marineData.map(md => [
      md.date,
      {
        tides: JSON.parse(md.tideData) as TideEvent[],
        periods: (JSON.parse(md.openMeteoData) as { periods: PeriodSummary[] }).periods,
      },
    ])
  )

  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const dateRangeLabel = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) +
    (startDate !== endDate ? ` – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : `, ${start.getFullYear()}`)

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      {/* Nav */}
      <nav style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '26px', width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>← New Plan</Link>
          <UserDropdown />
        </div>
      </nav>

      {/* Page header */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 0' }}>
        <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="section-label" style={{ margin: 0 }}>Fishing Briefing</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
          {dateRangeLabel} · {fishingType.charAt(0).toUpperCase() + fishingType.slice(1)} · {selectedSpecies.join(', ')}
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {locationName ?? `${Math.abs(latitude).toFixed(4)}°S, ${longitude.toFixed(4)}°E`}
        </p>

        {/* Actions */}
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <SavePlanButton sessionId={id} initialSaved={saved} />
          <PrintButton />
          <DataSourcesModal contextData={contextData ?? null} latitude={latitude} longitude={longitude} />
          <ExportGPXButton plans={plans} locationName={locationName ?? null} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* Briefing cards */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {plans.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-mist)' }}>
            No plan data available. <Link href="/dashboard" style={{ color: 'var(--color-seafoam)' }}>Try generating a new plan.</Link>
          </div>
        ) : (
          plans.map(plan => (
            <BriefingCard
              key={plan.date}
              plan={plan}
              selectedSpecies={selectedSpecies}
              latitude={latitude}
              longitude={longitude}
              fishingType={fishingType}
              tides={marineByDate[plan.date]?.tides ?? []}
              periods={marineByDate[plan.date]?.periods ?? []}
            />
          ))
        )}
      </main>
    </div>
  )
}

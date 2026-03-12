'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MapPicker from '@/components/MapPicker'
import SpeciesSelector from '@/components/SpeciesSelector'
import UserDropdown from '@/components/UserDropdown'
import { checkFishingClosures } from '@/lib/regulations'

type FishingType = 'beach' | 'boat'
type TargetType = 'pelagic' | 'demersal' | 'both'

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr() { return localDateStr() }
function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return localDateStr(d)
}

export default function DashboardPage() {
  const router = useRouter()

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [fishingType, setFishingType] = useState<FishingType>('boat')
  const [targetType, setTargetType] = useState<TargetType>('pelagic')
  const [species, setSpecies] = useState<string[]>([])
  const [availableSpecies, setAvailableSpecies] = useState<string[]>([])

  const [closureWarnings, setClosureWarnings] = useState<{ severity: string; message: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')

  // Fetch available species — filtered by location lat when available
  useEffect(() => {
    setSpecies([])
    const latParam = location ? `&lat=${location.lat}` : ''
    fetch(`/api/species?fishingType=${fishingType}&targetType=${targetType}${latParam}`)
      .then(r => r.json())
      .then(d => setAvailableSpecies(d.species ?? []))
  }, [fishingType, targetType, location])

  // Check closures when location/type changes — always clear if no location
  useEffect(() => {
    if (!location) {
      setClosureWarnings([])
      return
    }
    const warnings = checkFishingClosures(location.lat, location.lng, fishingType, targetType, species)
    setClosureWarnings(warnings)
  }, [location, fishingType, targetType, species])

  // Validate date range
  const dateError = (() => {
    if (!startDate || !endDate) return ''
    if (endDate < startDate) return 'End date must be on or after start date'
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    if (diff > 2) return 'Date range cannot exceed 3 days'
    return ''
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setError('Please select a location on the map'); return }
    if (species.length === 0) { setError('Please select at least one species'); return }
    if (dateError) { setError(dateError); return }
    setError('')
    setLoading(true)

    try {
      // Step 1: Create session
      setLoadingStep('Creating fishing session…')
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng, startDate, endDate, fishingType, targetType, selectedSpecies: species }),
      })
      if (!sessionRes.ok) {
        const d = await sessionRes.json()
        throw new Error(d.error || 'Failed to create session')
      }
      const { sessionId } = await sessionRes.json()

      // Step 2: Fetch marine data
      setLoadingStep('Gathering ocean conditions…')
      await fetch('/api/marine-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      // Step 3: Generate AI plan
      setLoadingStep('AI is crafting your fishing plan…')
      await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      router.push(`/plan/${sessionId}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 0%, #0E2A45 0%, #0B1929 55%, #061018 100%)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(107,143,163,0.15)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,25,41,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '28px', width: 'auto' }} />
        </div>
        <UserDropdown />
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
            Plan Your Fishing Trip
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem' }}>
            Select your location, dates and target species — we&apos;ll generate a personalised daily briefing.
          </p>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,25,41,0.92)', zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
              {[...Array(5)].map((_,i) => <span key={i} className="wave-bar" style={{ animationDelay: `${i*0.1}s` }} />)}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foam)' }}>{loadingStep}</p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>This may take up to 30 seconds…</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Section 1: Location */}
            <section className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>1. Fishing Location</h2>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', marginBottom: '1rem' }}>Click the map to drop a pin anywhere in Western Australia.</p>
              <MapPicker value={location} onChange={setLocation} />
            </section>

            {/* Section 2: Dates */}
            <section className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foam)', marginBottom: '1rem' }}>2. Fishing Dates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start Date</label>
                  <input type="date" value={startDate} min={todayStr()} max={maxDateStr()} onChange={e => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value) }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>End Date</label>
                  <input type="date" value={endDate} min={startDate} max={maxDateStr()} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>
              {dateError && <p role="alert" style={{ color: 'var(--color-warning)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{dateError}</p>}
              <p style={{ color: 'var(--color-mist)', fontSize: '0.75rem', marginTop: '0.625rem' }}>Up to 7 days in advance · Maximum 3-day range</p>
            </section>

            {/* Section 3 & 4: Fishing Type + Target */}
            <section className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foam)', marginBottom: '1rem' }}>3. Fishing Setup</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fishing Type</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(['boat', 'beach'] as FishingType[]).map(ft => (
                      <label key={ft} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                        <input type="radio" name="fishingType" value={ft} checked={fishingType === ft} onChange={() => setFishingType(ft)} style={{ accentColor: 'var(--color-current)', width: 'auto' }} />
                        <span style={{ color: fishingType === ft ? 'var(--color-foam)' : 'var(--color-mist)', fontSize: '0.9375rem', textTransform: 'capitalize' }}>{ft}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Fish</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(['pelagic', 'demersal', 'both'] as TargetType[]).map(tt => (
                      <label key={tt} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                        <input type="radio" name="targetType" value={tt} checked={targetType === tt} onChange={() => setTargetType(tt)} style={{ accentColor: 'var(--color-current)', width: 'auto' }} />
                        <span style={{ color: targetType === tt ? 'var(--color-foam)' : 'var(--color-mist)', fontSize: '0.9375rem', textTransform: 'capitalize' }}>{tt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Closure Warnings */}
            {closureWarnings.length > 0 && (
              <div role="alert">
                {closureWarnings.map((w, i) => (
                  <div key={i} style={{
                    background: w.severity === 'CLOSED' ? 'rgba(220,38,38,0.12)' : 'rgba(201,168,76,0.12)',
                    border: `1px solid ${w.severity === 'CLOSED' ? 'rgba(220,38,38,0.4)' : 'rgba(201,168,76,0.4)'}`,
                    borderRadius: '0.625rem',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                  }}>
                    <p style={{ fontWeight: 700, color: w.severity === 'CLOSED' ? '#DC2626' : 'var(--color-sand)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {w.severity === 'CLOSED' ? '⛔ FISHERY CLOSURE' : '⚠ SEASONAL RESTRICTION'}
                    </p>
                    <p style={{ color: 'var(--color-foam)', fontSize: '0.8125rem' }}>{w.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Section 5: Species */}
            <section className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>4. Target Species</h2>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', marginBottom: '1rem' }}>Select up to 4 species. List adjusts based on your fishing setup above.</p>
              <SpeciesSelector available={availableSpecies} selected={species} onChange={setSpecies} max={4} />
            </section>

            {/* Error */}
            {error && (
              <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.625rem', padding: '0.875rem 1rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !!dateError || !location || species.length === 0}
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.875rem' }}
            >
              Generate Fishing Plan
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

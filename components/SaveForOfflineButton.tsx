'use client'

import { useState, useEffect } from 'react'
import { saveOfflinePlan, getOfflinePlan, deleteOfflinePlan } from '@/lib/offline-db'

interface Props {
  sessionId: string
}

type State = 'idle' | 'saving' | 'saved'

export default function SaveForOfflineButton({ sessionId }: Props) {
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    getOfflinePlan(sessionId).then((plan) => {
      if (plan) setState('saved')
    })
  }, [sessionId])

  async function handleSave() {
    setState('saving')
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Failed to fetch plan data')
      const data = await res.json()

      const plans = (data.fishingPlans ?? []).map((fp: { planContent: unknown }) => {
        const content = typeof fp.planContent === 'string' ? JSON.parse(fp.planContent) : fp.planContent
        return content
      })

      const marineByDate: Record<string, unknown> = {}
      for (const md of data.marineData ?? []) {
        marineByDate[md.date] = {
          tides: JSON.parse(md.tideData),
          periods: JSON.parse(md.openMeteoData)?.periods ?? [],
          windHourly: JSON.parse(md.willyWeatherData)?.windHourly ?? [],
          pressureHourly: JSON.parse(md.willyWeatherData)?.pressureHourly ?? [],
        }
      }

      await saveOfflinePlan({
        sessionId,
        savedAt: Date.now(),
        session: {
          id: data.id,
          locationName: data.locationName,
          latitude: data.latitude,
          longitude: data.longitude,
          startDate: data.startDate,
          endDate: data.endDate,
          fishingType: data.fishingType,
          selectedSpecies: (data.selectedSpecies ?? []).map((s: { speciesName: string }) => s.speciesName),
        },
        plans,
        marineByDate,
      })

      // Warm the SW navigation cache for this plan page
      if ('caches' in window) {
        try {
          const cache = await window.caches.open('fishfinder-plans-v1')
          await cache.add(`/plan/${sessionId}`)
        } catch {
          // Cache warming is best-effort
        }
      }

      setState('saved')
    } catch (err) {
      console.error('Save for offline failed:', err)
      setState('idle')
    }
  }

  async function handleRemove() {
    await deleteOfflinePlan(sessionId)
    if ('caches' in window) {
      try {
        const cache = await window.caches.open('fishfinder-plans-v1')
        await cache.delete(`/plan/${sessionId}`)
      } catch {}
    }
    setState('idle')
  }

  if (state === 'saved') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '8px',
            background: 'rgba(60,191,174,0.1)',
            border: '1px solid rgba(60,191,174,0.3)',
            color: '#3CBFAE',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Available Offline
        </span>
        <button
          type="button"
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(139,167,186,0.6)',
            fontSize: '0.75rem',
            padding: '0.25rem',
          }}
          title="Remove offline copy"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={state === 'saving'}
      className="btn-secondary"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        opacity: state === 'saving' ? 0.6 : 1,
      }}
    >
      {state === 'saving' ? (
        <>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} aria-hidden="true" />
          Saving…
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save Offline
        </>
      )}
    </button>
  )
}

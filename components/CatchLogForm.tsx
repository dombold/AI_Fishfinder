'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

function localDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  onSuccess: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-mist)',
  marginBottom: '0.375rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function CatchLogForm({ onSuccess }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [species, setSpecies] = useState('')
  const [date, setDate] = useState(localDateStr())
  const [quantity, setQuantity] = useState(1)
  const [weightKg, setWeightKg] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setError('Pin your catch location on the map'); return }
    if (!species.trim()) { setError('Species is required'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/catch-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          latitude: location.lat,
          longitude: location.lng,
          species: species.trim(),
          quantity,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
          notes: notes.trim() || undefined,
        }),
      })
      if (res.ok) {
        setSpecies('')
        setDate(localDateStr())
        setQuantity(1)
        setWeightKg('')
        setLengthCm('')
        setNotes('')
        setLocation(null)
        onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Map */}
      <div>
        <label style={labelStyle}>Catch Location {location ? `— ${location.lat.toFixed(4)}°S, ${location.lng.toFixed(4)}°E` : '— click map to pin'}</label>
        <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(107,143,163,0.2)' }}>
          <MapPicker value={location} onChange={setLocation} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {/* Species */}
        <div>
          <label style={labelStyle}>Species</label>
          <input
            type="text"
            value={species}
            onChange={e => setSpecies(e.target.value)}
            placeholder="e.g. Dhufish"
            maxLength={100}
          />
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            max={localDateStr()}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Quantity */}
        <div>
          <label style={labelStyle}>Quantity</label>
          <input
            type="number"
            value={quantity}
            min={1}
            max={1000}
            onChange={e => setQuantity(Number(e.target.value))}
          />
        </div>

        {/* Weight */}
        <div>
          <label style={labelStyle}>Weight (kg) — optional</label>
          <input
            type="number"
            value={weightKg}
            min={0}
            step={0.1}
            onChange={e => setWeightKg(e.target.value)}
            placeholder="e.g. 2.4"
          />
        </div>

        {/* Length */}
        <div>
          <label style={labelStyle}>Length (cm) — optional</label>
          <input
            type="number"
            value={lengthCm}
            min={0}
            step={1}
            onChange={e => setLengthCm(e.target.value)}
            placeholder="e.g. 65"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes — optional</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Bait used, conditions, technique…"
          maxLength={500}
          rows={2}
          style={{ resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(224,92,42,0.12)', border: '1px solid rgba(224,92,42,0.35)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
        {loading ? '…' : 'Log Catch'}
      </button>
    </form>
  )
}

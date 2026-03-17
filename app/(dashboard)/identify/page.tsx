'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import exifr from 'exifr'
import DashboardNav from '@/components/DashboardNav'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

function localDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mimeType, 0.85)
      resolve({ base64: dataUrl.split(',')[1], mimeType })
    }
    img.onerror = reject
    img.src = objectUrl
  })
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

const pillStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  padding: '0.1875rem 0.5rem',
  borderRadius: '999px',
  background: 'rgba(61,184,200,0.1)',
  border: '1px solid rgba(61,184,200,0.3)',
  color: 'var(--color-seafoam)',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '0.625rem 0',
  borderBottom: '1px solid rgba(107,143,163,0.1)',
}

interface Identified {
  species: string
  count: number
  environment: string
  method: string
}

interface Rules {
  bioregion: string
  regulation: {
    minSize?: string
    bagLimit: string
    combinedLimit?: string
    seasonalClosures?: string
    notes?: string
    closureActive?: boolean
    closureReason?: string
  } | null
  closures: { severity: 'CLOSED' | 'RESTRICTED' | 'SEASONAL'; message: string }[]
}

function bioregionLabel(b: string) {
  const labels: Record<string, string> = {
    'north-coast': 'North Coast Bioregion',
    'gascoyne': 'Gascoyne Bioregion',
    'west-coast': 'West Coast Bioregion',
    'south-coast': 'South Coast Bioregion',
  }
  return labels[b] ?? b
}

function severityColor(severity: string) {
  if (severity === 'CLOSED') return { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.35)', text: '#DC2626' }
  if (severity === 'RESTRICTED') return { bg: 'rgba(224,92,42,0.1)', border: 'rgba(224,92,42,0.35)', text: 'var(--color-warning)' }
  return { bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.35)', text: 'var(--color-sand)' }
}

export default function IdentifyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photoBase64, setPhotoBase64]   = useState<string | null>(null)
  const [photoMime, setPhotoMime]       = useState('image/jpeg')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [location, setLocation]         = useState<{ lat: number; lng: number } | null>(null)
  const [date, setDate]                 = useState(localDateStr())
  const [gpsFromPhoto, setGpsFromPhoto] = useState(false)

  const [phase, setPhase]               = useState<'upload' | 'loading' | 'results'>('upload')
  const [error, setError]               = useState('')

  const [identified, setIdentified]     = useState<Identified | null>(null)
  const [rules, setRules]               = useState<Rules | null>(null)
  const [rulesLoading, setRulesLoading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setGpsFromPhoto(false)
    try {
      const exifData = await exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: false, xmp: false, icc: false }).catch(() => null)

      if (exifData?.latitude != null && exifData?.longitude != null) {
        setLocation({ lat: exifData.latitude, lng: exifData.longitude })
        setGpsFromPhoto(true)
      }

      if (exifData?.DateTimeOriginal instanceof Date) {
        const dt = exifData.DateTimeOriginal as Date
        const offset = typeof exifData.OffsetTimeOriginal === 'string' ? exifData.OffsetTimeOriginal : '+00:00'
        const match = offset.match(/([+-])(\d{2}):(\d{2})/)
        const offsetMins = match ? (match[1] === '+' ? 1 : -1) * (parseInt(match[2]) * 60 + parseInt(match[3])) : 0
        const local = new Date(dt.getTime() + offsetMins * 60_000)
        const y = local.getUTCFullYear()
        const mo = String(local.getUTCMonth() + 1).padStart(2, '0')
        const d = String(local.getUTCDate()).padStart(2, '0')
        setDate(`${y}-${mo}-${d}`)
      }

      const { base64, mimeType } = await resizeImage(file)
      setPhotoBase64(base64)
      setPhotoMime(mimeType)
      setPhotoPreview(`data:${mimeType};base64,${base64}`)
    } catch {
      setError('Could not read image')
    }
  }

  async function handleIdentify() {
    if (!photoBase64 || !location) return
    setPhase('loading')
    setError('')
    setIdentified(null)
    setRules(null)

    try {
      const idRes = await fetch('/api/identify-species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoBase64, mimeType: photoMime }),
      })
      const idData = await idRes.json()

      if (!idRes.ok || !idData.species) {
        setError(idData.error ?? 'Could not identify species — try a clearer photo')
        setPhase('upload')
        return
      }

      setIdentified(idData)
      setPhase('results')

      setRulesLoading(true)
      fetch('/api/fish-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: idData.species, latitude: location.lat, longitude: location.lng }),
      })
        .then(r => r.json())
        .then(d => setRules(d))
        .catch(() => {})
        .finally(() => setRulesLoading(false))
    } catch {
      setError('Network error')
      setPhase('upload')
    }
  }

  function reset() {
    setPhase('upload')
    setError('')
    setIdentified(null)
    setRules(null)
    setPhotoBase64(null)
    setPhotoMime('image/jpeg')
    setPhotoPreview(null)
    setLocation(null)
    setDate(localDateStr())
    setGpsFromPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canIdentify = !!photoBase64 && !!location

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
            Fish Identifier
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Upload a photo and pin your location — AI will identify the species and show the WA fishing rules for where you caught it.
          </p>
        </div>

        {/* Upload form — always visible unless loading */}
        {phase !== 'loading' && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Photo upload */}
            <div>
              <label style={labelStyle}>Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost"
                  style={{ fontSize: '0.8125rem' }}
                >
                  {photoPreview ? '📷 Change Photo' : '📷 Upload Photo'}
                </button>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Fish photo"
                    style={{ height: '80px', width: 'auto', borderRadius: '0.375rem', border: '1px solid rgba(107,143,163,0.25)', objectFit: 'cover' }}
                  />
                )}
              </div>
              {gpsFromPhoto && (
                <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-seafoam)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>📍</span> Location set from photo — tap map to override
                </p>
              )}
            </div>

            {/* Map */}
            <div>
              <label style={labelStyle}>
                Catch Location{location ? ` — ${Math.abs(location.lat).toFixed(4)}°S, ${location.lng.toFixed(4)}°E` : ' — click map to pin'}
              </label>
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(107,143,163,0.2)' }}>
                <MapPicker value={location} height={420} onChange={loc => { setLocation(loc); setGpsFromPhoto(false) }} />
              </div>
            </div>

            {/* Date */}
            <div style={{ maxWidth: '220px' }}>
              <label style={labelStyle}>Date caught</label>
              <input
                type="date"
                value={date}
                max={localDateStr()}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(224,92,42,0.12)', border: '1px solid rgba(224,92,42,0.35)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleIdentify}
              disabled={!canIdentify}
              style={{ justifyContent: 'center', opacity: canIdentify ? 1 : 0.45 }}
            >
              ✦ Identify Fish
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
            </div>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>Identifying species…</p>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && identified && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Species card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Identified fish"
                    style={{ height: '80px', width: 'auto', borderRadius: '0.5rem', border: '1px solid rgba(107,143,163,0.25)', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-seafoam)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                    Identified Species
                  </p>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', color: 'var(--color-foam)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                    {identified.species}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {identified.count > 1 && <span style={pillStyle}>×{identified.count}</span>}
                    {identified.environment !== 'unknown' && (
                      <span style={pillStyle}>{identified.environment.charAt(0).toUpperCase() + identified.environment.slice(1)}</span>
                    )}
                    {identified.method !== 'unknown' && (
                      <span style={pillStyle}>{identified.method.charAt(0).toUpperCase() + identified.method.slice(1)}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-mist)', fontSize: '0.8125rem', textDecoration: 'underline' }}
              >
                Not this fish? Try again
              </button>
            </div>

            {/* Rules card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-seafoam)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                WA Fishing Rules
              </p>

              {rulesLoading && (
                <div style={{ display: 'flex', gap: '4px', padding: '1rem', justifyContent: 'center' }}>
                  <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                </div>
              )}

              {!rulesLoading && rules && (
                <>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-mist)', marginBottom: '1rem' }}>
                    {bioregionLabel(rules.bioregion)}
                    {location && (
                      <span style={{ marginLeft: '0.5rem', color: 'rgba(107,143,163,0.6)' }}>
                        · {Math.abs(location.lat).toFixed(3)}°S, {location.lng.toFixed(3)}°E
                      </span>
                    )}
                  </p>

                  {/* Active closure banners */}
                  {(rules.regulation?.closureActive || rules.closures.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {rules.regulation?.closureActive && rules.regulation.closureReason && (() => {
                        const c = severityColor('CLOSED')
                        return (
                          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.text, marginRight: '0.5rem' }}>CLOSED</span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-foam)', lineHeight: 1.6 }}>{rules.regulation.closureReason}</span>
                          </div>
                        )
                      })()}
                      {rules.closures.map((w, i) => {
                        const c = severityColor(w.severity)
                        return (
                          <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.text, marginRight: '0.5rem' }}>{w.severity}</span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-foam)', lineHeight: 1.6 }}>{w.message}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {rules.regulation ? (
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={rowStyle}>
                        <span style={{ color: 'var(--color-mist)', flexShrink: 0 }}>Minimum size</span>
                        <span style={{ color: 'var(--color-foam)', textAlign: 'right' }}>{rules.regulation.minSize ?? 'No minimum'}</span>
                      </div>
                      <div style={rowStyle}>
                        <span style={{ color: 'var(--color-mist)', flexShrink: 0 }}>Daily bag limit</span>
                        <span style={{ color: 'var(--color-foam)', textAlign: 'right' }}>{rules.regulation.bagLimit}</span>
                      </div>
                      {rules.regulation.combinedLimit && (
                        <div style={rowStyle}>
                          <span style={{ color: 'var(--color-mist)', flexShrink: 0 }}>Combined limit</span>
                          <span style={{ color: 'var(--color-foam)', textAlign: 'right' }}>{rules.regulation.combinedLimit}</span>
                        </div>
                      )}
                      {rules.regulation.seasonalClosures && (
                        <div style={rowStyle}>
                          <span style={{ color: 'var(--color-mist)', flexShrink: 0 }}>Seasonal closures</span>
                          <span style={{ color: 'var(--color-foam)', textAlign: 'right' }}>{rules.regulation.seasonalClosures}</span>
                        </div>
                      )}
                      {rules.regulation.notes && (
                        <div style={{ ...rowStyle, borderBottom: 'none' }}>
                          <span style={{ color: 'var(--color-mist)', flexShrink: 0 }}>Notes</span>
                          <span style={{ color: 'var(--color-foam)', textAlign: 'right' }}>{rules.regulation.notes}</span>
                        </div>
                      )}
                      {!rules.regulation.seasonalClosures && !rules.regulation.notes && (
                        <div style={{ ...rowStyle, borderBottom: 'none' }} />
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(107,143,163,0.08)', border: '1px solid rgba(107,143,163,0.2)', borderRadius: '0.5rem', padding: '0.875rem 1rem', color: 'var(--color-mist)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      No specific WA regulations found for <strong style={{ color: 'var(--color-foam)' }}>{identified.species}</strong> — please verify at fish.wa.gov.au before fishing.
                    </div>
                  )}

                  <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.6)' }}>
                    Regulations sourced from DPIRD 2026.{' '}
                    <a
                      href="https://fish.wa.gov.au"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-seafoam)', textDecoration: 'underline' }}
                    >
                      Always verify at fish.wa.gov.au ↗
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import exifr from 'exifr'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

function localDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  onSuccess: () => void
  catchId?: string
  initialValues?: {
    date: string
    latitude: number
    longitude: number
    species: string
    quantity: number
    weightKg: number | null
    lengthCm: number | null
    notes: string | null
    captureTime: string | null
    environment: string | null
    fishingMethod: string | null
  }
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

/** Resize an image file to max 1024px, returning { base64, mimeType } */
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

export default function CatchLogForm({ onSuccess, catchId, initialValues }: Props) {
  const isEditing = !!catchId
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialValues?.latitude != null ? { lat: initialValues.latitude, lng: initialValues.longitude } : null
  )
  const [species, setSpecies] = useState(initialValues?.species ?? '')
  const [date, setDate] = useState(initialValues?.date ?? localDateStr())
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? 1)
  const [weightKg, setWeightKg] = useState(initialValues?.weightKg != null ? String(initialValues.weightKg) : '')
  const [lengthCm, setLengthCm] = useState(initialValues?.lengthCm != null ? String(initialValues.lengthCm) : '')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Photo ID state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg')
  const [identifying, setIdentifying] = useState(false)
  const [identifyError, setIdentifyError] = useState('')
  const [gpsFromPhoto, setGpsFromPhoto] = useState(false)
  const [captureTime, setCaptureTime] = useState(initialValues?.captureTime ?? '')
  const [identifyMeta, setIdentifyMeta] = useState<{ count: number; environment: string; method: string } | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIdentifyError('')
    setGpsFromPhoto(false)
    setCaptureTime('')
    setIdentifyMeta(null)
    try {
      // Read GPS + EXIF time from raw file BEFORE canvas resize (which strips EXIF)
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
        const h = String(local.getUTCHours()).padStart(2, '0')
        const min = String(local.getUTCMinutes()).padStart(2, '0')
        setDate(`${y}-${mo}-${d}`)
        setCaptureTime(`${h}:${min}`)
      }

      const { base64, mimeType } = await resizeImage(file)
      setPhotoBase64(base64)
      setPhotoMime(mimeType)
      setPhotoPreview(`data:${mimeType};base64,${base64}`)
    } catch {
      setIdentifyError('Could not read image')
    }
  }

  async function handleIdentify() {
    if (!photoBase64) return
    setIdentifying(true)
    setIdentifyError('')
    try {
      const res = await fetch('/api/identify-species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoBase64, mimeType: photoMime }),
      })
      const data = await res.json()
      if (res.ok && data.species) {
        setSpecies(data.species)
        if (data.count > 1) setQuantity(data.count)
        setIdentifyMeta({ count: data.count ?? 1, environment: data.environment ?? 'unknown', method: data.method ?? 'unknown' })
      } else {
        setIdentifyError(data.error ?? 'Identification failed')
      }
    } catch {
      setIdentifyError('Network error')
    } finally {
      setIdentifying(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setError('Pin your catch location on the map'); return }
    if (!species.trim()) { setError('Species is required'); return }

    setLoading(true)
    setError('')
    try {
      const payload = {
        date,
        latitude: location.lat,
        longitude: location.lng,
        species: species.trim(),
        quantity,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
        notes: notes.trim() || undefined,
        captureTime: captureTime || undefined,
        fishCount: identifyMeta?.count,
        environment: identifyMeta?.environment,
        fishingMethod: identifyMeta?.method,
      }
      const res = await fetch(isEditing ? `/api/catch-log/${catchId}` : '/api/catch-log', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        if (!isEditing) {
          setSpecies('')
          setDate(localDateStr())
          setQuantity(1)
          setWeightKg('')
          setLengthCm('')
          setNotes('')
          setLocation(null)
          setGpsFromPhoto(false)
          setCaptureTime('')
          setIdentifyMeta(null)
          setPhotoPreview(null)
          setPhotoBase64(null)
        }
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
          <MapPicker value={location} onChange={loc => { setLocation(loc); setGpsFromPhoto(false) }} />
        </div>
      </div>

      {/* Photo ID */}
      <div>
        <label style={labelStyle}>Photo ID — optional</label>
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
            {photoPreview ? '📷 Change Photo' : '📷 Add Photo'}
          </button>
          {photoBase64 && (
            <button
              type="button"
              onClick={handleIdentify}
              disabled={identifying}
              className="btn-ghost"
              style={{ fontSize: '0.8125rem', color: 'var(--color-seafoam)', borderColor: 'rgba(61,184,200,0.4)' }}
            >
              {identifying ? '…Identifying' : '✦ Identify Species'}
            </button>
          )}
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Catch photo preview"
              style={{ height: '80px', width: 'auto', borderRadius: '0.375rem', border: '1px solid rgba(107,143,163,0.25)', objectFit: 'cover' }}
            />
          )}
        </div>
        {identifyError && (
          <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-warning)' }}>{identifyError}</p>
        )}
        {gpsFromPhoto && (
          <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-seafoam)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>📍</span> Location set from photo — tap map to override
          </p>
        )}
        {identifyMeta && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            {identifyMeta.environment !== 'unknown' && (
              <span style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: 'rgba(61,184,200,0.1)', border: '1px solid rgba(61,184,200,0.3)', color: 'var(--color-seafoam)' }}>
                {identifyMeta.environment.charAt(0).toUpperCase() + identifyMeta.environment.slice(1)}
              </span>
            )}
            {identifyMeta.method !== 'unknown' && (
              <span style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: 'rgba(61,184,200,0.1)', border: '1px solid rgba(61,184,200,0.3)', color: 'var(--color-seafoam)' }}>
                {identifyMeta.method.charAt(0).toUpperCase() + identifyMeta.method.slice(1)}
              </span>
            )}
            {identifyMeta.count > 1 && (
              <span style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: 'rgba(61,184,200,0.1)', border: '1px solid rgba(61,184,200,0.3)', color: 'var(--color-seafoam)' }}>
                ×{identifyMeta.count}
              </span>
            )}
          </div>
        )}
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

        {/* Time */}
        <div>
          <label style={labelStyle}>Time — optional</label>
          <input
            type="time"
            value={captureTime}
            onChange={e => setCaptureTime(e.target.value)}
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
        {loading ? '…' : isEditing ? 'Save Changes' : 'Log Catch'}
      </button>
    </form>
  )
}

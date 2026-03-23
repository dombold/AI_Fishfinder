'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import exifr from 'exifr'
import CoordInput from './CoordInput'
import { resizeImage } from '@/lib/image-utils'
import { addPendingCatch, addPendingEdit } from '@/lib/offline-db'

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
    sst: number | null
    tideDirection: string | null
    moonPhase: string | null
    waterDepthM: number | null
    shared: boolean
    sharedGroupIds?: string[]
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

export default function CatchLogForm({ onSuccess, catchId, initialValues }: Props) {
  const isEditing = !!catchId

  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
  const [offlineSaved, setOfflineSaved] = useState(false)

  // Photo state
  const fileInputRef      = useRef<HTMLInputElement>(null)
  const cameraInputRef    = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg')
  const [identifying, setIdentifying] = useState(false)
  const [identifyError, setIdentifyError] = useState('')
  const [gpsFromPhoto, setGpsFromPhoto] = useState(false)
  const [captureTime, setCaptureTime] = useState(initialValues?.captureTime ?? '')
  const [identifyMeta, setIdentifyMeta] = useState<{ count: number; environment: string; method: string } | null>(null)

  // GPS button state
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const [shared, setShared] = useState(initialValues?.shared ?? true)
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [sharedGroupIds, setSharedGroupIds] = useState<string[]>(initialValues?.sharedGroupIds ?? [])

  // Conditions state
  const [sst, setSst] = useState<string>(initialValues?.sst != null ? String(initialValues.sst) : '')
  const [tideDirection, setTideDirection] = useState<string>(initialValues?.tideDirection ?? '')
  const [moonPhase, setMoonPhase] = useState<string>(initialValues?.moonPhase ?? '')
  const [waterDepthM, setWaterDepthM] = useState<string>(initialValues?.waterDepthM != null ? String(initialValues.waterDepthM) : '')
  const [conditionsLoading, setConditionsLoading] = useState(false)
  const [conditionsFetched, setConditionsFetched] = useState(isEditing)

  // Auto-fetch conditions when online + location + date are set
  useEffect(() => {
    if (!location || !date || conditionsFetched || !isOnline) return
    let cancelled = false
    setConditionsLoading(true)
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      date,
      ...(captureTime ? { time: captureTime } : {}),
    })
    fetch(`/api/catch-conditions?${params}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.sst != null) setSst(String(data.sst))
        if (data.tideDirection) setTideDirection(data.tideDirection)
        if (data.moonPhase) setMoonPhase(data.moonPhase)
        if (data.waterDepthM != null) setWaterDepthM(String(data.waterDepthM))
        setConditionsFetched(true)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setConditionsLoading(false) })
    return () => { cancelled = true }
  }, [location, date, captureTime, conditionsFetched, isOnline])

  // Fetch user's groups once (for per-group sharing checkboxes)
  useEffect(() => {
    if (!isOnline) return
    setGroupsLoading(true)
    fetch('/api/groups')
      .then(r => r.json())
      .then(data => setGroups(data.groups ?? []))
      .catch(() => {})
      .finally(() => setGroupsLoading(false))
  }, [isOnline])

  async function processFile(file: File) {
    setIdentifyError('')
    setGpsFromPhoto(false)
    setCaptureTime('')
    setIdentifyMeta(null)
    setPhotoFile(file)
    try {
      const exifData = await exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: false, xmp: false, icc: false }).catch(() => null)

      if (exifData?.latitude != null && exifData?.longitude != null) {
        setLocation({ lat: exifData.latitude, lng: exifData.longitude })
        setGpsFromPhoto(true)
        setConditionsFetched(false)
      }

      if (exifData?.DateTimeOriginal instanceof Date) {
        const dt = exifData.DateTimeOriginal as Date
        const offset = typeof exifData.OffsetTimeOriginal === 'string' ? exifData.OffsetTimeOriginal : '+00:00'
        const match = offset.match(/([+-])(\d{2}):(\d{2})/)
        const offsetMins = match ? (match[1] === '+' ? 1 : -1) * (parseInt(match[2]) * 60 + parseInt(match[3])) : 0
        const local = new Date(dt.getTime() + offsetMins * 60_000)
        const y  = local.getUTCFullYear()
        const mo = String(local.getUTCMonth() + 1).padStart(2, '0')
        const d  = String(local.getUTCDate()).padStart(2, '0')
        const h  = String(local.getUTCHours()).padStart(2, '0')
        const min = String(local.getUTCMinutes()).padStart(2, '0')
        setDate(`${y}-${mo}-${d}`)
        setCaptureTime(`${h}:${min}`)
        setConditionsFetched(false)
      }

      const { base64, mimeType } = await resizeImage(file)
      setPhotoBase64(base64)
      setPhotoMime(mimeType)
      setPhotoPreview(`data:${mimeType};base64,${base64}`)
    } catch {
      setIdentifyError('Could not read image')
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
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

  function handleUseMyLocation() {
    setGpsError('')
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setConditionsFetched(false)
        setGpsLoading(false)
      },
      () => {
        setGpsError('Could not get GPS location')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  function resetForm() {
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
    setPhotoFile(null)
    setSst('')
    setTideDirection('')
    setMoonPhase('')
    setWaterDepthM('')
    setShared(true)
    setSharedGroupIds([])
    setConditionsFetched(false)
    setOfflineSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setError('Pin your catch location on the map or use "Use My Location"'); return }
    if (!species.trim()) { setError('Species is required'); return }

    setLoading(true)
    setError('')

    const formData = {
      date,
      latitude: location.lat,
      longitude: location.lng,
      species: species.trim(),
      quantity,
      ...(weightKg ? { weightKg: parseFloat(weightKg) } : {}),
      ...(lengthCm ? { lengthCm: parseFloat(lengthCm) } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(captureTime ? { captureTime } : {}),
      ...(identifyMeta ? { fishCount: identifyMeta.count, environment: identifyMeta.environment, fishingMethod: identifyMeta.method } : {}),
      ...(sst ? { sst: parseFloat(sst) } : {}),
      ...(tideDirection ? { tideDirection } : {}),
      ...(moonPhase.trim() ? { moonPhase: moonPhase.trim() } : {}),
      ...(waterDepthM ? { waterDepthM: parseFloat(waterDepthM) } : {}),
      shared,
      sharedGroupIds: shared ? [] : sharedGroupIds,
    }

    // ─── Offline path ──────────────────────────────────────────────────────
    if (!isOnline) {
      try {
        if (isEditing) {
          await addPendingEdit({ type: 'patch', catchId: catchId!, queuedAt: Date.now(), data: formData })
        } else {
          await addPendingCatch({ queuedAt: Date.now(), photoBlob: photoFile ?? null, formData })
        }
        window.dispatchEvent(new CustomEvent('pending-catches-changed'))
        setOfflineSaved(true)
        if (!isEditing) resetForm()
        onSuccess()
      } catch {
        setError('Could not save offline. Try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    // ─── Online path ───────────────────────────────────────────────────────
    try {
      const payload = {
        ...formData,
        ...(photoBase64 ? { photoBase64 } : {}),
      }
      const res = await fetch(isEditing ? `/api/catch-log/${catchId}` : '/api/catch-log', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        if (!isEditing) resetForm()
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

  if (offlineSaved) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem' }}>📶</div>
        <p style={{ color: 'var(--color-foam)', fontWeight: 600 }}>Catch saved offline</p>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
          It will upload automatically when you&apos;re back online.
        </p>
        <button type="button" className="btn-secondary" onClick={() => setOfflineSaved(false)}>Log Another</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {!isOnline && (
        <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#C9A84C' }}>
          You&apos;re offline. Your catch will be saved locally and synced when you reconnect.
        </div>
      )}

      {/* Location */}
      <div>
        <label style={labelStyle}>Catch Location</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <CoordInput
              value={location}
              onChange={loc => {
                setLocation(loc)
                if (loc) setConditionsFetched(false)
              }}
            />
          </div>
          {/* GPS button — works offline */}
          {'geolocation' in navigator && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsLoading}
              className="btn-ghost"
              style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', opacity: gpsLoading ? 0.6 : 1 }}
            >
              {gpsLoading ? '…' : '📍 Use My Location'}
            </button>
          )}
        </div>
        {gpsError && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginBottom: '0.5rem' }}>{gpsError}</p>
        )}

        {/* Map — hidden when offline (no tiles) */}
        {isOnline ? (
          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(107,143,163,0.2)' }}>
            <MapPicker
              value={location}
              height={420}
              onChange={loc => {
                setLocation(loc)
                setGpsFromPhoto(false)
                setConditionsFetched(false)
              }}
            />
          </div>
        ) : (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-mist)', padding: '0.5rem 0' }}>
            Map unavailable offline — use coordinates above or &quot;Use My Location&quot;
          </p>
        )}
      </div>

      {/* Photo */}
      <div>
        <label style={labelStyle}>Photo — optional</label>
        {/* Hidden inputs */}
        <input ref={fileInputRef}   type="file" accept="image/*"                           onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"     onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-ghost" style={{ fontSize: '0.8125rem' }}>
            📷 Camera
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}   className="btn-ghost" style={{ fontSize: '0.8125rem' }}>
            {photoPreview ? '🖼 Change Photo' : '🖼 Gallery'}
          </button>
          {photoBase64 && (
            <button
              type="button"
              onClick={handleIdentify}
              disabled={identifying || !isOnline}
              className="btn-ghost"
              title={!isOnline ? 'Available when online' : undefined}
              style={{ fontSize: '0.8125rem', color: isOnline ? 'var(--color-seafoam)' : 'var(--color-mist)', borderColor: isOnline ? 'rgba(61,184,200,0.4)' : 'rgba(107,143,163,0.2)', cursor: !isOnline ? 'not-allowed' : undefined }}
            >
              {identifying ? '…Identifying' : '✦ Identify Species'}
              {!isOnline && ' (offline)'}
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
        <div>
          <label style={labelStyle}>Species</label>
          <input type="text" value={species} onChange={e => setSpecies(e.target.value)} placeholder="e.g. Dhufish" maxLength={100} />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" value={date} max={localDateStr()} onChange={e => { setDate(e.target.value); setConditionsFetched(false) }} />
        </div>
        <div>
          <label style={labelStyle}>Time — optional</label>
          <input type="time" value={captureTime} onChange={e => setCaptureTime(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Quantity</label>
          <input type="number" value={quantity} min={1} max={1000} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Weight (kg) — optional</label>
          <input type="number" value={weightKg} min={0} step={0.1} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 2.4" />
        </div>
        <div>
          <label style={labelStyle}>Length (cm) — optional</label>
          <input type="number" value={lengthCm} min={0} step={1} onChange={e => setLengthCm(e.target.value)} placeholder="e.g. 65" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notes — optional</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bait used, conditions, technique…" maxLength={500} rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Conditions */}
      <div>
        <label style={labelStyle}>
          Conditions — optional
          {conditionsLoading && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--color-seafoam)', fontSize: '0.75rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              fetching…
            </span>
          )}
          {!isOnline && !conditionsFetched && (
            <span style={{ marginLeft: '0.5rem', color: 'rgba(201,168,76,0.7)', fontSize: '0.75rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              auto-fill unavailable offline
            </span>
          )}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div>
            <label style={labelStyle}>SST (°C)</label>
            <input type="number" value={sst} min={-5} max={40} step={0.1} onChange={e => setSst(e.target.value)} placeholder="e.g. 22.4" />
          </div>
          <div>
            <label style={labelStyle}>Water Depth (m)</label>
            <input type="number" value={waterDepthM} min={0} step={0.1} onChange={e => setWaterDepthM(e.target.value)} placeholder="e.g. 18" />
          </div>
          <div>
            <label style={labelStyle}>Tide</label>
            <select value={tideDirection} onChange={e => setTideDirection(e.target.value)}>
              <option value="">—</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="slack">Slack</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Moon Phase</label>
            <input type="text" value={moonPhase} onChange={e => setMoonPhase(e.target.value)} placeholder="e.g. Waxing Gibbous" maxLength={50} />
          </div>
        </div>
      </div>

      {/* Share with groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* "Share with all groups" master checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => {
              setShared(v => {
                if (!v) setSharedGroupIds([])
                return !v
              })
            }}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              border: `1.5px solid ${shared ? 'var(--color-seafoam)' : 'rgba(107,143,163,0.4)'}`,
              background: shared ? 'rgba(61,184,200,0.15)' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 150ms, background 150ms',
            }}
          >
            {shared && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                <path d="M1 4.5L4 7.5L10 1.5" stroke="var(--color-seafoam)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-mist)' }}>Share with all groups</span>
        </label>

        {/* Per-group checkboxes — visible when "share with all" is unchecked */}
        {!shared && (
          <div style={{ paddingLeft: '1.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {!isOnline ? (
              <p style={{ fontSize: '0.75rem', color: 'rgba(201,168,76,0.7)', margin: 0 }}>
                Per-group sharing unavailable offline
              </p>
            ) : groupsLoading ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-mist)' }}>Loading groups…</span>
            ) : groups.length === 0 ? null : (
              <>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-mist)', margin: '0 0 0.125rem' }}>
                  Share with specific groups:
                </p>
                {groups.map(g => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                    <div
                      onClick={() =>
                        setSharedGroupIds(prev =>
                          prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]
                        )
                      }
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `1.5px solid ${sharedGroupIds.includes(g.id) ? 'var(--color-seafoam)' : 'rgba(107,143,163,0.4)'}`,
                        background: sharedGroupIds.includes(g.id) ? 'rgba(61,184,200,0.15)' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'border-color 150ms, background 150ms',
                      }}
                    >
                      {sharedGroupIds.includes(g.id) && (
                        <svg width="10" height="8" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                          <path d="M1 4.5L4 7.5L10 1.5" stroke="var(--color-seafoam)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-foam)' }}>{g.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(224,92,42,0.12)', border: '1px solid rgba(224,92,42,0.35)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
        {loading ? '…' : isEditing ? 'Save Changes' : isOnline ? 'Log Catch' : 'Save Offline'}
      </button>
    </form>
  )
}

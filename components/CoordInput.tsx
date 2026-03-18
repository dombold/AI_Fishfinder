'use client'

import { useEffect, useRef, useState } from 'react'
import { parseCoords, formatCoords } from '@/lib/parse-coords'

interface CoordInputProps {
  value: { lat: number; lng: number } | null
  onChange: (loc: { lat: number; lng: number } | null) => void
}

export default function CoordInput({ value, onChange }: CoordInputProps) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')

  // Track last value we pushed INTO the text field (from map/EXIF)
  // so we don't overwrite the user's typing with a reflected-back value.
  const lastExternalRef = useRef<string | null>(null)

  // When value changes from outside (map click, EXIF), update the text field.
  useEffect(() => {
    if (value === null) return
    const canonical = formatCoords(value.lat, value.lng)
    // Only update text if this is genuinely an external change
    if (lastExternalRef.current !== canonical) {
      lastExternalRef.current = canonical
      setText(canonical)
      setStatus('valid')
    }
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setText(raw)
    lastExternalRef.current = null // user is typing — don't treat next value change as external

    if (raw.trim() === '') {
      setStatus('idle')
      onChange(null)
      return
    }

    const parsed = parseCoords(raw)
    if (parsed) {
      setStatus('valid')
      onChange(parsed)
    } else {
      setStatus('invalid')
      // Don't call onChange(null) here — keep the last valid location on the map
      // so the user sees where they were while still typing
    }
  }

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="e.g. 21°53′S 113°58′E  or  -21.889, 113.966"
        aria-label="Coordinates"
        autoComplete="off"
        spellCheck={false}
      />
      {status === 'valid' && (
        <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M3.5 6 L5 7.5 L8.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Coordinates parsed
        </p>
      )}
      {status === 'invalid' && (
        <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-warning)' }}>
          Unrecognised format — try <em>21°53′S 113°58′E</em> or <em>-21.889, 113.966</em>
        </p>
      )}
    </div>
  )
}

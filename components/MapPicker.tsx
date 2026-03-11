'use client'

import dynamic from 'next/dynamic'

const MapPickerInner = dynamic(() => import('./MapPickerInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '320px',
      background: 'rgba(14,42,69,0.6)',
      borderRadius: '0.75rem',
      border: '1px solid rgba(107,143,163,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-mist)',
      fontSize: '0.875rem',
    }}>
      Loading map…
    </div>
  ),
})

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (coords: { lat: number; lng: number }) => void
}

export default function MapPicker({ value, onChange }: Props) {
  return <MapPickerInner value={value} onChange={onChange} />
}

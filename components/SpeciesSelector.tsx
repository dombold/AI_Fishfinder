'use client'

interface Props {
  available: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  max?: number
}

export default function SpeciesSelector({ available, selected, onChange, max = 4 }: Props) {
  function toggle(species: string) {
    if (selected.includes(species)) {
      onChange(selected.filter(s => s !== species))
    } else if (selected.length < max) {
      onChange([...selected, species])
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {available.map(species => {
          const isSelected = selected.includes(species)
          const isDisabled = !isSelected && selected.length >= max
          return (
            <button
              key={species}
              type="button"
              onClick={() => toggle(species)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '2rem',
                border: isSelected ? '1px solid var(--color-seafoam)' : '1px solid rgba(107,143,163,0.3)',
                background: isSelected ? 'rgba(59,191,174,0.15)' : 'rgba(14,42,69,0.4)',
                color: isSelected ? 'var(--color-seafoam)' : isDisabled ? 'rgba(107,143,163,0.4)' : 'var(--color-mist)',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'border-color 150ms, background 150ms, color 150ms',
                fontFamily: 'var(--font-body)',
              }}
            >
              {species}
            </button>
          )
        })}
      </div>
      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-mist)' }}>
        {selected.length}/{max} selected
        {selected.length >= max && ' — remove a selection to change'}
      </p>
    </div>
  )
}

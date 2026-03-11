'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-ghost"
      style={{ fontSize: '0.875rem' }}
    >
      🖨 Print Briefing
    </button>
  )
}

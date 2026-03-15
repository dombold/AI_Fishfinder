import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'
import RegulationsDropdown from '@/components/RegulationsDropdown'

interface Props {
  backHref?: string
  backLabel?: string
}

export default function DashboardNav({ backHref, backLabel = '← Dashboard' }: Props) {
  return (
    <nav style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,25,41,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '28px', width: 'auto' }} />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {backHref && (
          <Link href={backHref} style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
            {backLabel}
          </Link>
        )}
        <Link href="/dashboard" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Plan</Link>
        <RegulationsDropdown />
        <Link href="/contact" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Contact</Link>
        <Link href="/about" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>About</Link>
        <UserDropdown />
      </div>
    </nav>
  )
}

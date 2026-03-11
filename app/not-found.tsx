import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌊</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>
          404
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '1rem', marginBottom: '0.5rem' }}>
          These waters are uncharted.
        </p>
        <p style={{ color: 'rgba(107,143,163,0.6)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

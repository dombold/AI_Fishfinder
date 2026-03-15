import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Fishfinder — Western Australia',
  description: 'AI-powered fishing plans for Western Australia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdn.tailwindcss.com" async></script>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  )
}

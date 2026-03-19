'use client'

import { SessionProvider } from 'next-auth/react'
import SwRegister from '@/app/components/SwRegister'
import OfflineBanner from '@/components/OfflineBanner'
import AppFooter from '@/components/AppFooter'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SwRegister />
      <OfflineBanner />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <AppFooter />
      </div>
    </SessionProvider>
  )
}

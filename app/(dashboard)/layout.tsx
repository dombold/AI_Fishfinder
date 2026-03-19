'use client'

import { SessionProvider } from 'next-auth/react'
import SwRegister from '@/app/components/SwRegister'
import OfflineBanner from '@/components/OfflineBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SwRegister />
      <OfflineBanner />
      {children}
    </SessionProvider>
  )
}

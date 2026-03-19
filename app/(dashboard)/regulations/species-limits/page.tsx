import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'
import SpeciesLimitsClient from './SpeciesLimitsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Species Limits — AI Fishfinder' }

export default async function SpeciesLimitsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav />
      <SpeciesLimitsClient />
    </div>
  )
}

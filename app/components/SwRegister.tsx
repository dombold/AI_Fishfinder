'use client'

import { useEffect } from 'react'
import { syncPendingCatches } from '@/lib/sync-manager'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Listen for background sync trigger from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_CATCHES') {
            syncPendingCatches()
          }
        })

        // Register background sync if supported (Chromium enhancement)
        if ('sync' in registration) {
          window.addEventListener('online', () => {
            ;(registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync
              .register('pending-catches')
              .catch(() => {
                // Background sync not supported — fall back to direct sync
                syncPendingCatches()
              })
          })
        } else {
          // No background sync — sync directly when online
          window.addEventListener('online', () => {
            syncPendingCatches()
          })
        }
      })
      .catch((err) => {
        console.warn('SW registration failed:', err)
      })
  }, [])

  return null
}

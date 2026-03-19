import { listPendingCatches, deletePendingCatch, listPendingEdits, deletePendingEdit } from './offline-db'
import { blobToBase64 } from './image-utils'

export interface SyncResult {
  synced: number
  failed: number
}

let syncInProgress = false

export async function syncPendingCatches(): Promise<SyncResult> {
  if (syncInProgress) return { synced: 0, failed: 0 }
  syncInProgress = true

  let synced = 0
  let failed = 0

  try {
    // ─── Sync pending new catches ─────────────────────────────────────────
    const catches = await listPendingCatches()

    for (const entry of catches) {
      try {
        let photoBase64: string | undefined
        if (entry.photoBlob) {
          photoBase64 = await blobToBase64(entry.photoBlob)
        }

        const res = await fetch('/api/catch-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...entry.formData,
            ...(photoBase64 ? { photoBase64 } : {}),
          }),
        })

        if (res.status === 201 || res.ok) {
          await deletePendingCatch(entry.localId!)
          synced++
        } else if (res.status >= 400 && res.status < 500) {
          // Bad data — skip permanently
          await deletePendingCatch(entry.localId!)
          failed++
        } else {
          // Server error — stop and keep remaining in queue
          failed++
          break
        }
      } catch {
        // Network error — stop
        failed++
        break
      }
    }

    // ─── Sync pending edits (PATCH / DELETE) ─────────────────────────────
    const edits = await listPendingEdits()

    for (const edit of edits) {
      try {
        const res = await fetch(`/api/catch-log/${edit.catchId}`, {
          method: edit.type === 'delete' ? 'DELETE' : 'PATCH',
          ...(edit.type === 'patch' && edit.data
            ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit.data) }
            : {}),
        })

        if (res.ok || res.status === 204 || (res.status >= 400 && res.status < 500)) {
          await deletePendingEdit(edit.localId!)
          synced++
        } else {
          failed++
          break
        }
      } catch {
        failed++
        break
      }
    }
  } finally {
    syncInProgress = false
  }

  // Notify UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catches-synced', { detail: { synced, failed } }))
  }

  return { synced, failed }
}

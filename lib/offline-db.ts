import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'fishfinder-offline'
const DB_VERSION = 1

export interface OfflinePlan {
  sessionId: string
  savedAt: number
  session: {
    id: string
    locationName: string | null
    latitude: number
    longitude: number
    startDate: string
    endDate: string
    fishingType: string
    selectedSpecies: string[]
  }
  plans: unknown[]
  marineByDate: Record<string, unknown>
}

export interface PendingCatch {
  localId?: number
  queuedAt: number
  photoBlob: Blob | null
  formData: {
    date: string
    latitude: number
    longitude: number
    species: string
    quantity: number
    weightKg?: number
    lengthCm?: number
    notes?: string
    captureTime?: string
    fishCount?: number
    environment?: string
    fishingMethod?: string
    sst?: number
    tideDirection?: string
    moonPhase?: string
    waterDepthM?: number
  }
}

export interface PendingEdit {
  localId?: number
  type: 'patch' | 'delete'
  catchId: string
  queuedAt: number
  data?: Partial<PendingCatch['formData']>
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offlinePlans')) {
          db.createObjectStore('offlinePlans', { keyPath: 'sessionId' })
        }
        if (!db.objectStoreNames.contains('pendingCatches')) {
          db.createObjectStore('pendingCatches', { keyPath: 'localId', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('pendingEdits')) {
          db.createObjectStore('pendingEdits', { keyPath: 'localId', autoIncrement: true })
        }
      },
    })
  }
  return dbPromise
}

// ─── Offline Plans ──────────────────────────────────────────────────────────

export async function saveOfflinePlan(plan: OfflinePlan): Promise<void> {
  const db = await getDb()
  await db.put('offlinePlans', plan)
}

export async function getOfflinePlan(sessionId: string): Promise<OfflinePlan | undefined> {
  const db = await getDb()
  return db.get('offlinePlans', sessionId)
}

export async function deleteOfflinePlan(sessionId: string): Promise<void> {
  const db = await getDb()
  await db.delete('offlinePlans', sessionId)
}

export async function listOfflinePlanIds(): Promise<string[]> {
  const db = await getDb()
  return db.getAllKeys('offlinePlans') as Promise<string[]>
}

// ─── Pending Catches ────────────────────────────────────────────────────────

export async function addPendingCatch(entry: Omit<PendingCatch, 'localId'>): Promise<number> {
  const db = await getDb()
  return db.add('pendingCatches', entry) as Promise<number>
}

export async function listPendingCatches(): Promise<PendingCatch[]> {
  const db = await getDb()
  return db.getAll('pendingCatches')
}

export async function deletePendingCatch(localId: number): Promise<void> {
  const db = await getDb()
  await db.delete('pendingCatches', localId)
}

// ─── Pending Edits ──────────────────────────────────────────────────────────

export async function addPendingEdit(edit: Omit<PendingEdit, 'localId'>): Promise<number> {
  const db = await getDb()
  return db.add('pendingEdits', edit) as Promise<number>
}

export async function listPendingEdits(): Promise<PendingEdit[]> {
  const db = await getDb()
  return db.getAll('pendingEdits')
}

export async function deletePendingEdit(localId: number): Promise<void> {
  const db = await getDb()
  await db.delete('pendingEdits', localId)
}

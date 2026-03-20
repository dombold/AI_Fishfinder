'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import { resizeImage } from '@/lib/image-utils'

interface Group {
  id: string
  name: string
  avatar: string | null
  ownerId: string
  owner: { id: string; username: string }
  memberCount: number
  createdAt: string
}

interface Invite {
  id: string
  group: { id: string; name: string; owner: { username: string } }
  createdAt: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const [gRes, iRes] = await Promise.all([fetch('/api/groups'), fetch('/api/invites')])
      const [gData, iData] = await Promise.all([gRes.json(), iRes.json()])
      setGroups(gData.groups ?? [])
      setInvites(iData.invites ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAvatarFile(file: File) {
    try {
      const { base64, mimeType } = await resizeImage(file)
      setNewAvatar(`data:${mimeType};base64,${base64}`)
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const body: { name: string; avatar?: string } = { name: newName.trim() }
      if (newAvatar) body.avatar = newAvatar
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const group = await res.json()
        setNewName('')
        setNewAvatar(null)
        setShowCreate(false)
        router.push(`/groups/${group.id}`)
      } else {
        const data = await res.json()
        setCreateError(data.error ?? 'Failed to create group')
      }
    } catch {
      setCreateError('Network error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
              Groups
            </h1>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
              Share catches with your fishing crew.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowCreate(v => !v)}
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem', flexShrink: 0, marginTop: '0.25rem' }}
          >
            {showCreate ? '✕ Cancel' : '+ Create Group'}
          </button>
        </div>

        {/* Create group form */}
        {showCreate && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                {/* Avatar picker */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Add group photo"
                  style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    background: newAvatar ? 'transparent' : 'rgba(61,184,200,0.08)',
                    border: '2px dashed rgba(61,184,200,0.35)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {newAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={newAvatar} alt="Group avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📷</span>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleAvatarFile(e.target.files[0]) }}
                />
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Group name…"
                  maxLength={60}
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={creating || !newName.trim()} style={{ flexShrink: 0 }}>
                  {creating ? '…' : 'Create'}
                </button>
              </div>
            </form>
            {createError && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>{createError}</p>
            )}
          </div>
        )}

        {/* Pending invites banner */}
        {invites.length > 0 && (
          <Link
            href="/invites"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', marginBottom: '1.25rem', background: 'rgba(61,184,200,0.08)', border: '1px solid rgba(61,184,200,0.25)', borderRadius: '0.625rem', textDecoration: 'none', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-seafoam)', background: 'rgba(61,184,200,0.15)', border: '1px solid rgba(61,184,200,0.3)', borderRadius: '20px', padding: '0.1rem 0.5rem' }}>
                {invites.length}
              </span>
              <span style={{ color: 'var(--color-foam)', fontSize: '0.875rem' }}>
                pending group invite{invites.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span style={{ color: 'var(--color-seafoam)', fontSize: '0.8125rem' }}>View →</span>
          </Link>
        )}

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : groups.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              No groups yet.
            </p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
              Create a group to share catches with your crew.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {groups.map(g => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer' }}>
                  {g.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.avatar} alt={g.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(61,184,200,0.3)' }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--color-current)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--color-foam)', flexShrink: 0 }}>
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {g.name}
                    </p>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                      {g.memberCount} member{g.memberCount !== 1 ? 's' : ''} · owned by {g.owner.username}
                    </p>
                  </div>
                  <span style={{ color: 'var(--color-seafoam)', fontSize: '1rem', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardNav from '@/components/DashboardNav'

interface Member {
  id: string
  username: string
  avatar: string | null
  joinedAt: string
}

interface CatchEntry {
  id: string
  date: string
  latitude: number
  longitude: number
  species: string
  quantity: number
  weightKg: number | null
  lengthCm: number | null
  notes: string | null
  sst: number | null
  tideDirection: string | null
  moonPhase: string | null
  waterDepthM: number | null
  photoBase64: string | null
  user: { id: string; username: string; avatar: string | null }
}

interface GroupDetail {
  id: string
  name: string
  ownerId: string
  owner: { id: string; username: string }
  createdAt: string
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? null

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [catches, setCatches] = useState<CatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [gRes, mRes, cRes] = await Promise.all([
        fetch(`/api/groups`),
        fetch(`/api/groups/${groupId}/members`),
        fetch(`/api/groups/${groupId}/catches`),
      ])

      if (mRes.status === 403) { router.replace('/groups'); return }

      const [gData, mData, cData] = await Promise.all([gRes.json(), mRes.json(), cRes.json()])

      // Find this group from the list
      const found = gData.groups?.find((g: GroupDetail) => g.id === groupId)
      if (found) setGroup(found)

      setMembers(mData.members ?? [])
      setCatches(cData.catches ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [groupId, router])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteUsername.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteUsername.trim() }),
      })
      if (res.ok) {
        setInviteSuccess(`Invite sent to ${inviteUsername.trim()}`)
        setInviteUsername('')
        setShowInvite(false)
      } else {
        const data = await res.json()
        setInviteError(data.error ?? 'Failed to send invite')
      }
    } catch {
      setInviteError('Network error')
    } finally {
      setInviting(false)
    }
  }

  async function handleLeave() {
    if (!currentUserId) return
    if (!confirm('Leave this group?')) return
    try {
      await fetch(`/api/groups/${groupId}/members/${currentUserId}`, { method: 'DELETE' })
      router.push('/groups')
    } catch {}
  }

  async function handleDelete() {
    if (!confirm(`Delete group "${group?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) router.push('/groups')
    } catch {}
    finally { setDeleting(false) }
  }

  async function handleRemoveMember(userId: string, username: string) {
    if (!confirm(`Remove ${username} from the group?`)) return
    setRemovingId(userId)
    try {
      await fetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch {}
    finally { setRemovingId(null) }
  }

  const isOwner = group?.ownerId === currentUserId

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
        <DashboardNav backHref="/groups" backLabel="← Groups" />
        <div style={{ display: 'flex', gap: '4px', padding: '4rem', justifyContent: 'center' }}>
          <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav backHref="/groups" backLabel="← Groups" />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>

        {/* Group header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
                {group?.name ?? '…'}
              </h1>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                {members.length} member{members.length !== 1 ? 's' : ''} · owned by {group?.owner.username}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              {isOwner ? (
                <button type="button" className="btn-ghost" onClick={handleDelete} disabled={deleting} style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', borderColor: 'rgba(224,92,42,0.3)' }}>
                  {deleting ? '…' : 'Delete Group'}
                </button>
              ) : (
                <button type="button" className="btn-ghost" onClick={handleLeave} style={{ fontSize: '0.8125rem' }}>
                  Leave Group
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members section */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Members
            </p>
            {isOwner && (
              <button type="button" className="btn-ghost" onClick={() => setShowInvite(v => !v)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {showInvite ? '✕' : '+ Invite'}
              </button>
            )}
          </div>

          {showInvite && (
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                placeholder="Username…"
                maxLength={30}
                style={{ flex: 1, minWidth: '160px', fontSize: '0.875rem' }}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={inviting || !inviteUsername.trim()} style={{ flexShrink: 0, fontSize: '0.8125rem' }}>
                {inviting ? '…' : 'Send Invite'}
              </button>
              {inviteError && <p style={{ width: '100%', fontSize: '0.8125rem', color: 'var(--color-warning)', marginTop: '-0.25rem' }}>{inviteError}</p>}
            </form>
          )}
          {inviteSuccess && (
            <p style={{ marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-seafoam)' }}>✓ {inviteSuccess}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar} alt={m.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(61,184,200,0.3)' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-current)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: 'var(--color-foam)', flexShrink: 0 }}>
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ color: 'var(--color-foam)', fontSize: '0.875rem', flex: 1 }}>{m.username}</span>
                {group?.ownerId === m.id && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-seafoam)', background: 'rgba(61,184,200,0.1)', border: '1px solid rgba(61,184,200,0.25)', borderRadius: '20px', padding: '0.1rem 0.45rem' }}>owner</span>
                )}
                {isOwner && m.id !== currentUserId && m.id !== group?.ownerId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id, m.username)}
                    disabled={removingId === m.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(224,92,42,0.5)', fontSize: '0.875rem', padding: '0.125rem', lineHeight: 1 }}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group catch feed */}
        <div>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
            Shared Catches
          </p>

          {catches.length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                No shared catches yet. Members can share catches from their Catch Log.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {catches.map(c => (
                <div key={c.id} className="card" style={{ padding: '0.875rem 1.25rem' }}>
                  {/* Member attribution */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                    {c.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.user.avatar} alt={c.user.username} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(61,184,200,0.25)' }} />
                    ) : (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-current)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontFamily: 'var(--font-display)', color: 'var(--color-foam)', flexShrink: 0 }}>
                        {c.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-seafoam)', fontWeight: 600 }}>{c.user.username}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {c.photoBase64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/jpeg;base64,${c.photoBase64}`}
                        alt={`${c.species} catch photo`}
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(107,143,163,0.2)' }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                        {c.species}{' '}
                        <span style={{ color: 'var(--color-mist)', fontWeight: 400, fontSize: '0.875rem' }}>
                          × {c.quantity}{c.weightKg ? ` · ${c.weightKg}kg` : ''}{c.lengthCm ? ` · ${c.lengthCm}cm` : ''}
                        </span>
                      </p>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                        {new Date(c.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{Math.abs(c.latitude).toFixed(3)}°S, {c.longitude.toFixed(3)}°E
                      </p>
                      {c.notes && (
                        <p style={{ color: 'rgba(107,143,163,0.7)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{c.notes}</p>
                      )}
                      {(c.sst != null || c.tideDirection || c.moonPhase || c.waterDepthM != null) && (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {c.sst != null && (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(10,126,164,0.12)', border: '1px solid rgba(10,126,164,0.3)', color: 'var(--color-current, #2196c4)' }}>
                              {c.sst.toFixed(1)}°C
                            </span>
                          )}
                          {c.waterDepthM != null && (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(10,126,164,0.08)', border: '1px solid rgba(10,126,164,0.25)', color: 'var(--color-current, #2196c4)' }}>
                              {c.waterDepthM % 1 === 0 ? c.waterDepthM : c.waterDepthM.toFixed(1)}m depth
                            </span>
                          )}
                          {c.tideDirection && (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(60,191,174,0.1)', border: '1px solid rgba(60,191,174,0.3)', color: 'var(--color-seafoam)' }}>
                              {c.tideDirection.charAt(0).toUpperCase() + c.tideDirection.slice(1)} tide
                            </span>
                          )}
                          {c.moonPhase && (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--color-sand, #c9a84c)' }}>
                              {c.moonPhase}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

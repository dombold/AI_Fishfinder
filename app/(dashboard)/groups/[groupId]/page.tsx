'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardNav from '@/components/DashboardNav'
import { resizeImage } from '@/lib/image-utils'

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
  avatar: string | null
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
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [updatingAvatar, setUpdatingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

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

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === group?.name) { setEditingName(false); return }
    setRenaming(true)
    setRenameError('')
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        setGroup(prev => prev ? { ...prev, name: trimmed } : prev)
        setEditingName(false)
      } else {
        const data = await res.json()
        setRenameError(data.error ?? 'Failed to rename group')
      }
    } catch {
      setRenameError('Network error')
    } finally {
      setRenaming(false)
    }
  }

  async function handleAvatarUpdate(file: File) {
    setUpdatingAvatar(true)
    try {
      const { base64, mimeType } = await resizeImage(file)
      const dataUri = `data:${mimeType};base64,${base64}`
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: dataUri }),
      })
      if (res.ok) {
        const data = await res.json()
        setGroup(prev => prev ? { ...prev, avatar: data.group.avatar } : prev)
      }
    } catch {}
    finally { setUpdatingAvatar(false) }
  }

  const isOwner = group?.ownerId === currentUserId

  // Group catches by user, ordered by most recent catch date
  const catchesByUser: { user: CatchEntry['user']; catches: CatchEntry[] }[] = []
  {
    const map = new Map<string, { user: CatchEntry['user']; catches: CatchEntry[] }>()
    for (const c of catches) {
      if (!map.has(c.user.id)) map.set(c.user.id, { user: c.user, catches: [] })
      map.get(c.user.id)!.catches.push(c)
    }
    for (const entry of map.values()) {
      catchesByUser.push(entry)
    }
    // Sort by most recent catch date descending
    catchesByUser.sort((a, b) => {
      const aDate = a.catches[0]?.date ?? ''
      const bDate = b.catches[0]?.date ?? ''
      return bDate.localeCompare(aDate)
    })
  }

  function toggleUser(userId: string) {
    setExpandedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
        <DashboardNav />
        <div style={{ display: 'flex', gap: '4px', padding: '4rem', justifyContent: 'center' }}>
          <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>

        {/* Group header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {/* Group avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {group?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.avatar!} alt={group.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(61,184,200,0.35)', opacity: updatingAvatar ? 0.5 : 1 }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-current)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', border: '2px solid rgba(61,184,200,0.2)', opacity: updatingAvatar ? 0.5 : 1 }}>
                    {group?.name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change group photo"
                    disabled={updatingAvatar}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-depths)', border: '1px solid rgba(61,184,200,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', padding: 0 }}
                  >✏️</button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleAvatarUpdate(e.target.files[0]) }}
                />
              </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <form onSubmit={handleRename} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={60}
                    autoFocus
                    style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', flex: 1, minWidth: '160px' }}
                  />
                  <button type="submit" className="btn-primary" disabled={renaming} style={{ flexShrink: 0, fontSize: '0.8125rem', padding: '0.4rem 0.9rem' }}>
                    {renaming ? '…' : 'Save'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setEditingName(false); setRenameError('') }} style={{ flexShrink: 0, fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>
                    Cancel
                  </button>
                  {renameError && <p style={{ width: '100%', fontSize: '0.8125rem', color: 'var(--color-warning)', margin: 0 }}>{renameError}</p>}
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', margin: 0 }}>
                    {group?.name ?? '…'}
                  </h1>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => { setNameInput(group?.name ?? ''); setEditingName(true) }}
                      title="Rename group"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(107,143,163,0.6)', padding: '0.25rem', lineHeight: 1, flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-seafoam)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(107,143,163,0.6)')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                {members.length} member{members.length !== 1 ? 's' : ''} · owned by {group?.owner.username}
              </p>
            </div>
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
              {catchesByUser.map(({ user: u, catches: userCatches }) => {
                const expanded = expandedUsers.has(u.id)
                return (
                  <div key={u.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* User summary header — clickable */}
                    <button
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.875rem 1.25rem', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {u.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar} alt={u.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(61,184,200,0.3)' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-current)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', color: 'var(--color-foam)', flexShrink: 0 }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ flex: 1, color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600 }}>{u.username}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-seafoam)', background: 'rgba(61,184,200,0.1)', border: '1px solid rgba(61,184,200,0.2)', borderRadius: '999px', padding: '0.15rem 0.6rem', flexShrink: 0 }}>
                        {userCatches.length} catch{userCatches.length !== 1 ? 'es' : ''}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(107,143,163,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Expanded catch list */}
                    {expanded && (
                      <div style={{ borderTop: '1px solid rgba(107,143,163,0.12)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {userCatches.map((c, i) => (
                          <div key={c.id} style={{ padding: '0.875rem 1.25rem', borderTop: i > 0 ? '1px solid rgba(107,143,163,0.08)' : undefined }}>
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

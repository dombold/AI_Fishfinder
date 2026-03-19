'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardNav from '@/components/DashboardNav'

interface Invite {
  id: string
  group: {
    id: string
    name: string
    owner: { id: string; username: string }
  }
  createdAt: string
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/invites')
      const data = await res.json()
      setInvites(data.invites ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  async function handleAction(membershipId: string, action: 'accept' | 'decline') {
    setActionId(membershipId)
    try {
      const res = await fetch(`/api/invites/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok || res.status === 204) {
        setInvites(prev => prev.filter(i => i.id !== membershipId))
        window.dispatchEvent(new Event('focus')) // refresh InviteBadge count
      }
    } catch {}
    finally { setActionId(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>
      <DashboardNav />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
            Invites
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
            Pending group invitations.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : invites.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
              No pending invites.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invites.map(invite => (
              <div key={invite.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                    {invite.group.name}
                  </p>
                  <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                    Invited by {invite.group.owner.username} · {new Date(invite.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleAction(invite.id, 'decline')}
                    disabled={actionId === invite.id}
                    style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', borderColor: 'rgba(224,92,42,0.3)', padding: '0.3rem 0.75rem' }}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleAction(invite.id, 'accept')}
                    disabled={actionId === invite.id}
                    style={{ fontSize: '0.8125rem', padding: '0.3rem 0.875rem' }}
                  >
                    {actionId === invite.id ? '…' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

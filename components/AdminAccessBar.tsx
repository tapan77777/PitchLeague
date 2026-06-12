'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LEAGUES_KEY = 'pitchleague_admin_leagues'

interface AdminLeague { slug: string; name: string; created_at: string }

export default function AdminAccessBar() {
  const [league, setLeague] = useState<AdminLeague | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEAGUES_KEY)
      const leagues: AdminLeague[] = raw ? JSON.parse(raw) : []
      if (leagues.length > 0) setLeague(leagues[0])
    } catch { /* ignore */ }
  }, [])

  if (!league || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, display: 'flex', alignItems: 'center',
      pointerEvents: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#111', border: '1px solid #333', borderRadius: 999,
        padding: '9px 16px 9px 18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
      }}>
        <Link
          href={`/admin/dashboard?league=${league.slug}`}
          style={{
            fontFamily: "'Arial', sans-serif", fontSize: 13, fontWeight: 700,
            color: '#c9a84c', textDecoration: 'none',
          }}
        >
          ⚙ Manage {league.name.length > 20 ? league.name.slice(0, 20) + '…' : league.name} →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', color: '#555',
            cursor: 'pointer', fontSize: 18, lineHeight: 1,
            padding: '0 0 0 4px', display: 'flex', alignItems: 'center',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

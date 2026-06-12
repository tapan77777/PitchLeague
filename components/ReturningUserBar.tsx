'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllSessions } from '@/lib/member'
import { getAdminLeagues } from '@/lib/admin'

export default function ReturningUserBar() {
  const [adminLeague, setAdminLeague] = useState<{ slug: string; name: string } | null>(null)
  const [memberSlug, setMemberSlug] = useState<string | null>(null)

  useEffect(() => {
    const admins = getAdminLeagues()
    if (admins.length > 0) setAdminLeague(admins[0])

    const sessions = getAllSessions()
    if (sessions?.leagues) {
      const entries = Object.entries(sessions.leagues)
      if (entries.length > 0) {
        // pick most recently joined
        const sorted = entries.sort((a, b) =>
          new Date(b[1].joined_at).getTime() - new Date(a[1].joined_at).getTime()
        )
        setMemberSlug(sorted[0][0])
      }
    }
  }, [])

  if (!adminLeague && !memberSlug) return null

  return (
    <div style={{
      borderBottom: '1px solid #141414',
      background: 'rgba(10,10,10,0.92)',
      padding: '8px 20px',
    }}>
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
      }}>
        {memberSlug && (
          <Link
            href={`/play/${memberSlug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#c9a84c',
              fontSize: 12, fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            ▶ Continue Playing
          </Link>
        )}
        {adminLeague && (
          <Link
            href={`/admin/dashboard?league=${adminLeague.slug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(45,198,83,0.07)',
              border: '1px solid rgba(45,198,83,0.18)',
              color: '#2dc653',
              fontSize: 12, fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            ⚙ {adminLeague.name}
          </Link>
        )}
      </div>
    </div>
  )
}

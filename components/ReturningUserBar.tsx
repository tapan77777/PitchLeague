'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllSessions } from '@/lib/member'
import { getAdminLeagues } from '@/lib/admin'

export default function ReturningUserBar() {
  const [adminLeagues, setAdminLeagues] = useState<{ slug: string; name: string }[]>([])
  const [memberLeagues, setMemberLeagues] = useState<{ slug: string }[]>([])

  useEffect(() => {
    setAdminLeagues(getAdminLeagues())
    const sessions = getAllSessions()
    if (sessions?.leagues) {
      setMemberLeagues(Object.keys(sessions.leagues).map(slug => ({ slug })))
    }
  }, [])

  if (adminLeagues.length === 0 && memberLeagues.length === 0) return null

  return (
    <div className="border-b border-zinc-900 bg-zinc-950/80 px-5 py-2.5">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2">
        {adminLeagues.length > 0 && (
          <>
            <span className="text-zinc-600 text-xs shrink-0">🏆 Your league:</span>
            {adminLeagues.map(l => (
              <Link
                key={l.slug}
                href={`/admin/dashboard?league=${l.slug}`}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                {l.name} →
              </Link>
            ))}
          </>
        )}
        {memberLeagues.length > 0 && (
          <>
            <span className="text-zinc-600 text-xs shrink-0 ml-2">⚽ Playing in:</span>
            {memberLeagues.map(l => (
              <Link
                key={l.slug}
                href={`/play/${l.slug}`}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-colors"
              >
                Continue →
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

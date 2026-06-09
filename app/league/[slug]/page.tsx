'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, saveMemberSession } from '@/lib/member'

interface LeagueData {
  id: string
  name: string
  description: string | null
  welcome_message: string | null
  primary_color: string
  accent_color: string
  logo_url: string | null
  invite_code: string
  slug: string
}

export default function LeagueJoinPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const router = useRouter()

  const [league, setLeague] = useState<LeagueData | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchLeague() {
      try {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name, description, welcome_message, primary_color, accent_color, logo_url, invite_code, slug')
          .eq('slug', slug)
          .maybeSingle()

        if (error) {
          console.error('[league page] fetch error:', error)
          setNotFound(true)
          return
        }
        if (!data) {
          console.log('[league page] no league for slug:', slug)
          setNotFound(true)
          return
        }

        setLeague(data as LeagueData)

        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', data.id)

        setMemberCount(count ?? 0)
      } catch (err) {
        console.error('[league page] unexpected error:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchLeague()
  }, [slug])

  useEffect(() => {
    if (!loading && league) inputRef.current?.focus()
  }, [loading, league])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!league || !displayName.trim()) return

    setJoining(true)
    setJoinError('')

    try {
      const member_id = getOrCreateMemberId()

      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: league.invite_code,
          display_name: displayName.trim(),
          member_id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setJoinError(data.error || 'Failed to join. Please try again.')
        setJoining(false)
        return
      }

      saveMemberSession({
        member_id,
        display_name: displayName.trim(),
        league_id: league.id,
        slug: league.slug,
      })

      router.push(`/play/${slug}`)
    } catch {
      setJoinError('Network error. Please try again.')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !league) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 text-center">
        <span className="text-5xl mb-4">🏟️</span>
        <h1 className="text-2xl font-extrabold text-white mb-2">League not found</h1>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs">
          This league link may be invalid or the league may have been removed.
        </p>
        <Link
          href="/"
          className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-full transition-colors text-sm"
        >
          Go to PitchLeague
        </Link>
      </div>
    )
  }

  const primary = league.primary_color || '#16a34a'
  const accent = league.accent_color || '#15803d'

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      style={{ '--league-primary': primary, '--league-accent': accent } as React.CSSProperties}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${primary} 0%, transparent 70%)` }}
      />

      <div className="relative max-w-lg mx-auto px-5 pt-12 pb-20">

        {/* ── Hero ── */}
        <section className="flex flex-col items-center text-center mb-10">
          {league.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={league.logo_url}
              alt={`${league.name} logo`}
              className="w-16 h-16 rounded-2xl object-cover mb-4 border-2"
              style={{ borderColor: primary }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-4 border-2"
              style={{ backgroundColor: primary + '22', borderColor: primary, color: primary }}
            >
              {league.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div
            className="text-xs font-semibold tracking-widest uppercase mb-3 px-3 py-1 rounded-full border"
            style={{ color: primary, borderColor: primary + '44', backgroundColor: primary + '11' }}
          >
            FIFA 2026 Prediction League
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3"
            style={{ color: primary }}
          >
            {league.name}
          </h1>

          {(league.welcome_message || league.description) && (
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-sm mb-4">
              {league.welcome_message || league.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <span>👥</span>
            <span>
              <strong className="text-white">{memberCount}</strong>{' '}
              {memberCount === 1 ? 'member' : 'members'} joined
            </span>
          </div>
        </section>

        {/* ── Join form ── */}
        <section className="mb-10">
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: primary + '33', backgroundColor: primary + '08' }}
          >
            <p className="text-lg font-bold mb-1 text-center">Join this league</p>
            <p className="text-zinc-500 text-sm text-center mb-6">
              Enter your name to start predicting — no password needed.
            </p>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-300">
                  Your name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rohan, Priya, The Boss…"
                  maxLength={30}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
              </div>

              {joinError && (
                <p className="text-red-400 text-xs">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={joining || !displayName.trim()}
                className="w-full font-bold py-3.5 rounded-full transition-opacity disabled:opacity-50 text-black flex items-center justify-center gap-2"
                style={{ backgroundColor: primary }}
              >
                {joining ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Joining…
                  </>
                ) : (
                  '⚽ Join League'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ── Preview ── */}
        <section>
          <h2 className="text-center text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-5">
            What you&apos;ll be doing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { emoji: '🎯', title: 'Predict Scores', desc: 'Call the exact scoreline before every match.' },
              { emoji: '📈', title: 'Climb the Leaderboard', desc: 'Earn points. Rise to the top.' },
              { emoji: '📲', title: 'Share Your Picks', desc: 'Auto-generated cards for Instagram & WhatsApp.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
                  style={{ backgroundColor: primary + '22' }}
                >
                  {emoji}
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: primary }}>{title}</p>
                <p className="text-zinc-500 text-xs leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-zinc-700 text-xs mt-12">
          Powered by{' '}
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            PitchLeague
          </Link>{' '}
          · FIFA 2026 ⚽
        </p>
      </div>
    </div>
  )
}

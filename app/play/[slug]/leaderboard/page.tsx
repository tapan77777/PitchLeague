'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, hasJoinedLeague } from '@/lib/member'
import { getLeagueThemeVars, getLeagueShareUrl } from '@/lib/utils'
import { League, Badge, LeaderboardEntry } from '@/types'
import LeaderboardRow from '@/components/shared/LeaderboardRow'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import { Copy, Check } from 'lucide-react'

interface PageData {
  league: League
  entries: LeaderboardEntry[]
  matchesPlayed: number
}

export default function PlayLeaderboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()

  const [memberId, setMemberId] = useState('')
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const id = getOrCreateMemberId()
    if (!id || !hasJoinedLeague(slug)) { router.replace(`/league/${slug}`); return }
    setMemberId(id)
  }, [slug, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const leagueRes = await supabase.from('leagues').select('*').eq('slug', slug).maybeSingle()
      if (!leagueRes.data) { setError('league_not_found'); setLoading(false); return }
      const leagueId = leagueRes.data.id

      const [membersRes, badgesRes, matchCountRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', leagueId)
          .order('total_points', { ascending: false })
          .order('correct_predictions', { ascending: false }),
        supabase.from('badges').select('*').eq('league_id', leagueId),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
      ])

      const badgeMap: Record<string, Badge[]> = {}
      for (const b of badgesRes.data ?? []) {
        if (!badgeMap[b.clerk_id]) badgeMap[b.clerk_id] = []
        badgeMap[b.clerk_id].push(b)
      }

      const entries: LeaderboardEntry[] = (membersRes.data ?? []).map((m, i) => ({
        rank: i + 1,
        clerk_id: m.clerk_id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        total_points: m.total_points,
        correct_predictions: m.correct_predictions,
        exact_scores: m.exact_scores,
        current_streak: m.current_streak,
        badges: badgeMap[m.clerk_id] ?? [],
      }))

      setData({ league: leagueRes.data, entries, matchesPlayed: matchCountRes.count ?? 0 })

    } catch (err) {
      console.error('[play leaderboard]', err)
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (memberId) fetchData()
  }, [memberId, fetchData])

  async function copyInviteLink() {
    if (!data) return
    await navigator.clipboard.writeText(getLeagueShareUrl(data.league.slug))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !memberId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-zinc-400 text-sm mb-4">Failed to load leaderboard.</p>
        <button onClick={() => fetchData()}
          className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, entries, matchesPlayed } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const myEntry = entries.find(e => e.clerk_id === memberId)
  const top3 = entries.slice(0, 3)

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24" style={themeVars}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            {league.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={league.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ backgroundColor: primary + '33', color: primary }}>{league.name.charAt(0)}</div>
            }
            <span className="font-bold text-sm truncate">{league.name}</span>
          </div>
          <div className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{ color: primary, borderColor: primary + '44', backgroundColor: primary + '11' }}>
            {matchesPlayed} {matchesPlayed === 1 ? 'match' : 'matches'} played
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* My rank card */}
        {myEntry && (
          <div className="rounded-2xl border p-4" style={{ borderColor: primary, backgroundColor: primary + '18' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary }}>
              Your Position
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
                style={{ borderColor: primary + '66', backgroundColor: primary + '22', color: primary }}>
                {myEntry.display_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{myEntry.display_name}</p>
                <p className="text-xs mt-0.5" style={{ color: primary }}>
                  Rank #{myEntry.rank} of {entries.length}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black leading-none" style={{ color: primary }}>{myEntry.total_points}</p>
                <p className="text-zinc-500 text-xs mt-0.5">points</p>
              </div>
            </div>
          </div>
        )}

        {/* Invite nudge */}
        {entries.length <= 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <span className="text-4xl block mb-3">👀</span>
            <p className="font-bold text-sm text-white mb-1">Invite more people!</p>
            <p className="text-zinc-500 text-xs mb-4">Share the league link to get the competition going.</p>
            <button onClick={copyInviteLink}
              className="flex items-center gap-2 mx-auto font-semibold text-sm px-4 py-2.5 rounded-full border transition-colors"
              style={{ color: copied ? '#000' : primary, borderColor: primary, backgroundColor: copied ? primary : primary + '11' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        )}

        {/* Podium */}
        {top3.length >= 3 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Top 3</p>
            <div className="flex items-end justify-center gap-3">
              <PodiumSlot entry={top3[1]} place={2} />
              <PodiumSlot entry={top3[0]} place={1} />
              <PodiumSlot entry={top3[2]} place={3} />
            </div>
          </div>
        )}

        {/* Full list */}
        {entries.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Full standings</p>
            <div className="space-y-2">
              {entries.map(entry => (
                <LeaderboardRow
                  key={entry.clerk_id}
                  entry={entry}
                  isCurrentUser={entry.clerk_id === memberId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

const PODIUM_CFG = {
  1: { height: 'h-24', color: '#eab308', label: '1st' },
  2: { height: 'h-16', color: '#a1a1aa', label: '2nd' },
  3: { height: 'h-12', color: '#b45309', label: '3rd' },
} as const

function PodiumSlot({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const cfg = PODIUM_CFG[place]
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[110px]">
      {place === 1 && <span className="text-xl leading-none mb-0.5">👑</span>}
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border-2"
        style={{ borderColor: cfg.color }}>
        {entry.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="w-full h-full flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: cfg.color + '33', color: cfg.color }}>
              {entry.display_name.slice(0, 2).toUpperCase()}
            </span>
        }
      </div>
      <p className="text-xs font-semibold text-white text-center truncate w-full px-1">
        {entry.display_name.split(' ')[0]}
      </p>
      <p className="text-sm font-black" style={{ color: cfg.color }}>{entry.total_points} pts</p>
      <div className={`w-full rounded-t-xl ${cfg.height} opacity-80 mt-1`} style={{ backgroundColor: cfg.color }} />
      <p className="text-[10px] font-bold text-zinc-950 -mt-1">{cfg.label}</p>
    </div>
  )
}

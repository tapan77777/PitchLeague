'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, hasJoinedLeague } from '@/lib/member'
import { getLeagueShareUrl } from '@/lib/utils'
import { League, Badge, LeaderboardEntry } from '@/types'
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
    setLoading(true); setError('')
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
      console.error('[play leaderboard]', err); setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { if (memberId) fetchData() }, [memberId, fetchData])

  async function copyInviteLink() {
    if (!data) return
    await navigator.clipboard.writeText(getLeagueShareUrl(data.league.slug))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !memberId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-zinc-400 text-sm mb-4">Failed to load leaderboard.</p>
        <button onClick={() => fetchData()}
          className="gold-gradient text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, entries, matchesPlayed } = data
  const primary = league.primary_color || '#c9a84c'
  const myEntry = entries.find(e => e.clerk_id === memberId)
  const top3 = entries.slice(0, Math.min(3, entries.length))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b px-4 py-0 h-[52px] flex items-center"
        style={{ borderBottomColor: '#c9a84c22' }}>
        <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-2">
          <div className="shrink-0">
            {league.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ backgroundColor: primary + '33', color: primary }}>{league.name.charAt(0)}</div>
            )}
          </div>
          <span className="fifa-score text-xl leading-none text-[#f0f0f0] truncate flex-1 text-center">
            {league.name}
          </span>
          <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider shrink-0">
            {matchesPlayed} played
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Reward banner ── */}
        {league.reward_message && (
          <div className="rounded-xl border border-[#c9a84c44] bg-[#c9a84c0a] px-4 py-3 mb-5 flex items-start gap-2">
            <span className="text-base shrink-0">🎁</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c] mb-0.5">Rewards</p>
              <p className="text-sm text-[#f0f0f0] leading-snug">{league.reward_message}</p>
            </div>
          </div>
        )}

        {/* ── My position card ── */}
        {myEntry && (
          <div className="rounded-xl border mb-6 p-4" style={{ borderColor: '#c9a84c44', backgroundColor: '#c9a84c0a' }}>
            <p className="text-[9px] font-semibold tracking-widest uppercase mb-3" style={{ color: '#c9a84c' }}>
              YOUR POSITION
            </p>
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2"
                style={{ borderColor: '#c9a84c55', backgroundColor: '#c9a84c11', color: '#c9a84c' }}>
                {myEntry.display_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#f0f0f0] truncate">{myEntry.display_name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#c9a84c' }}>
                  #{myEntry.rank} of {entries.length}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="fifa-score text-4xl leading-none" style={{ color: '#c9a84c' }}>{myEntry.total_points}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">points</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Invite nudge ── */}
        {entries.length <= 1 && (
          <div className="bg-[#161616] border border-[#222] rounded-xl p-6 text-center mb-6">
            <span className="text-4xl block mb-3">👀</span>
            <p className="font-bold text-sm text-white mb-1">Invite more players!</p>
            <p className="text-zinc-500 text-xs mb-4">Share the link to start the competition.</p>
            <button onClick={copyInviteLink}
              className="flex items-center gap-2 mx-auto font-semibold text-sm px-5 py-2.5 rounded-full border transition-colors"
              style={{ color: copied ? '#000' : '#c9a84c', borderColor: '#c9a84c',
                backgroundColor: copied ? '#c9a84c' : 'transparent' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        )}

        {/* ── Podium ── */}
        {top3.length >= 2 && (
          <div className="mb-7">
            <SectionHeader title="PODIUM" />
            <div className="flex items-end justify-center gap-4 pt-2">
              {top3[1] && <PodiumSlot entry={top3[1]} place={2} />}
              {top3[0] && <PodiumSlot entry={top3[0]} place={1} />}
              {top3[2] && <PodiumSlot entry={top3[2]} place={3} />}
            </div>
          </div>
        )}

        {/* ── Full standings ── */}
        {entries.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="FULL STANDINGS" />
            <div className="space-y-1.5">
              {entries.map(entry => (
                <StandingsRow
                  key={entry.clerk_id}
                  entry={entry}
                  isMe={entry.clerk_id === memberId}
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

/* ─────────────────────────── Sub-components ─────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-[#c9a84c]" />
      <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">{title}</span>
    </div>
  )
}

const PODIUM_CFG = {
  1: { barH: 'h-20', color: '#c9a84c', emoji: '🥇', label: '1ST' },
  2: { barH: 'h-12', color: '#a1a1aa', emoji: '🥈', label: '2ND' },
  3: { barH: 'h-8',  color: '#92400e', emoji: '🥉', label: '3RD' },
} as const

function PodiumSlot({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const cfg = PODIUM_CFG[place]
  return (
    <div className="flex flex-col items-center flex-1 max-w-[110px]">
      {place === 1 && <span className="text-lg mb-1">👑</span>}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border-2 mb-1"
        style={{ borderColor: cfg.color }}>
        {entry.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center fifa-score text-base"
            style={{ backgroundColor: cfg.color + '22', color: cfg.color }}>
            {entry.display_name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <p className="fifa-score text-sm text-[#f0f0f0] text-center truncate w-full px-1 leading-tight">
        {entry.display_name.split(' ')[0]}
      </p>
      <p className="fifa-score text-lg leading-tight mb-1" style={{ color: cfg.color }}>
        {entry.total_points}
      </p>
      <div className={`w-full rounded-t-lg ${cfg.barH}`} style={{ backgroundColor: cfg.color + 'cc' }} />
      <p className="fifa-score text-[11px] text-zinc-600 mt-0.5">{cfg.emoji} {cfg.label}</p>
    </div>
  )
}

function StandingsRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const rankColor = entry.rank === 1 ? '#c9a84c' : entry.rank === 2 ? '#a1a1aa' : entry.rank === 3 ? '#92400e' : '#444'
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors"
      style={{
        backgroundColor: isMe ? '#c9a84c0a' : '#161616',
        borderColor: isMe ? '#c9a84c44' : '#222',
      }}>
      <span className="fifa-score text-xl w-7 text-center shrink-0 leading-none" style={{ color: rankColor }}>
        {entry.rank}
      </span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border"
        style={{ backgroundColor: rankColor + '15', color: rankColor, borderColor: rankColor + '44' }}>
        {entry.display_name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: isMe ? '#c9a84c' : '#f0f0f0' }}>
          {entry.display_name}
          {isMe && <span className="ml-1.5 text-[10px] font-normal text-zinc-600">(you)</span>}
        </p>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          {entry.correct_predictions} correct · {entry.exact_scores} exact
          {entry.current_streak > 1 && ` · 🔥 ${entry.current_streak}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="fifa-score text-2xl leading-none" style={{ color: isMe ? '#c9a84c' : '#f0f0f0' }}>
          {entry.total_points}
        </p>
        <p className="text-[9px] text-zinc-600 uppercase tracking-wider">pts</p>
      </div>
    </div>
  )
}

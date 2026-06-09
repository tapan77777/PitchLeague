'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague } from '@/lib/member'
import { getLeagueThemeVars, getAccuracy } from '@/lib/utils'
import { League, LeagueMember, Badge } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import { LogOut } from 'lucide-react'

interface PredictionRow {
  id: string
  match_id: string
  predicted_score_a: number
  predicted_score_b: number
  points_earned: number
  is_correct_winner: boolean | null
  is_exact_score: boolean | null
  submitted_at: string
  team_a: string
  team_b: string
  team_a_flag: string | null
  team_b_flag: string | null
  score_a: number | null
  score_b: number | null
  match_status: 'upcoming' | 'live' | 'finished'
  kickoff_time: string
}

interface PageData {
  league: League
  membership: LeagueMember
  memberCount: number
  predictions: PredictionRow[]
  badges: Badge[]
}

export default function PlayProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()

  const [memberId, setMemberId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const id = getOrCreateMemberId()
    if (!id || !hasJoinedLeague(slug)) { router.replace(`/league/${slug}`); return }
    setMemberId(id)
    setMemberName(getMemberName())
  }, [slug, router])

  const fetchData = useCallback(async (memberId: string) => {
    setLoading(true); setError('')
    try {
      const leagueRes = await supabase.from('leagues').select('*').eq('slug', slug).maybeSingle()
      if (!leagueRes.data) { setError('league_not_found'); setLoading(false); return }
      const league = leagueRes.data
      const leagueId = league.id

      const [memberRes, predRes, badgeRes, countRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).maybeSingle(),
        supabase.from('predictions').select(`
          id, match_id, predicted_score_a, predicted_score_b,
          points_earned, is_correct_winner, is_exact_score, submitted_at,
          matches ( team_a, team_b, team_a_flag, team_b_flag, score_a, score_b, status, kickoff_time )
        `).eq('league_id', leagueId).eq('clerk_id', memberId).order('submitted_at', { ascending: false }),
        supabase.from('badges').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).order('earned_at', { ascending: false }),
        supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
      ])

      if (!memberRes.data) { setError('not_member'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const predictions: PredictionRow[] = (predRes.data ?? []).map((p: any) => ({
        id: p.id,
        match_id: p.match_id,
        predicted_score_a: p.predicted_score_a,
        predicted_score_b: p.predicted_score_b,
        points_earned: p.points_earned,
        is_correct_winner: p.is_correct_winner,
        is_exact_score: p.is_exact_score,
        submitted_at: p.submitted_at,
        team_a: p.matches?.team_a ?? '',
        team_b: p.matches?.team_b ?? '',
        team_a_flag: p.matches?.team_a_flag ?? null,
        team_b_flag: p.matches?.team_b_flag ?? null,
        score_a: p.matches?.score_a ?? null,
        score_b: p.matches?.score_b ?? null,
        match_status: p.matches?.status ?? 'upcoming',
        kickoff_time: p.matches?.kickoff_time ?? '',
      }))

      setData({ league, membership: memberRes.data, memberCount: countRes.count ?? 0, predictions, badges: badgeRes.data ?? [] })
    } catch (err) {
      console.error('[play profile]', err); setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { if (memberId) fetchData(memberId) }, [memberId, fetchData])

  function handleLeave() { setLeaving(true); router.replace('/') }

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
        <p className="text-zinc-400 text-sm mb-4">Failed to load profile.</p>
        <button onClick={() => fetchData(memberId)}
          className="gold-gradient text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, membership, memberCount, predictions, badges } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const initials = (memberName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const accuracy = getAccuracy(membership.correct_predictions ?? 0, predictions.length)
  const finishedPreds = predictions.filter(p => p.match_status === 'finished')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28" style={themeVars}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b px-4 py-0 h-[52px] flex items-center"
        style={{ borderBottomColor: '#c9a84c22' }}>
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2">
            {league.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ backgroundColor: primary + '33', color: primary }}>{league.name.charAt(0)}</div>
            )}
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-300 truncate max-w-[140px]">
              {league.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">🏆</span>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#c9a84c' }}>FIFA 2026</span>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Profile</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: '#c9a84c11', borderColor: '#c9a84c55' }}>
              <span className="fifa-score text-4xl text-[#c9a84c]">{initials}</span>
            </div>
            {membership.rank <= 3 && (
              <span className="absolute -top-1 -right-1 text-xl">
                {['🥇','🥈','🥉'][membership.rank - 1]}
              </span>
            )}
          </div>
          <h1 className="fifa-score text-3xl text-[#f0f0f0]">{memberName || 'PLAYER'}</h1>
          <p className="text-zinc-600 text-xs mt-0.5 uppercase tracking-wider">{league.name}</p>
          <div className="mt-2 px-3 py-1 rounded-full border text-[11px] font-semibold"
            style={{ color: '#c9a84c', borderColor: '#c9a84c33', backgroundColor: '#c9a84c0a' }}>
            #{membership.rank} of {memberCount} players
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'TOTAL POINTS', value: String(membership.total_points ?? 0), gold: true },
            { label: 'ACCURACY',     value: accuracy,                              gold: false },
            { label: 'EXACT SCORES', value: String(membership.exact_scores ?? 0),  gold: false },
            { label: 'BEST STREAK',  value: `${membership.best_streak ?? 0}🔥`,    gold: false },
          ].map(({ label, value, gold }) => (
            <div key={label} className="bg-[#161616] border border-[#222] rounded-xl p-4">
              <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">{label}</p>
              <p className="fifa-score text-4xl leading-none" style={{ color: gold ? '#c9a84c' : '#f0f0f0' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        <div>
          <SectionHeader title="BADGES" />
          {badges.length === 0 ? (
            <div className="bg-[#161616] border border-[#222] rounded-xl p-5 text-center">
              <p className="text-zinc-600 text-sm">Keep predicting to earn badges ✨</p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {badges.map(badge => (
                <div key={badge.id}
                  className="shrink-0 flex items-center gap-1.5 bg-[#161616] rounded-full px-3 py-2 border"
                  style={{ borderColor: '#c9a84c44' }}>
                  <span className="text-base">{badge.badge_emoji}</span>
                  <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: '#c9a84c' }}>
                    {badge.badge_label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Prediction history ── */}
        <div>
          <SectionHeader title={`PREDICTIONS (${predictions.length})`} />
          {predictions.length === 0 ? (
            <div className="bg-[#161616] border border-[#222] rounded-xl p-6 text-center">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-zinc-600 text-sm">No predictions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map(pred => <PredHistoryRow key={pred.id} pred={pred} />)}
            </div>
          )}
        </div>

        {/* ── Stats summary ── */}
        {finishedPreds.length > 0 && (
          <div className="bg-[#161616] border border-[#222] rounded-xl p-4">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">SUMMARY</p>
            <div className="flex justify-around">
              {[
                { label: 'Played', value: finishedPreds.length },
                { label: 'Correct', value: membership.correct_predictions },
                { label: 'Exact', value: membership.exact_scores },
                { label: 'Points', value: membership.total_points },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="fifa-score text-2xl text-[#f0f0f0]">{value}</p>
                  <p className="text-[10px] text-zinc-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Leave ── */}
        <div className="pb-4">
          <button onClick={handleLeave} disabled={leaving}
            className="w-full flex items-center justify-center gap-2 border border-[#222] hover:border-red-900 text-zinc-600 hover:text-red-500 font-medium py-3.5 rounded-full transition-colors text-sm disabled:opacity-50">
            <LogOut size={14} />
            {leaving ? 'Leaving…' : 'Leave league'}
          </button>
          <p className="text-zinc-700 text-xs text-center mt-2">You can rejoin anytime with the invite link.</p>
        </div>
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

function PredHistoryRow({ pred }: { pred: PredictionRow }) {
  const isFinished = pred.match_status === 'finished'
  const isLive = pred.match_status === 'live'
  const correct = pred.is_correct_winner || pred.is_exact_score
  const exact = pred.is_exact_score
  const pts = pred.points_earned ?? 0

  const borderColor = isFinished ? (correct ? '#2dc65355' : '#333') : isLive ? '#ff2d2d44' : '#222'
  const leftBorder = isFinished && correct ? '#2dc653' : '#333'

  return (
    <div className="bg-[#161616] border rounded-xl overflow-hidden"
      style={{ borderColor, borderLeftWidth: 3, borderLeftColor: leftBorder }}>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold leading-snug">
            <span>{pred.team_a_flag || '🏴'}</span>
            <span className="fifa-score text-base text-[#f0f0f0] truncate max-w-[52px]">{pred.team_a}</span>
            <span className="text-zinc-700 mx-0.5">vs</span>
            <span className="fifa-score text-base text-[#f0f0f0] truncate max-w-[52px]">{pred.team_b}</span>
            <span>{pred.team_b_flag || '🏴'}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-zinc-600">
              Pick: <span className="text-zinc-400 font-medium">{pred.predicted_score_a} — {pred.predicted_score_b}</span>
            </span>
            {isFinished && pred.score_a != null && (
              <span className="text-[11px] text-zinc-600">
                FT: <span className="text-zinc-400 font-medium">{pred.score_a} — {pred.score_b}</span>
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {isFinished ? (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-lg leading-none">{exact ? '🎯' : correct ? '✅' : '❌'}</span>
              <span className="fifa-score text-xl leading-none" style={{ color: correct ? '#2dc653' : '#444' }}>
                {pts > 0 ? `+${pts}` : '0'}
              </span>
              <span className="text-[9px] text-zinc-600">pts</span>
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-1">
              <span className="live-pulse w-1.5 h-1.5 rounded-full bg-[#ff2d2d] block" />
              <span className="text-[10px] font-bold text-[#ff2d2d]">LIVE</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-700">🔒</span>
          )}
        </div>
      </div>
    </div>
  )
}

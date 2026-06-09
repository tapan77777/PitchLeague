'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getMemberSession, clearMemberSession, MemberSession } from '@/lib/member'
import { getLeagueThemeVars, getAccuracy, formatKickoff } from '@/lib/utils'
import { League, LeagueMember, Badge } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import { CheckCircle2, XCircle, LogOut } from 'lucide-react'

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

  const [session, setSession] = useState<MemberSession | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const s = getMemberSession()
    if (!s || s.slug !== slug) { router.replace(`/league/${slug}`); return }
    setSession(s)
  }, [slug, router])

  const fetchData = useCallback(async (memberId: string, leagueId: string) => {
    setLoading(true)
    setError('')
    try {
      const [leagueRes, memberRes, predRes, badgeRes, countRes] = await Promise.all([
        supabase.from('leagues').select('*').eq('id', leagueId).single(),
        supabase.from('league_members').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).single(),
        supabase.from('predictions').select(`
          id, match_id, predicted_score_a, predicted_score_b,
          points_earned, is_correct_winner, is_exact_score, submitted_at,
          matches ( team_a, team_b, team_a_flag, team_b_flag, score_a, score_b, status, kickoff_time )
        `).eq('league_id', leagueId).eq('clerk_id', memberId).order('submitted_at', { ascending: false }),
        supabase.from('badges').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).order('earned_at', { ascending: false }),
        supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
      ])

      if (leagueRes.error || !leagueRes.data) { setError('league_not_found'); return }
      if (memberRes.error || !memberRes.data) { setError('not_member'); return }

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

      setData({
        league: leagueRes.data,
        membership: memberRes.data,
        memberCount: countRes.count ?? 0,
        predictions,
        badges: badgeRes.data ?? [],
      })
    } catch (err) {
      console.error('[play profile]', err)
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchData(session.member_id, session.league_id)
  }, [session, fetchData])

  function handleLeave() {
    setLeaving(true)
    clearMemberSession()
    router.replace('/')
  }

  if (loading || !session) {
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
        <p className="text-zinc-400 text-sm mb-4">Failed to load profile.</p>
        <button onClick={() => fetchData(session.member_id, session.league_id)}
          className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, membership, memberCount, predictions, badges } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const initials = session.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const accuracy = getAccuracy(membership.correct_predictions ?? 0, predictions.length)

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28" style={themeVars}>
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-3 border-2"
            style={{ borderColor: primary, backgroundColor: primary + '22', color: primary }}>
            {initials}
          </div>
          <h1 className="text-xl font-extrabold text-white">{session.display_name}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{league.name}</p>
          <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full border"
            style={{ color: primary, borderColor: primary + '44', backgroundColor: primary + '11' }}>
            #{membership.rank} of {memberCount} members
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Points', value: String(membership.total_points ?? 0), large: true },
            { label: 'Accuracy',     value: accuracy,                              large: true },
            { label: 'Exact Scores', value: String(membership.exact_scores ?? 0),  large: false },
            { label: 'Best Streak',  value: `🔥 ${membership.best_streak ?? 0}`,   large: false },
          ].map(({ label, value, large }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold mb-1">{label}</p>
              <p className={`font-black leading-none ${large ? 'text-4xl' : 'text-2xl'}`} style={{ color: primary }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Your Badges</h2>
          {badges.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-zinc-500 text-sm">Keep predicting to earn badges ✨</p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {badges.map(badge => (
                <div key={badge.id}
                  className="shrink-0 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-2">
                  <span className="text-base">{badge.badge_emoji}</span>
                  <span className="text-xs font-semibold text-white whitespace-nowrap">{badge.badge_label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Prediction history ── */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Your Predictions</h2>
          {predictions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-zinc-500 text-sm">No predictions yet. Go predict some matches!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map(pred => (
                <PredHistoryRow key={pred.id} pred={pred} />
              ))}
            </div>
          )}
        </div>

        {/* ── Leave league ── */}
        <div className="pt-2 pb-4">
          <button onClick={handleLeave} disabled={leaving}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 font-medium py-3.5 rounded-full transition-colors text-sm disabled:opacity-50">
            <LogOut size={15} />
            {leaving ? 'Leaving…' : 'Leave league'}
          </button>
          <p className="text-zinc-700 text-xs text-center mt-2">
            You can rejoin anytime with the same invite link.
          </p>
        </div>
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

function PredHistoryRow({ pred }: { pred: PredictionRow }) {
  const isFinished = pred.match_status === 'finished'
  const isLive = pred.match_status === 'live'
  const correct = pred.is_correct_winner || pred.is_exact_score
  const pts = pred.points_earned ?? 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm font-semibold flex-wrap">
          <span>{pred.team_a_flag || '🏴'}</span>
          <span className="truncate max-w-[48px]">{pred.team_a}</span>
          <span className="text-zinc-600 font-bold mx-0.5">vs</span>
          <span className="truncate max-w-[48px]">{pred.team_b}</span>
          <span>{pred.team_b_flag || '🏴'}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-zinc-600 text-xs">
            Pick: <span className="text-zinc-400 font-semibold">{pred.predicted_score_a} – {pred.predicted_score_b}</span>
          </span>
          {isFinished && pred.score_a != null && (
            <span className="text-zinc-600 text-xs">
              Result: <span className="text-zinc-400 font-semibold">{pred.score_a} – {pred.score_b}</span>
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {isFinished ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-lg leading-none">{correct ? '✅' : '❌'}</span>
            <span className={`text-sm font-black ${correct ? 'text-green-400' : 'text-zinc-600'}`}>
              {pts > 0 ? `+${pts}` : '0'} pts
            </span>
          </div>
        ) : isLive ? (
          <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-400">Locked 🔒</span>
        )}
      </div>
    </div>
  )
}

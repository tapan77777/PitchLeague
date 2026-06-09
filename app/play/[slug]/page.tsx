'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMemberSession, MemberSession } from '@/lib/member'
import { getLeagueThemeVars, getAccuracy, formatKickoff } from '@/lib/utils'
import { League, LeagueMember, Match, Prediction } from '@/types'
import MatchCard from '@/components/shared/MatchCard'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import { CheckCircle2, XCircle } from 'lucide-react'

interface PageData {
  league: League
  membership: LeagueMember
  memberCount: number
  openMatches: Match[]
  recentMatches: Match[]
  predictions: Record<string, Prediction>
}

export default function PlayHomePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()

  const [session, setSession] = useState<MemberSession | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = getMemberSession()
    if (!s || s.slug !== slug) {
      router.replace(`/league/${slug}`)
      return
    }
    setSession(s)
  }, [slug, router])

  const fetchData = useCallback(async (memberId: string, leagueId: string) => {
    setLoading(true)
    setError('')
    try {
      const [leagueRes, memberRes, upcomingRes, recentRes, predRes, countRes] = await Promise.all([
        supabase.from('leagues').select('*').eq('id', leagueId).single(),
        supabase.from('league_members').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).single(),
        supabase.from('matches').select('*').eq('status', 'upcoming').order('kickoff_time', { ascending: true }).limit(10),
        supabase.from('matches').select('*').eq('status', 'finished').order('kickoff_time', { ascending: false }).limit(5),
        supabase.from('predictions').select('*').eq('league_id', leagueId).eq('clerk_id', memberId),
        supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
      ])

      if (leagueRes.error || !leagueRes.data) { setError('league_not_found'); return }
      if (memberRes.error || !memberRes.data) { setError('not_member'); return }

      const now = new Date()
      const predMap: Record<string, Prediction> = {}
      for (const p of predRes.data ?? []) predMap[p.match_id] = p

      setData({
        league: leagueRes.data,
        membership: memberRes.data,
        memberCount: countRes.count ?? 0,
        openMatches: (upcomingRes.data ?? []).filter(m => new Date(m.kickoff_time) > now),
        recentMatches: recentRes.data ?? [],
        predictions: predMap,
      })
    } catch (err) {
      console.error('[play home] error:', err)
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchData(session.member_id, session.league_id)
  }, [session, fetchData])

  async function handlePredict(matchId: string, scoreA: number, scoreB: number) {
    if (!data || !session) return
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        league_id: data.league.id,
        match_id: matchId,
        predicted_score_a: scoreA,
        predicted_score_b: scoreB,
        member_id: session.member_id,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to save')
    setData(prev => prev ? { ...prev, predictions: { ...prev.predictions, [matchId]: json.prediction } } : prev)
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
        <p className="text-zinc-400 text-sm mb-4">
          {error === 'not_member' ? 'You are not a member of this league.' : 'Failed to load. Please try again.'}
        </p>
        <button onClick={() => fetchData(session.member_id, session.league_id)}
          className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">
          Retry
        </button>
      </div>
    )
  }

  const { league, membership, memberCount, openMatches, recentMatches, predictions } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const initials = session.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24" style={themeVars}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {league.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                style={{ backgroundColor: primary + '33', color: primary }}>
                {league.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-sm truncate">{league.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: primary + '22', color: primary }}>
              #{membership.rank || '—'}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
              style={{ backgroundColor: primary + '22', color: primary, borderColor: primary + '44' }}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Stats row ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4 scrollbar-none">
          {[
            { label: 'Points', value: String(membership.total_points ?? 0) },
            { label: 'Rank', value: `#${membership.rank || '—'} of ${memberCount}` },
            { label: 'Streak', value: `🔥 ${membership.current_streak ?? 0}` },
            { label: 'Accuracy', value: getAccuracy(membership.correct_predictions ?? 0, Object.keys(predictions).length) },
          ].map(({ label, value }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 min-w-[90px]">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">{label}</p>
              <p className="text-white font-bold text-base leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Predict Now ── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Predict Now</h2>
          {openMatches.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <span className="text-3xl block mb-2">⏳</span>
              <p className="text-zinc-400 text-sm">No matches open right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  leagueId={league.id}
                  existingPrediction={predictions[match.id]}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Results ── */}
        {recentMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Recent Results</h2>
            <div className="space-y-2">
              {recentMatches.map(match => (
                <ResultRow key={match.id} match={match} prediction={predictions[match.id]} />
              ))}
            </div>
          </section>
        )}
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

function ResultRow({ match, prediction }: { match: Match; prediction?: Prediction }) {
  const correct = prediction?.is_correct_winner || prediction?.is_exact_score
  const pts = prediction?.points_earned ?? 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span>{match.team_a_flag || '🏴'}</span>
          <span className="truncate max-w-[52px]">{match.team_a}</span>
          <span className="text-zinc-400 font-black mx-1 tabular-nums">{match.score_a} – {match.score_b}</span>
          <span className="truncate max-w-[52px]">{match.team_b}</span>
          <span>{match.team_b_flag || '🏴'}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-zinc-600 text-xs">{formatKickoff(match.kickoff_time)}</span>
          {prediction && (
            <span className="text-zinc-600 text-xs">
              · Pick: {prediction.predicted_score_a} – {prediction.predicted_score_b}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {!prediction ? (
          <span className="text-zinc-700 text-xs">No pick</span>
        ) : correct ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-green-400" />
            <span className="text-green-400 font-bold text-sm">+{pts}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <XCircle size={13} className="text-zinc-600" />
            <span className="text-zinc-600 font-bold text-sm">0</span>
          </div>
        )}
      </div>
    </div>
  )
}

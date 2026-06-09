'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague } from '@/lib/member'
import { getLeagueThemeVars, getAccuracy, timeUntilKickoff, isPredictionOpen } from '@/lib/utils'
import { League, LeagueMember, Match, Prediction } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'

interface MatchSocialProof {
  total: number; teamA: number; teamB: number; draw: number
}

interface PageData {
  league: League
  membership: LeagueMember
  memberRank: number
  memberCount: number
  openMatches: Match[]
  recentMatches: Match[]
  predictions: Record<string, Prediction>
  socialProof: Record<string, MatchSocialProof>
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export default function PlayHomePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()

  const [memberId, setMemberId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

      const [memberRes, upcomingRes, recentRes, predRes, countRes, allPredsRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).maybeSingle(),
        supabase.from('matches').select('*').eq('status', 'upcoming').order('kickoff_time', { ascending: true }).limit(12),
        supabase.from('matches').select('*').eq('status', 'finished').order('kickoff_time', { ascending: false }).limit(6),
        supabase.from('predictions').select('*').eq('league_id', leagueId).eq('clerk_id', memberId),
        supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
        supabase.from('predictions').select('match_id, predicted_score_a, predicted_score_b').eq('league_id', leagueId),
      ])

      if (!memberRes.data) { setError('not_member'); return }

      const rankRes = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .gt('total_points', memberRes.data.total_points)
      const memberRank = (rankRes.count ?? 0) + 1

      const predMap: Record<string, Prediction> = {}
      for (const p of predRes.data ?? []) predMap[p.match_id] = p

      const socialProof: Record<string, MatchSocialProof> = {}
      for (const p of allPredsRes.data ?? []) {
        if (!socialProof[p.match_id]) socialProof[p.match_id] = { total: 0, teamA: 0, teamB: 0, draw: 0 }
        socialProof[p.match_id].total++
        const a = p.predicted_score_a ?? 0; const b = p.predicted_score_b ?? 0
        if (a > b) socialProof[p.match_id].teamA++
        else if (b > a) socialProof[p.match_id].teamB++
        else socialProof[p.match_id].draw++
      }

      setData({
        league, membership: memberRes.data,
        memberRank,
        memberCount: countRes.count ?? 0,
        openMatches: upcomingRes.data ?? [],
        recentMatches: recentRes.data ?? [],
        predictions: predMap,
        socialProof,
      })
    } catch (err) {
      console.error('[play home]', err); setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { if (memberId) fetchData(memberId) }, [memberId, fetchData])

  async function handlePredict(matchId: string, a: number, b: number): Promise<void> {
    if (!data || !memberId) return
    const res = await fetch('/api/predictions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league_id: data.league.id, match_id: matchId,
        predicted_score_a: a, predicted_score_b: b, member_id: memberId }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed')
    setData(prev => prev ? { ...prev, predictions: { ...prev.predictions, [matchId]: json.prediction } } : prev)
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
        <p className="text-zinc-400 text-sm mb-4">
          {error === 'not_member' ? 'You are not a member of this league.' : 'Failed to load. Please try again.'}
        </p>
        <button onClick={() => fetchData(memberId)}
          className="gold-gradient text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, membership, memberRank, openMatches, recentMatches, predictions, socialProof } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const initials = (memberName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28" style={themeVars}>

      {/* ── Top banner ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b px-4 py-0 h-[52px] flex items-center"
        style={{ borderBottomColor: '#c9a84c22' }}>
        <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-2">
          {/* Left: league logo */}
          <div className="shrink-0">
            {league.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ backgroundColor: primary + '33', color: primary }}>{league.name.charAt(0)}</div>
            )}
          </div>

          {/* Center: league name */}
          <span className="fifa-score text-xl leading-none text-[#f0f0f0] truncate flex-1 text-center">
            {league.name}
          </span>

          {/* Right: rank + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="fifa-score text-base leading-none" style={{ color: '#c9a84c' }}>
              #{memberRank}
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border"
              style={{ backgroundColor: primary + '22', color: primary, borderColor: primary + '55' }}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Stats pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-7 -mx-4 px-4 scrollbar-none">
          {[
            { label: 'PTS', value: String(membership.total_points ?? 0) },
            { label: 'RANK', value: `#${memberRank}` },
            { label: 'STREAK', value: `🔥 ${membership.current_streak ?? 0}` },
            { label: 'ACC', value: getAccuracy(membership.correct_predictions ?? 0, Object.keys(predictions).length) },
          ].map(({ label, value }) => (
            <div key={label} className="shrink-0 flex flex-col items-center bg-[#161616] border border-[#222] rounded-2xl px-5 py-2.5 min-w-[72px]">
              <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mb-0.5">{label}</p>
              <p className="fifa-score text-xl leading-tight text-[#f0f0f0]">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Predict Now ── */}
        <section className="mb-8">
          <SectionHeader title="PREDICT NOW" />
          <p className="text-[10px] text-zinc-600 -mt-2 mb-4">
            Predictions lock at kickoff · Exact score = 5pts · Correct winner = 2pts
          </p>
          {openMatches.length === 0 ? (
            <div className="match-card p-8 text-center">
              <span className="text-3xl block mb-3">⏳</span>
              <p className="text-zinc-500 text-sm">No upcoming matches right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openMatches.map(match => (
                <FifaMatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  socialProof={socialProof[match.id]}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Results ── */}
        {recentMatches.length > 0 && (
          <section className="mb-8">
            <SectionHeader title="RECENT RESULTS" />
            <div className="space-y-2">
              {recentMatches.map(match => (
                <FifaMatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  socialProof={socialProof[match.id]}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

/* ─────────────────────────── Section Header ─────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-[#c9a84c]" />
      <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">{title}</span>
    </div>
  )
}

/* ─────────────────────────── Match Card ─────────────────────────── */

function FifaMatchCard({
  match, prediction, socialProof, onPredict,
}: {
  match: Match
  prediction?: Prediction
  socialProof?: MatchSocialProof
  onPredict: (matchId: string, a: number, b: number) => Promise<void>
}) {
  const isOpen = isPredictionOpen(match.kickoff_time)
  const hasPrediction = !!prediction
  const [isEditing, setIsEditing] = useState(false)
  const [scoreA, setScoreA] = useState(prediction?.predicted_score_a ?? 0)
  const [scoreB, setScoreB] = useState(prediction?.predicted_score_b ?? 0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Sync stepper values when prediction changes (after save)
  useEffect(() => {
    if (prediction) {
      setScoreA(prediction.predicted_score_a ?? 0)
      setScoreB(prediction.predicted_score_b ?? 0)
    }
  }, [prediction])

  async function handleLock() {
    setSaving(true)
    try {
      await onPredict(match.id, scoreA, scoreB)
      setIsEditing(false)
      setToast(hasPrediction ? 'Updated ✓' : 'Locked in ✓')
      setTimeout(() => setToast(''), 2000)
    } catch { setToast('Error — try again') }
    finally { setSaving(false) }
  }

  const flagA = match.team_a_flag || '🏴'
  const flagB = match.team_b_flag || '🏴'
  const groupLabel = match.group_name ? match.group_name.replace(/^Group\s*/i, '').toUpperCase() : null
  const stage = groupLabel ? `GROUP ${groupLabel}` : (match.stage || 'MATCH').replace(/_/g, ' ').toUpperCase()

  /* FINISHED */
  if (match.status === 'finished') {
    const correct = prediction?.is_correct_winner || prediction?.is_exact_score
    const noPred = !prediction
    const borderColor = noPred ? '#333' : correct ? '#2dc653' : '#333'
    const bgTint = correct ? 'rgba(45,198,83,0.04)' : 'transparent'
    const opacity = !noPred && !correct ? 0.72 : 1

    return (
      <div className="match-card overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: borderColor, opacity }}>
        <div className="p-4" style={{ backgroundColor: bgTint }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            <span className="text-[10px] font-bold tracking-wider text-zinc-600 uppercase bg-[#222] px-2 py-0.5 rounded-full">FT</span>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagA}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center leading-tight">{match.team_a}</span>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center gap-1">
                <span className="fifa-score text-4xl text-[#f0f0f0] leading-none">{match.score_a ?? 0}</span>
                <span className="fifa-score text-2xl text-zinc-600 mx-0.5">—</span>
                <span className="fifa-score text-4xl text-[#f0f0f0] leading-none">{match.score_b ?? 0}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagB}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center leading-tight">{match.team_b}</span>
            </div>
          </div>

          {prediction ? (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#222]">
              <span className="text-xs text-zinc-600">
                Your pick: <span className="text-zinc-400 font-medium">
                  {prediction.predicted_score_a} — {prediction.predicted_score_b}
                </span>
              </span>
              {correct ? (
                <span className="text-xs font-bold text-[#2dc653]">✓ +{prediction.points_earned} pts</span>
              ) : (
                <span className="text-xs font-semibold text-zinc-600">✗ 0 pts</span>
              )}
            </div>
          ) : (
            <p className="text-xs italic text-zinc-700 mt-3 pt-3 border-t border-[#222]">No prediction made</p>
          )}
        </div>
      </div>
    )
  }

  /* LIVE */
  if (match.status === 'live') {
    return (
      <div className="match-card overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: '#ff2d2d' }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            <div className="flex items-center gap-1.5">
              <span className="live-pulse w-2 h-2 rounded-full bg-[#ff2d2d] block" />
              <span className="text-[10px] font-bold text-[#ff2d2d] tracking-wider">LIVE</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagA}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center">{match.team_a}</span>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center gap-1">
                <span className="fifa-score text-4xl text-[#ff2d2d] leading-none">{match.score_a ?? 0}</span>
                <span className="fifa-score text-2xl text-zinc-600 mx-0.5">—</span>
                <span className="fifa-score text-4xl text-[#ff2d2d] leading-none">{match.score_b ?? 0}</span>
              </div>
              <span className="text-[10px] text-zinc-600 mt-0.5">In progress</span>
            </div>
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagB}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center">{match.team_b}</span>
            </div>
          </div>
          {prediction && (
            <p className="text-xs text-zinc-600 mt-3 pt-3 border-t border-[#222]">
              Your pick: <span className="text-zinc-400">{prediction.predicted_score_a} — {prediction.predicted_score_b}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  /* LOCKED (has prediction, not editing) */
  if (hasPrediction && !isEditing) {
    return (
      <div className="match-card overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: '#c9a84c' }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            {isOpen ? (
              <span className="text-[10px] font-semibold text-amber-500">
                Closes in {timeUntilKickoff(match.kickoff_time)}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Prediction locked</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagA}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center">{match.team_a}</span>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-0.5">
              <div className="flex items-center gap-1">
                <span className="fifa-score text-4xl leading-none" style={{ color: '#c9a84c' }}>
                  {prediction.predicted_score_a}
                </span>
                <span className="fifa-score text-2xl text-zinc-600 mx-0.5">—</span>
                <span className="fifa-score text-4xl leading-none" style={{ color: '#c9a84c' }}>
                  {prediction.predicted_score_b}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600">Your prediction · 🔒</span>
            </div>
            <div className="flex flex-col items-center gap-1 w-[38%]">
              <span className="text-4xl leading-none">{flagB}</span>
              <span className="fifa-score text-xl text-[#f0f0f0] text-center">{match.team_b}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#222]">
            {socialProof?.total ? (
              <SocialProofText sp={socialProof} nameA={match.team_a} nameB={match.team_b} />
            ) : <span />}
            {isOpen && (
              <button onClick={() => { setIsEditing(true) }}
                className="text-[11px] font-semibold text-zinc-500 hover:text-[#c9a84c] transition-colors">
                Edit →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* UPCOMING — stepper */
  return (
    <div className="match-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
          {isOpen ? (
            <span className="text-[10px] font-semibold text-amber-500">
              Closes in {timeUntilKickoff(match.kickoff_time)}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Closed</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-5">
          {/* Team A: flag + name */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-2xl leading-none shrink-0">{flagA}</span>
            <span className="fifa-score text-base text-[#f0f0f0] truncate">{match.team_a}</span>
          </div>

          {/* Steppers */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ScoreStepper value={scoreA} onChange={setScoreA} disabled={!isOpen || saving} compact />
            <span className="fifa-score text-lg text-zinc-700 px-0.5">—</span>
            <ScoreStepper value={scoreB} onChange={setScoreB} disabled={!isOpen || saving} compact />
          </div>

          {/* Team B: flag + name */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className="text-2xl leading-none shrink-0">{flagB}</span>
            <span className="fifa-score text-base text-[#f0f0f0] truncate">{match.team_b}</span>
          </div>
        </div>

        {toast ? (
          <div className="w-full py-3 rounded-xl text-center text-sm font-bold text-[#2dc653] bg-[#2dc65311]">
            {toast}
          </div>
        ) : isOpen ? (
          <button onClick={handleLock} disabled={saving}
            className="w-full py-3 rounded-xl text-black font-bold tracking-widest text-sm disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
              fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: '1rem', letterSpacing: '0.12em' }}>
            {saving ? 'SAVING…' : hasPrediction ? 'UPDATE PREDICTION' : 'LOCK IN PREDICTION'}
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl text-center text-xs text-zinc-600 bg-[#161616] border border-[#222]">
            Prediction window closed
          </div>
        )}

        {isEditing && (
          <button onClick={() => setIsEditing(false)}
            className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-2 transition-colors">
            Cancel
          </button>
        )}

        {socialProof?.total ? (
          <div className="mt-3 pt-3 border-t border-[#222]">
            <SocialProofText sp={socialProof} nameA={match.team_a} nameB={match.team_b} />
          </div>
        ) : null}

        {match.venue || match.city ? (
          <p className="text-[10px] text-zinc-700 mt-2">
            📍 {[match.city, match.venue].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function ScoreStepper({ value, onChange, disabled, compact = false }: {
  value: number; onChange: (v: number) => void; disabled: boolean; compact?: boolean
}) {
  const btn = compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs'
  const score = compact ? 'fifa-score text-xl w-5 leading-none' : 'fifa-score text-3xl w-8 leading-none'
  const gap = compact ? 'gap-1' : 'gap-2'
  return (
    <div className={`flex items-center ${gap}`}>
      <button onClick={() => onChange(Math.max(0, value - 1))} disabled={disabled}
        className={`${btn} rounded-full border flex items-center justify-center font-bold transition-colors disabled:opacity-30`}
        style={{ borderColor: '#c9a84c', color: '#c9a84c' }}>
        −
      </button>
      <span className={`${score} text-center text-[#f0f0f0]`}>{value}</span>
      <button onClick={() => onChange(Math.min(20, value + 1))} disabled={disabled}
        className={`${btn} rounded-full border flex items-center justify-center font-bold transition-colors disabled:opacity-30`}
        style={{ borderColor: '#c9a84c', color: '#c9a84c' }}>
        +
      </button>
    </div>
  )
}

function SocialProofText({ sp, nameA, nameB }: {
  sp: MatchSocialProof; nameA: string; nameB: string
}) {
  if (sp.total === 0) return null
  const parts: string[] = []
  if (sp.teamA > 0) parts.push(`${sp.teamA} picked ${nameA.split(' ')[0]}`)
  if (sp.teamB > 0) parts.push(`${sp.teamB} picked ${nameB.split(' ')[0]}`)
  if (sp.draw > 0) parts.push(`${sp.draw} draw`)
  return (
    <p className="text-[10px] text-zinc-700 leading-snug">
      {parts.join(' · ')} · {sp.total} total
    </p>
  )
}

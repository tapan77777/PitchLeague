'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague } from '@/lib/member'
import { getLeagueThemeVars, getAccuracy, timeUntilKickoff, isPredictionOpen } from '@/lib/utils'
import { League, LeagueMember, Match, Prediction } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import TeamFlag from '@/components/play/TeamFlag'
import PredictionSheet from '@/components/play/PredictionSheet'
import GroupStandings from '@/components/play/GroupStandings'
import { ShareModal } from '@/components/play/ShareCard'
import { ShareCardData } from '@/types'
import { getLeagueShareUrl } from '@/lib/utils'

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
  allGroupMatches: Match[]
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
  const [sharePayload, setSharePayload] = useState<ShareCardData | null>(null)

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

      const [memberRes, upcomingRes, recentRes, predRes, countRes, allPredsRes, groupMatchesRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', leagueId).eq('clerk_id', memberId).maybeSingle(),
        supabase.from('matches').select('*').in('status', ['upcoming', 'live']).order('kickoff_time', { ascending: true }).limit(20),
        supabase.from('matches').select('*').eq('status', 'finished').order('kickoff_time', { ascending: false }).limit(8),
        supabase.from('predictions').select('*').eq('league_id', leagueId).eq('clerk_id', memberId),
        supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
        supabase.from('predictions').select('match_id, predicted_score_a, predicted_score_b').eq('league_id', leagueId),
        supabase.from('matches').select('*').eq('stage', 'group').order('kickoff_time', { ascending: true }),
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
        allGroupMatches: groupMatchesRes.data ?? [],
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

  const { league, membership, memberRank, openMatches, recentMatches, allGroupMatches, predictions, socialProof } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const initials = (memberName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28" style={themeVars}>

      {sharePayload && (
        <ShareModal data={sharePayload} onClose={() => setSharePayload(null)} />
      )}

      {/* ── Top banner ── */}
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

        {/* ── Group Standings ── */}
        {allGroupMatches.length > 0 && (
          <section className="mb-7">
            <SectionHeader title="GROUP STANDINGS" />
            <GroupStandings matches={allGroupMatches} />
          </section>
        )}

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
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  socialProof={socialProof[match.id]}
                  onPredict={handlePredict}
                  onShare={setSharePayload}
                  shareContext={{ league, memberRank, memberCount: data.memberCount, memberName }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Results ── */}
        {recentMatches.length > 0 && (
          <section className="mb-8">
            <SectionHeader title="RECENT RESULTS" />
            <div className="space-y-3">
              {recentMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  socialProof={socialProof[match.id]}
                  onPredict={handlePredict}
                  onShare={setSharePayload}
                  shareContext={{ league, memberRank, memberCount: data.memberCount, memberName }}
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

interface ShareContext {
  league: League; memberRank: number; memberCount: number; memberName: string
}

function MatchCard({
  match, prediction, socialProof, onPredict, onShare, shareContext,
}: {
  match: Match
  prediction?: Prediction
  socialProof?: MatchSocialProof
  onPredict: (matchId: string, a: number, b: number) => Promise<void>
  onShare?: (data: ShareCardData) => void
  shareContext?: ShareContext
}) {
  const isOpen = isPredictionOpen(match.kickoff_time)
  const hasPrediction = !!prediction
  const [sheetOpen, setSheetOpen] = useState(false)
  const [scoreA, setScoreA] = useState(prediction?.predicted_score_a ?? 0)
  const [scoreB, setScoreB] = useState(prediction?.predicted_score_b ?? 0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (prediction) {
      setScoreA(prediction.predicted_score_a ?? 0)
      setScoreB(prediction.predicted_score_b ?? 0)
    }
  }, [prediction])

  const groupLabel = match.group_name ? match.group_name.replace(/^Group\s*/i, '').toUpperCase() : null
  const stage = groupLabel ? `GROUP ${groupLabel}` : (match.stage || 'MATCH').replace(/_/g, ' ').toUpperCase()

  const kickoffDate = new Date(match.kickoff_time)
  const dateStr = kickoffDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })

  async function handleConfirm() {
    setSaving(true)
    try {
      await onPredict(match.id, scoreA, scoreB)
      setSheetOpen(false)
      setToast(hasPrediction ? 'Updated ✓' : 'Locked in ✓')
      setTimeout(() => setToast(''), 2500)
    } catch { setToast('Error — try again') }
    finally { setSaving(false) }
  }

  function buildShareData(pred: Prediction): ShareCardData {
    const ctx = shareContext!
    return {
      league_name: ctx.league.name,
      league_logo: ctx.league.logo_url,
      primary_color: ctx.league.primary_color || '#c9a84c',
      user_name: ctx.memberName,
      team_a: match.team_a,
      team_b: match.team_b,
      team_a_flag: match.team_a_flag,
      team_b_flag: match.team_b_flag,
      predicted_winner: (pred.predicted_score_a ?? 0) > (pred.predicted_score_b ?? 0)
        ? match.team_a
        : (pred.predicted_score_b ?? 0) > (pred.predicted_score_a ?? 0)
          ? match.team_b : 'Draw',
      predicted_score_a: pred.predicted_score_a,
      predicted_score_b: pred.predicted_score_b,
      user_rank: ctx.memberRank,
      total_members: ctx.memberCount,
      invite_url: getLeagueShareUrl(ctx.league.slug),
    }
  }

  /* ── FINISHED ── */
  if (match.status === 'finished') {
    const correct = prediction?.is_correct_winner || prediction?.is_exact_score
    const exact = prediction?.is_exact_score
    const borderColor = !prediction ? '#2a2a2a' : correct ? '#2dc653' : '#2a2a2a'

    return (
      <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden"
        style={{ borderLeftWidth: 3, borderLeftColor: borderColor, opacity: prediction && !correct ? 0.75 : 1 }}>
        <div className="p-4" style={{ backgroundColor: correct ? 'rgba(45,198,83,0.04)' : '#111' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase bg-[#1e1e1e] px-2 py-0.5 rounded-full">FT</span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_a} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_a}</span>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-0.5">
              <div className="flex items-center gap-1">
                <span className="fifa-score text-4xl text-[#f0f0f0] leading-none">{match.score_a ?? 0}</span>
                <span className="fifa-score text-2xl text-zinc-600 mx-0.5">—</span>
                <span className="fifa-score text-4xl text-[#f0f0f0] leading-none">{match.score_b ?? 0}</span>
              </div>
              <span className="text-[10px] text-zinc-700">Final score</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_b} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_b}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e]">
            {prediction ? (
              <span className="text-xs text-zinc-600">
                Your pick: <span className="text-zinc-400 font-medium tabular-nums">
                  {prediction.predicted_score_a} — {prediction.predicted_score_b}
                </span>
              </span>
            ) : (
              <span className="text-xs italic text-zinc-700">No prediction</span>
            )}
            {prediction && (
              correct ? (
                <span className="text-xs font-bold" style={{ color: '#2dc653' }}>
                  {exact ? '🎯' : '✓'} +{prediction.points_earned} pts
                </span>
              ) : (
                <span className="text-xs font-semibold text-zinc-600">✗ 0 pts</span>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── LIVE ── */
  if (match.status === 'live') {
    return (
      <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden"
        style={{ borderLeftWidth: 3, borderLeftColor: '#ff2d2d' }}>
        <div className="p-4 bg-[#111]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            <div className="flex items-center gap-1.5">
              <span className="live-pulse w-2 h-2 rounded-full bg-[#ff2d2d] block" />
              <span className="text-[10px] font-bold text-[#ff2d2d] tracking-wider">LIVE</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_a} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center">{match.team_a}</span>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-0.5">
              <div className="flex items-center gap-1">
                <span className="fifa-score text-4xl text-[#ff2d2d] leading-none">{match.score_a ?? 0}</span>
                <span className="fifa-score text-2xl text-zinc-600 mx-0.5">—</span>
                <span className="fifa-score text-4xl text-[#ff2d2d] leading-none">{match.score_b ?? 0}</span>
              </div>
              <span className="text-[10px] text-zinc-600">In progress</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_b} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center">{match.team_b}</span>
            </div>
          </div>
          {prediction && (
            <p className="text-xs text-zinc-600 mt-3 pt-3 border-t border-[#1e1e1e]">
              Your pick: <span className="text-zinc-400 tabular-nums">{prediction.predicted_score_a} — {prediction.predicted_score_b}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  /* ── LOCKED (has prediction, window still open for editing) ── */
  if (hasPrediction && !sheetOpen) {
    return (
      <>
        <div className="rounded-2xl border border-[#c9a84c33] overflow-hidden"
          style={{ borderLeftWidth: 3, borderLeftColor: '#c9a84c' }}>
          <div className="p-4 bg-[#111]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
              {isOpen ? (
                <span className="text-[10px] font-semibold text-amber-500">
                  Closes in {timeUntilKickoff(match.kickoff_time)}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#c9a84c]">🔒 Locked</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex flex-col items-center gap-2 flex-1">
                <TeamFlag name={match.team_a} size="md" />
                <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_a}</span>
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
                <span className="text-[10px] text-zinc-600">Your prediction</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <TeamFlag name={match.team_b} size="md" />
                <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_b}</span>
              </div>
            </div>

            {toast && (
              <div className="text-center text-xs font-bold text-[#2dc653] mb-2">{toast}</div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e]">
              {socialProof?.total ? (
                <SocialProofText sp={socialProof} nameA={match.team_a} nameB={match.team_b} />
              ) : (
                match.city ? (
                  <span className="text-[10px] text-zinc-700">📍 {match.city} · {dateStr}</span>
                ) : <span />
              )}
              {isOpen && (
                <button onClick={() => setSheetOpen(true)}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-[#c9a84c] transition-colors shrink-0 ml-2">
                  Edit →
                </button>
              )}
            </div>

            {onShare && shareContext && (
              <button
                onClick={() => onShare(buildShareData(prediction))}
                className="mt-3 w-full py-2.5 rounded-xl text-black font-bold tracking-widest transition-opacity active:opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
                  fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
                  fontSize: '0.95rem',
                  letterSpacing: '0.12em',
                }}
              >
                📤 SHARE PREDICTION
              </button>
            )}
          </div>
        </div>

        {sheetOpen && (
          <PredictionSheet
            teamA={match.team_a} teamB={match.team_b}
            scoreA={scoreA} scoreB={scoreB}
            onScoreAChange={setScoreA} onScoreBChange={setScoreB}
            onConfirm={handleConfirm} onClose={() => setSheetOpen(false)}
            saving={saving} isEdit={hasPrediction}
          />
        )}
      </>
    )
  }

  /* ── UPCOMING (no prediction yet) — tappable card ── */
  return (
    <>
      <button
        className="w-full text-left rounded-2xl border border-[#1e1e1e] bg-[#111] overflow-hidden transition-all active:scale-[0.98] active:border-[#c9a84c33]"
        onClick={() => isOpen && setSheetOpen(true)}
        disabled={!isOpen}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{stage}</span>
            {isOpen ? (
              <span className="text-[10px] font-semibold text-amber-500">
                {timeUntilKickoff(match.kickoff_time)} left
              </span>
            ) : (
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Closed</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_a} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_a}</span>
            </div>

            <div className="flex flex-col items-center shrink-0 gap-1">
              <span className="fifa-score text-2xl text-zinc-600 leading-none">VS</span>
              <span className="text-[10px] text-zinc-700">{dateStr}</span>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamFlag name={match.team_b} size="md" />
              <span className="fifa-score text-lg text-[#f0f0f0] text-center leading-tight">{match.team_b}</span>
            </div>
          </div>

          {toast && (
            <div className="text-center text-xs font-bold text-[#2dc653] mb-2">{toast}</div>
          )}

          <div className="flex items-center justify-between">
            {match.city ? (
              <span className="text-[10px] text-zinc-700">📍 {match.city}</span>
            ) : socialProof?.total ? (
              <SocialProofText sp={socialProof} nameA={match.team_a} nameB={match.team_b} />
            ) : <span />}

            {isOpen && (
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#c9a84c22', color: '#c9a84c' }}>
                Predict →
              </span>
            )}
          </div>

          {socialProof?.total && match.city ? (
            <div className="mt-2">
              <SocialProofText sp={socialProof} nameA={match.team_a} nameB={match.team_b} />
            </div>
          ) : null}
        </div>
      </button>

      {sheetOpen && (
        <PredictionSheet
          teamA={match.team_a} teamB={match.team_b}
          scoreA={scoreA} scoreB={scoreB}
          onScoreAChange={setScoreA} onScoreBChange={setScoreB}
          onConfirm={handleConfirm} onClose={() => setSheetOpen(false)}
          saving={saving} isEdit={hasPrediction}
        />
      )}
    </>
  )
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function SocialProofText({ sp, nameA, nameB }: {
  sp: MatchSocialProof; nameA: string; nameB: string
}) {
  if (sp.total === 0) return null
  const parts: string[] = []
  if (sp.teamA > 0) parts.push(`${sp.teamA} → ${nameA.split(' ')[0]}`)
  if (sp.teamB > 0) parts.push(`${sp.teamB} → ${nameB.split(' ')[0]}`)
  if (sp.draw > 0) parts.push(`${sp.draw} draw`)
  return (
    <p className="text-[10px] text-zinc-700 leading-snug">
      {parts.join(' · ')}
    </p>
  )
}

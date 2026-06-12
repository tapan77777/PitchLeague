'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague } from '@/lib/member'
import { getAccuracy } from '@/lib/utils'
import { League, LeagueMember, Badge } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'

const GOLD = '#c9a84c'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const SANS = "'Arial', 'Helvetica Neue', sans-serif"

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
  const [confirmLeave, setConfirmLeave] = useState(false)

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

  function handleLeaveConfirmed() {
    // Remove this league from localStorage session
    try {
      const raw = localStorage.getItem('pitchleague_sessions')
      if (raw) {
        const s = JSON.parse(raw)
        if (s.leagues) delete s.leagues[slug]
        localStorage.setItem('pitchleague_sessions', JSON.stringify(s))
      }
    } catch { /* ignore */ }
    router.replace('/')
  }

  if (loading || !memberId) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-7 h-7 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 40, marginBottom: 16 }}>⚠️</span>
        <p style={{ color: '#666', fontFamily: SANS, fontSize: 14, marginBottom: 16 }}>Failed to load profile.</p>
        <button onClick={() => fetchData(memberId)} style={{ background: GOLD, color: '#000', fontFamily: BEBAS, fontSize: 16, padding: '10px 24px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  const { league, membership, memberCount, predictions, badges } = data
  const initials = (memberName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const accuracy = getAccuracy(membership.correct_predictions ?? 0, predictions.filter(p => p.match_status === 'finished').length)
  const recentPreds = predictions.slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: 96 }}>

      {/* Leave confirm modal */}
      {confirmLeave && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🚪</span>
            <h2 style={{ fontFamily: BEBAS, fontSize: 22, color: '#fff', letterSpacing: '0.1em', marginBottom: 8 }}>LEAVE LEAGUE?</h2>
            <p style={{ fontFamily: SANS, fontSize: 13, color: '#555', marginBottom: 24, lineHeight: 1.5 }}>
              You can rejoin anytime with the invite link. Your predictions will be saved.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleLeaveConfirmed} style={{ width: '100%', padding: '13px 0', border: '1px solid #e74c3c', background: 'transparent', borderRadius: 10, color: '#e74c3c', fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Yes, leave league
              </button>
              <button onClick={() => setConfirmLeave(false)} style={{ width: '100%', padding: '13px 0', border: '1px solid #222', background: 'transparent', borderRadius: 10, color: '#555', fontFamily: SANS, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        padding: '0 16px', height: 52,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 520, margin: '0 auto', width: '100%' }}>
          <span style={{ fontFamily: BEBAS, fontSize: 20, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', flex: 1 }}>
            {league.name}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            PROFILE
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Hero ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0 24px' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `2px solid ${GOLD}`,
            background: `${GOLD}1a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: BEBAS, fontSize: 26, color: GOLD,
            marginBottom: 12, position: 'relative',
          }}>
            {initials}
            {membership.rank <= 3 && (
              <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 18 }}>
                {['🥇','🥈','🥉'][membership.rank - 1]}
              </span>
            )}
          </div>
          {/* Name */}
          <h1 style={{ fontFamily: BEBAS, fontSize: 22, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {memberName || 'PLAYER'}
          </h1>
          {/* League */}
          <p style={{ fontFamily: SANS, fontSize: 10, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            {league.name}
          </p>
          {/* Rank pill */}
          <div style={{
            display: 'inline-block',
            border: `1px solid ${GOLD}55`,
            borderRadius: 999, padding: '5px 14px',
            fontFamily: SANS, fontSize: 12, fontWeight: 700,
            color: GOLD, background: `${GOLD}0d`,
          }}>
            #{membership.rank} of {memberCount} players
          </div>
        </div>

        {/* ── Stats 2x2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'TOTAL POINTS', value: String(membership.total_points ?? 0), color: GOLD },
            { label: 'ACCURACY',     value: accuracy,                              color: '#2dc653' },
            { label: 'EXACT SCORES', value: String(membership.exact_scores ?? 0),  color: '#378ADD' },
            { label: 'BEST STREAK',  value: String(membership.best_streak ?? 0),   color: '#e74c3c', suffix: '🔥' },
          ].map(({ label, value, color, suffix }) => (
            <div key={label} style={{
              background: '#0d0d0d', borderRadius: 10, padding: 14,
              borderBottom: `2px solid ${color}`,
              border: '1px solid #1a1a1a',
              borderBottomColor: color,
            }}>
              <div style={{ fontFamily: SANS, fontSize: 9, color: '#444', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontFamily: BEBAS, fontSize: 28, color: '#fff', lineHeight: 1 }}>
                {value}{suffix ?? ''}
              </div>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>BADGES</SectionLabel>
          {badges.length === 0 ? (
            <div style={{
              border: '1px dashed #222', borderRadius: 12,
              padding: '24px 16px', textAlign: 'center',
            }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🎯</span>
              <p style={{ fontFamily: SANS, fontSize: 13, color: '#444' }}>Keep predicting to earn badges</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px 4px' }}>
              {badges.map(badge => (
                <div key={badge.id} style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#0d0d0d', border: `1px solid ${GOLD}44`,
                  borderRadius: 999, padding: '7px 14px',
                }}>
                  <span style={{ fontSize: 15 }}>{badge.badge_emoji}</span>
                  <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: GOLD, whiteSpace: 'nowrap' }}>
                    {badge.badge_label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent predictions ── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>RECENT PREDICTIONS</SectionLabel>
          {recentPreds.length === 0 ? (
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10, padding: '24px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🎯</span>
              <p style={{ fontFamily: SANS, fontSize: 13, color: '#444' }}>No predictions yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentPreds.map(pred => <PredRow key={pred.id} pred={pred} />)}
            </div>
          )}
        </div>

        {/* ── Leave league ── */}
        <div style={{ paddingBottom: 16 }}>
          <button
            onClick={() => setConfirmLeave(true)}
            style={{
              width: '100%', padding: '14px 0',
              border: '1px solid #e74c3c33', background: 'transparent',
              borderRadius: 12, color: '#e74c3c',
              fontFamily: SANS, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Leave League
          </button>
          <p style={{ fontFamily: SANS, fontSize: 11, color: '#2a2a2a', textAlign: 'center', marginTop: 8 }}>
            You can rejoin anytime with the invite link.
          </p>
        </div>
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

/* ─── helpers ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555' }}>
        {children}
      </span>
    </div>
  )
}

function PredRow({ pred }: { pred: PredictionRow }) {
  const finished = pred.match_status === 'finished'
  const live = pred.match_status === 'live'
  const correct = pred.is_correct_winner || pred.is_exact_score
  const exact = pred.is_exact_score
  const pts = pred.points_earned ?? 0

  const leftBorder = finished ? (correct ? '#2dc653' : '#333') : live ? '#ff2d2d' : '#252525'

  return (
    <div style={{
      background: '#0d0d0d',
      borderRadius: '0 10px 10px 0',
      border: '1px solid #1a1a1a',
      borderLeft: `3px solid ${leftBorder}`,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: !finished && !live ? 0.6 : 1,
    }}>
      {/* Left: flags + match + pick */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: 14 }}>{pred.team_a_flag || '🏳️'}</span>
          <span style={{ fontFamily: BEBAS, fontSize: 14, color: '#f0f0f0', letterSpacing: '0.06em', textTransform: 'uppercase', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pred.team_a}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 10, color: '#333' }}>vs</span>
          <span style={{ fontFamily: BEBAS, fontSize: 14, color: '#f0f0f0', letterSpacing: '0.06em', textTransform: 'uppercase', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pred.team_b}
          </span>
          <span style={{ fontSize: 14 }}>{pred.team_b_flag || '🏳️'}</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: '#555' }}>
          Predicted: <span style={{ color: '#888', fontWeight: 600 }}>{pred.predicted_score_a}–{pred.predicted_score_b}</span>
          {finished && pred.score_a != null && (
            <span style={{ marginLeft: 8 }}>FT: <span style={{ color: '#666' }}>{pred.score_a}–{pred.score_b}</span></span>
          )}
        </div>
      </div>
      {/* Right: result */}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 56 }}>
        {finished ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span style={{ fontSize: 14 }}>{exact ? '✅' : correct ? '✅' : '❌'}</span>
            <span style={{ fontFamily: BEBAS, fontSize: 16, color: correct ? '#2dc653' : '#333', lineHeight: 1 }}>
              {pts > 0 ? `+${pts}pts` : '0pts'}
            </span>
            {exact && <span style={{ fontFamily: SANS, fontSize: 9, color: '#2dc65399', letterSpacing: '0.1em', textTransform: 'uppercase' }}>EXACT</span>}
          </div>
        ) : live ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="live-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff2d2d', display: 'inline-block' }} />
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: '#ff2d2d', letterSpacing: '0.1em' }}>LIVE</span>
          </div>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 14, color: '#2a2a2a' }}>🔒</span>
        )}
      </div>
    </div>
  )
}

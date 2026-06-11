'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague } from '@/lib/member'
import { Match, Prediction, League } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'

const GOLD = '#c9a84c'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"

interface PageData {
  league: League
  matches: Match[]
  predictions: Record<string, Prediction>
}

function formatStage(match: Match): string {
  if (match.group_name) return `GROUP ${match.group_name}`
  const map: Record<string, string> = {
    round_of_32: 'ROUND OF 32',
    quarterfinal: 'QUARTERFINAL',
    semifinal: 'SEMIFINAL',
    final: 'FINAL',
  }
  return map[match.stage] ?? match.stage.toUpperCase()
}

export default function HistoryPage({ params }: { params: { slug: string } }) {
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
      if (!leagueRes.data) { setError('not_found'); setLoading(false); return }
      const leagueId = leagueRes.data.id

      const [matchesRes, predRes] = await Promise.all([
        supabase.from('matches').select('*').eq('status', 'finished')
          .order('kickoff_time', { ascending: false }),
        supabase.from('predictions').select('*').eq('league_id', leagueId).eq('clerk_id', memberId),
      ])

      const predMap: Record<string, Prediction> = {}
      for (const p of predRes.data ?? []) predMap[p.match_id] = p

      setData({ league: leagueRes.data, matches: matchesRes.data ?? [], predictions: predMap })
    } catch {
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { if (memberId) fetchData(memberId) }, [memberId, fetchData])

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
        <span style={{ fontSize: 40, marginBottom: 12 }}>⚠️</span>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>Failed to load match history.</p>
        <button onClick={() => fetchData(memberId)} style={{ color: GOLD, background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    )
  }

  const { league, matches, predictions } = data

  // Stats
  const myMatches = matches.filter(m => predictions[m.id])
  const totalPoints = myMatches.reduce((s, m) => s + (predictions[m.id]?.points_earned ?? 0), 0)
  const correct = myMatches.filter(m => predictions[m.id]?.is_correct_winner).length
  const exact = myMatches.filter(m => predictions[m.id]?.is_exact_score).length
  const accuracy = myMatches.length > 0 ? Math.round((correct / myMatches.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 520, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <Link href={`/play/${slug}`} style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontFamily: BEBAS, fontSize: 22, letterSpacing: '0.15em', color: '#fff', margin: 0 }}>
          MATCH HISTORY
        </h1>
        {/* Accuracy pill */}
        <div style={{
          background: '#161616', border: `1px solid ${GOLD}44`,
          borderRadius: 999, padding: '4px 10px',
          fontFamily: "'Arial', sans-serif", fontSize: 11, color: GOLD, fontWeight: 700,
        }}>
          {accuracy}% accurate
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, margin: '16px 0 20px' }}>
          {[
            { label: 'TOTAL PTS', value: totalPoints, color: GOLD },
            { label: `CORRECT`, value: `${correct}/${myMatches.length}`, color: '#2dc653' },
            { label: 'EXACT', value: exact, color: '#3498db' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: '#111', border: '1px solid #1e1e1e',
              borderRadius: 12, padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: BEBAS, fontSize: 28, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: "'Arial', sans-serif", fontSize: 9, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Match list */}
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
            <p style={{ color: '#555', fontFamily: "'Arial', sans-serif", fontSize: 14, marginBottom: 6 }}>No finished matches yet.</p>
            <p style={{ color: '#333', fontFamily: "'Arial', sans-serif", fontSize: 12 }}>Check back after the first games!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(match => {
              const pred = predictions[match.id]
              const correct = pred?.is_correct_winner
              const exact = pred?.is_exact_score

              let borderColor = '#1e1e1e'
              let bgColor = '#111'
              let borderStyle = 'solid'
              if (!pred) { borderColor = '#1a1a1a'; bgColor = '#0d0d0d'; borderStyle = 'dashed' }
              else if (exact) { borderColor = '#2dc653'; bgColor = 'rgba(45,198,83,0.04)' }
              else if (correct) { borderColor = '#2dc653'; bgColor = 'rgba(45,198,83,0.03)' }

              const opacity = !pred ? 0.5 : correct ? 1 : 0.75

              return (
                <div
                  key={match.id}
                  style={{
                    background: bgColor, borderRadius: 14,
                    border: `1px solid #1e1e1e`,
                    borderLeft: `3px ${borderStyle} ${borderColor}`,
                    padding: '14px 16px', opacity,
                  }}
                >
                  {/* Top row: stage + FT badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Arial', sans-serif", fontSize: 9, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      {formatStage(match)}
                    </span>
                    <span style={{
                      fontFamily: "'Arial', sans-serif", fontSize: 9, fontWeight: 700,
                      color: '#555', background: '#1a1a1a', padding: '2px 8px', borderRadius: 999,
                      letterSpacing: '0.1em',
                    }}>
                      FT
                    </span>
                  </div>

                  {/* Teams & score */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{match.team_a_flag || '🏳️'}</span>
                      <span style={{ fontFamily: BEBAS, fontSize: 13, color: '#f0f0f0', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                        {match.team_a}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: BEBAS, fontSize: 36, color: '#f0f0f0', lineHeight: 1, letterSpacing: '0.05em' }}>
                        {match.score_a ?? 0} — {match.score_b ?? 0}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{match.team_b_flag || '🏳️'}</span>
                      <span style={{ fontFamily: BEBAS, fontSize: 13, color: '#f0f0f0', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                        {match.team_b}
                      </span>
                    </div>
                  </div>

                  {/* Prediction result row */}
                  <div style={{
                    marginTop: 12, paddingTop: 10, borderTop: '1px solid #1a1a1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {pred ? (
                      <>
                        <span style={{ fontFamily: "'Arial', sans-serif", fontSize: 12, color: '#666' }}>
                          Your pick:{' '}
                          <strong style={{ color: correct ? '#2dc653' : '#f0f0f0' }}>
                            {pred.predicted_score_a ?? 0}-{pred.predicted_score_b ?? 0}
                          </strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{exact ? '✅' : correct ? '✅' : '❌'}</span>
                          <span style={{
                            fontFamily: BEBAS, fontSize: 16,
                            color: exact ? '#2dc653' : correct ? '#2dc65399' : '#333',
                            letterSpacing: '0.05em',
                          }}>
                            {pred.points_earned > 0 ? `+${pred.points_earned} pts` : '0 pts'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontFamily: "'Arial', sans-serif", fontSize: 12, color: '#333' }}>
                        No prediction made · —
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Member name footer */}
        {memberName && (
          <p style={{ textAlign: 'center', color: '#2a2a2a', fontFamily: "'Arial', sans-serif", fontSize: 11, marginTop: 28 }}>
            {memberName} · {league.name}
          </p>
        )}
      </div>

      <PlayBottomNav slug={slug} />
    </div>
  )
}

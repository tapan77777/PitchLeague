'use client'

import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Match } from '@/types'

const GOLD = '#c9a84c'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const SANS = "'Arial', 'Helvetica Neue', sans-serif"

interface PredEntry {
  clerk_id: string
  display_name: string
  rank: number
  predicted_score_a: number
  predicted_score_b: number
  points_earned: number
  is_correct_winner: boolean | null
  is_exact_score: boolean | null
}

interface MemberEntry {
  clerk_id: string
  display_name: string
  rank: number
}

interface SheetData {
  preds: PredEntry[]
  nonPreds: MemberEntry[]
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function PredictionsSheet({
  match,
  leagueId,
  memberId,
  onClose,
}: {
  match: Match
  leagueId: string
  memberId: string
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const cache = useRef<Record<string, SheetData>>({})

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    async function load() {
      const key = `${match.id}__${leagueId}`
      if (cache.current[key]) {
        setSheetData(cache.current[key])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        console.log('Fetching predictions for match:', match.id, 'league:', leagueId)

        // Step 1 — fetch predictions flat (no join)
        const { data: predsData, error: predError } = await supabase
          .from('predictions')
          .select('*')
          .eq('match_id', match.id)
          .eq('league_id', leagueId)

        console.log('predictions:', predsData, predError)

        // Step 2 — fetch member info for those clerk_ids + all members
        const clerkIds = (predsData ?? []).map((p) => p.clerk_id)

        const [membersRes, allMembersRes] = await Promise.all([
          clerkIds.length > 0
            ? supabase
                .from('league_members')
                .select('clerk_id, display_name, rank, total_points')
                .eq('league_id', leagueId)
                .in('clerk_id', clerkIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from('league_members')
            .select('clerk_id, display_name, rank')
            .eq('league_id', leagueId)
            .order('rank', { ascending: true }),
        ])

        // Step 3 — merge
        const memberMap = new Map((membersRes.data ?? []).map((m) => [m.clerk_id, m]))

        const preds: PredEntry[] = (predsData ?? []).map((p) => {
          const m = memberMap.get(p.clerk_id)
          return {
            clerk_id: p.clerk_id,
            display_name: m?.display_name ?? 'Unknown',
            rank: m?.rank ?? 999,
            predicted_score_a: p.predicted_score_a ?? 0,
            predicted_score_b: p.predicted_score_b ?? 0,
            points_earned: p.points_earned ?? 0,
            is_correct_winner: p.is_correct_winner,
            is_exact_score: p.is_exact_score,
          }
        }).sort((a, b) => a.rank - b.rank)

        const predictedIds = new Set(preds.map((p) => p.clerk_id))
        const nonPreds: MemberEntry[] = (allMembersRes.data ?? [])
          .filter((m) => !predictedIds.has(m.clerk_id))
          .map((m) => ({ clerk_id: m.clerk_id, display_name: m.display_name, rank: m.rank }))

        const result: SheetData = { preds, nonPreds }
        cache.current[key] = result
        setSheetData(result)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [match.id, leagueId])

  function close() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const preds = sheetData?.preds ?? []
  const total = preds.length
  const teamA_n = preds.filter((p) => p.predicted_score_a > p.predicted_score_b).length
  const teamB_n = preds.filter((p) => p.predicted_score_b > p.predicted_score_a).length
  const draw_n  = preds.filter((p) => p.predicted_score_a === p.predicted_score_b).length

  const statusLabel = match.status === 'finished' ? 'FT' : match.status === 'live' ? 'LIVE' : 'UPCOMING'
  const statusColor = match.status === 'live' ? '#ff2d2d' : match.status === 'finished' ? '#555' : GOLD

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.28s ease',
      }}
    >
      {/* tap outside to close */}
      <div className="absolute inset-0" onClick={close} />

      <div
        style={{
          position: 'relative',
          background: '#0d0d0d',
          borderRadius: '20px 20px 0 0',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          borderTop: `3px solid ${GOLD}`,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#252525' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '6px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #1a1a1a',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{match.team_a_flag || '🏳️'}</span>
            <span style={{ fontFamily: BEBAS, fontSize: 13, color: '#f0f0f0', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {match.team_a}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: '#333' }}>vs</span>
            <span style={{ fontFamily: BEBAS, fontSize: 13, color: '#f0f0f0', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {match.team_b}
            </span>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{match.team_b_flag || '🏳️'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700, color: statusColor,
              background: '#1a1a1a', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {match.status === 'live' && <span style={{ color: '#ff2d2d' }}>●</span>}
              {statusLabel}
            </span>
            <button
              onClick={close}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid #252525',
                background: 'transparent', color: '#555', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : total === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <p style={{ color: '#555', fontFamily: SANS, fontSize: 13, marginBottom: 4 }}>No predictions yet for this match.</p>
              <p style={{ color: '#2a2a2a', fontFamily: SANS, fontSize: 12 }}>Be the first!</p>
            </div>
          ) : (
            <>
              {/* Summary bars */}
              <div style={{ padding: '14px 16px 10px' }}>
                <p style={{ fontFamily: SANS, fontSize: 9, color: '#3a3a3a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                  WHO&apos;S WINNING THE DEBATE?
                </p>
                {[
                  { label: match.team_a, count: teamA_n, color: GOLD },
                  { label: 'Draw', count: draw_n, color: '#444' },
                  { label: match.team_b, count: teamB_n, color: '#d0d0d0' },
                ].map(({ label, count, color }) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontFamily: SANS, fontSize: 11, color: '#666' }}>{label}</span>
                        <span style={{ fontFamily: SANS, fontSize: 11, color: '#444' }}>{pct}% · {count}</span>
                      </div>
                      <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, background: color,
                          borderRadius: 3, opacity: pct === 0 ? 0 : 1,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ height: 1, background: '#141414' }} />

              {/* Predictions list */}
              <div>
                {preds.map((entry) => {
                  const isMe = entry.clerk_id === memberId
                  const finished = match.status === 'finished'
                  const exact = entry.is_exact_score
                  const correct = entry.is_correct_winner || exact

                  return (
                    <div
                      key={entry.clerk_id}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '0 16px', height: 52,
                        borderBottom: '1px solid #111',
                        borderLeft: isMe ? `3px solid ${GOLD}` : '3px solid transparent',
                        background: isMe ? 'rgba(201,168,76,0.04)' : 'transparent',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Rank + name */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <span style={{ fontFamily: BEBAS, fontSize: 14, color: '#444', minWidth: 22, flexShrink: 0 }}>
                          {rankLabel(entry.rank)}
                        </span>
                        <span style={{
                          fontFamily: SANS, fontSize: 13,
                          color: isMe ? '#f0f0f0' : '#aaa',
                          fontWeight: isMe ? 700 : 400,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {entry.display_name}
                        </span>
                        {isMe && (
                          <span style={{ fontFamily: SANS, fontSize: 10, color: '#444', flexShrink: 0 }}>(you)</span>
                        )}
                      </div>

                      {/* Score */}
                      <div style={{ margin: '0 10px', flexShrink: 0, textAlign: 'center' }}>
                        <span style={{ fontFamily: BEBAS, fontSize: 20, color: GOLD, letterSpacing: '0.04em' }}>
                          {entry.predicted_score_a} — {entry.predicted_score_b}
                        </span>
                      </div>

                      {/* Result / pending */}
                      <div style={{ minWidth: 52, textAlign: 'right', flexShrink: 0 }}>
                        {finished ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 12 }}>{correct ? '✅' : '❌'}</span>
                            <span style={{
                              fontFamily: BEBAS, fontSize: 14, letterSpacing: '0.04em',
                              color: correct ? '#2dc653' : '#333',
                            }}>
                              {entry.points_earned > 0 ? `+${entry.points_earned}` : '0'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 14 }}>⏳</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Non-predictors */}
                {(sheetData?.nonPreds.length ?? 0) > 0 && (
                  <>
                    <div style={{
                      padding: '10px 16px 6px',
                      fontFamily: SANS, fontSize: 9, color: '#2a2a2a',
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                    }}>
                      HAVEN&apos;T PREDICTED YET
                    </div>
                    {sheetData!.nonPreds.map((m) => (
                      <div
                        key={m.clerk_id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 16px', opacity: 0.35,
                          borderBottom: '1px solid #0f0f0f',
                        }}
                      >
                        <span style={{ fontFamily: BEBAS, fontSize: 13, color: '#333', minWidth: 22 }}>
                          {rankLabel(m.rank)}
                        </span>
                        <span style={{ fontSize: 13 }}>👻</span>
                        <span style={{ fontFamily: SANS, fontSize: 12, color: '#444' }}>
                          {m.display_name} — hasn&apos;t predicted yet
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Bottom padding */}
                <div style={{ height: 20 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

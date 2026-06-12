'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, hasJoinedLeague } from '@/lib/member'
import { getLeagueShareUrl } from '@/lib/utils'
import { League, Badge, LeaderboardEntry } from '@/types'
import PlayBottomNav from '@/components/play/PlayBottomNav'
import { Copy, Check } from 'lucide-react'

const GOLD = '#c9a84c'
const SILVER = '#888888'
const BRONZE = '#cd7f32'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const SANS = "'Arial', 'Helvetica Neue', sans-serif"

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
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-7 h-7 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 40, marginBottom: 16 }}>⚠️</span>
        <p style={{ color: '#666', fontFamily: SANS, fontSize: 14, marginBottom: 16 }}>Failed to load leaderboard.</p>
        <button onClick={() => fetchData()} style={{ background: GOLD, color: '#000', fontFamily: BEBAS, fontSize: 16, padding: '10px 24px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  const { league, entries, matchesPlayed } = data
  const myEntry = entries.find(e => e.clerk_id === memberId)
  const top3 = entries.slice(0, Math.min(3, entries.length))

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: 96 }}>

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
          <div style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 999, padding: '4px 12px',
            fontFamily: SANS, fontSize: 11, fontWeight: 700,
            color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: '#0a0a0a',
          }}>
            {matchesPlayed} PLAYED
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Your position card ── */}
        {myEntry && (
          <div style={{
            background: '#0d0d0d',
            borderRadius: 12, marginTop: 16, marginBottom: 20,
            border: '1px solid #1e1e1e',
            borderLeft: `3px solid ${GOLD}`,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${GOLD}`,
              background: `${GOLD}1a`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: BEBAS, fontSize: 16, color: GOLD,
            }}>
              {myEntry.display_name.slice(0, 2).toUpperCase()}
            </div>
            {/* Name + rank */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {myEntry.display_name}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                #{myEntry.rank} OF {entries.length}
              </div>
            </div>
            {/* Points */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: BEBAS, fontSize: 36, color: GOLD, lineHeight: 1 }}>
                {myEntry.total_points}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 9, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>pts</div>
            </div>
          </div>
        )}

        {/* ── Invite nudge ── */}
        {entries.length <= 1 && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>👀</span>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Invite more players!</p>
            <p style={{ fontFamily: SANS, fontSize: 12, color: '#555', marginBottom: 16 }}>Share the link to start the competition.</p>
            <button onClick={copyInviteLink} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              color: copied ? '#000' : GOLD,
              border: `1px solid ${GOLD}`,
              background: copied ? GOLD : 'transparent',
              borderRadius: 999, padding: '10px 20px', cursor: 'pointer',
            }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        )}

        {/* ── Podium ── */}
        {top3.length >= 2 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>PODIUM</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
              {top3[1] && <PodiumSlot entry={top3[1]} place={2} />}
              {top3[0] && <PodiumSlot entry={top3[0]} place={1} />}
              {top3[2] && <PodiumSlot entry={top3[2]} place={3} />}
            </div>
          </div>
        )}

        {/* ── Full standings ── */}
        {entries.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionLabel>FULL STANDINGS</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map(entry => (
                <StandingsRow key={entry.clerk_id} entry={entry} isMe={entry.clerk_id === memberId} />
              ))}
            </div>
          </div>
        )}

        {/* Reward banner */}
        {league.reward_message && (
          <div style={{
            border: `1px solid ${GOLD}44`, background: `${GOLD}0a`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🎁</span>
            <div>
              <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, marginBottom: 4 }}>Rewards</p>
              <p style={{ fontFamily: SANS, fontSize: 13, color: '#f0f0f0', lineHeight: 1.5 }}>{league.reward_message}</p>
            </div>
          </div>
        )}
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

const PODIUM: Record<1|2|3, { color: string; avatarSize: number; barH: number; label: string }> = {
  1: { color: GOLD,   avatarSize: 60, barH: 56, label: '1ST' },
  2: { color: SILVER, avatarSize: 52, barH: 40, label: '2ND' },
  3: { color: BRONZE, avatarSize: 44, barH: 28, label: '3RD' },
}

function PodiumSlot({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const cfg = PODIUM[place]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 120 }}>
      {place === 1 && <span style={{ fontSize: 20, marginBottom: 4 }}>👑</span>}
      {/* Avatar */}
      <div style={{
        width: cfg.avatarSize, height: cfg.avatarSize, borderRadius: '50%',
        border: `2px solid ${cfg.color}`,
        background: `${cfg.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: BEBAS, fontSize: cfg.avatarSize * 0.32, color: cfg.color,
        marginBottom: 6, overflow: 'hidden', flexShrink: 0,
      }}>
        {entry.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : entry.display_name.slice(0, 2).toUpperCase()
        }
      </div>
      {/* Name */}
      <span style={{ fontFamily: BEBAS, fontSize: 13, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', padding: '0 4px' }}>
        {entry.display_name.split(' ')[0]}
      </span>
      {/* Points */}
      <span style={{ fontFamily: BEBAS, fontSize: 18, color: cfg.color, lineHeight: 1.1, marginBottom: 6 }}>
        {entry.total_points}
      </span>
      {/* Podium block */}
      <div style={{
        width: '100%', height: cfg.barH,
        background: `${cfg.color}33`,
        borderRadius: '6px 6px 0 0',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6,
      }}>
        <span style={{ fontFamily: BEBAS, fontSize: 11, color: cfg.color, letterSpacing: '0.1em' }}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}

function StandingsRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const rankColor = entry.rank === 1 ? GOLD : entry.rank === 2 ? SILVER : entry.rank === 3 ? BRONZE : '#444'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: isMe ? `${GOLD}08` : '#0d0d0d', borderRadius: 10, padding: '10px 14px',
      border: isMe ? `1px solid ${GOLD}55` : '1px solid #1a1a1a',
      borderLeft: entry.rank === 1 ? `3px solid ${GOLD}` : isMe ? `3px solid ${GOLD}88` : '3px solid #1a1a1a',
    } as React.CSSProperties}>
      {/* Rank */}
      <span style={{ fontFamily: BEBAS, fontSize: 18, color: rankColor, minWidth: 26, textAlign: 'center', flexShrink: 0 }}>
        {entry.rank}
      </span>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${rankColor}18`, border: `1px solid ${rankColor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: BEBAS, fontSize: 12, color: rankColor, overflow: 'hidden',
      }}>
        {entry.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : entry.display_name.slice(0, 2).toUpperCase()
        }
      </div>
      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? GOLD : '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.display_name}
          {isMe && <span style={{ fontFamily: SANS, fontSize: 10, color: '#555', fontWeight: 400, marginLeft: 6 }}>(you)</span>}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 10, color: '#444', marginTop: 2 }}>
          {entry.correct_predictions} correct · {entry.exact_scores} exact
          {entry.current_streak > 1 && ` · 🔥${entry.current_streak}`}
        </div>
      </div>
      {/* Points */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontFamily: BEBAS, fontSize: 26, color: isMe ? GOLD : '#f0f0f0', lineHeight: 1 }}>
          {entry.total_points}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 9, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>pts</div>
      </div>
    </div>
  )
}

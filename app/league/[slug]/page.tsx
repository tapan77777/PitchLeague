'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateMemberId, getMemberName, hasJoinedLeague, addLeagueToSession } from '@/lib/member'

const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"

interface LeagueData {
  id: string
  name: string
  description: string | null
  welcome_message: string | null
  primary_color: string
  accent_color: string
  logo_url: string | null
  invite_code: string
  slug: string
}

export default function LeagueJoinPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()

  const [league, setLeague] = useState<LeagueData | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [memberName, setMemberName] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hasJoinedLeague(slug)) {
      setAlreadyJoined(true)
      setMemberName(getMemberName())
    } else {
      const savedName = getMemberName()
      if (savedName) setDisplayName(savedName)
    }
  }, [slug])

  useEffect(() => {
    async function fetchLeague() {
      try {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name, description, welcome_message, primary_color, accent_color, logo_url, invite_code, slug')
          .eq('slug', slug)
          .maybeSingle()

        if (error || !data) { setNotFound(true); return }

        setLeague(data as LeagueData)

        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', data.id)

        setMemberCount(count ?? 0)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchLeague()
  }, [slug])

  useEffect(() => {
    if (!loading && league && !alreadyJoined) inputRef.current?.focus()
  }, [loading, league, alreadyJoined])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!league || !displayName.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const member_id = getOrCreateMemberId()
      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: league.invite_code,
          display_name: displayName.trim(),
          member_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error || 'Failed to join. Please try again.'); setJoining(false); return }
      addLeagueToSession(league.slug, displayName.trim())
      router.push(`/play/${slug}`)
    } catch {
      setJoinError('Network error. Please try again.')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  if (notFound || !league) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>🏟️</span>
        <h1 style={{ color: '#fff', fontFamily: BEBAS, fontSize: 28, letterSpacing: '0.1em', marginBottom: 8 }}>LEAGUE NOT FOUND</h1>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 24, maxWidth: 280 }}>
          This invite link may be invalid or the league has been removed.
        </p>
        <Link href="/" style={{ background: GOLD, color: '#000', fontFamily: BEBAS, fontSize: 16, letterSpacing: '0.1em', padding: '12px 28px', borderRadius: 999, textDecoration: 'none' }}>
          GO TO PITCHLEAGUE
        </Link>
      </div>
    )
  }

  // Already joined — show welcome back screen
  if (alreadyJoined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
        <p style={{ color: '#666', fontFamily: "'Arial', sans-serif", fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          WELCOME BACK
        </p>
        <h1 style={{ color: '#fff', fontFamily: BEBAS, fontSize: 36, letterSpacing: '0.15em', marginBottom: 4 }}>
          {memberName || 'PLAYER'}!
        </h1>
        <p style={{ color: '#444', fontSize: 13, fontFamily: "'Arial', sans-serif", marginBottom: 32 }}>
          You&apos;re already in {league.name}
        </p>
        <Link
          href={`/play/${slug}`}
          style={{
            display: 'block', width: '100%', maxWidth: 340,
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            color: '#000', fontFamily: BEBAS, fontSize: 18, letterSpacing: '0.12em',
            padding: '16px 0', borderRadius: 14, textDecoration: 'none', textAlign: 'center',
          }}
        >
          CONTINUE PREDICTING →
        </Link>
      </div>
    )
  }

  const primary = league.primary_color || GOLD

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* ── HERO SECTION (top ~40%) ── */}
      <div style={{
        position: 'relative',
        background: `radial-gradient(ellipse at 50% 0%, ${primary}26 0%, transparent 70%), #0f0f0f`,
        padding: '56px 24px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        {/* Background color wash */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `${primary}0d`,
          pointerEvents: 'none',
        }} />

        {/* Logo or initial */}
        {league.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={league.logo_url}
            alt={league.name}
            style={{
              width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
              border: `2px solid ${GOLD}`, marginBottom: 16, position: 'relative', zIndex: 1,
            }}
          />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `${GOLD}1a`, border: `2px solid ${GOLD}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: BEBAS, fontSize: 32, color: GOLD,
            marginBottom: 16, position: 'relative', zIndex: 1,
          }}>
            {league.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* FIFA badge */}
        <p style={{
          color: GOLD, fontFamily: "'Arial', sans-serif", fontSize: 10,
          fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
          marginBottom: 10, position: 'relative', zIndex: 1,
        }}>
          FIFA WORLD CUP 2026 PREDICTION LEAGUE
        </p>

        {/* League name */}
        <h1 style={{
          fontFamily: BEBAS, fontSize: 38, letterSpacing: '0.15em',
          color: '#fff', margin: '0 0 12px', lineHeight: 1, textTransform: 'uppercase',
          position: 'relative', zIndex: 1,
        }}>
          {league.name}
        </h1>

        {/* Member count pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: 999, padding: '6px 14px',
          fontFamily: "'Arial', sans-serif", fontSize: 13, color: '#ccc',
          marginBottom: league.welcome_message ? 16 : 0,
          position: 'relative', zIndex: 1,
        }}>
          <span>👥</span>
          <span><strong style={{ color: '#fff' }}>{memberCount}</strong> {memberCount === 1 ? 'member' : 'members'} already playing</span>
        </div>

        {/* Welcome message */}
        {(league.welcome_message || league.description) && (
          <p style={{
            color: '#777', fontFamily: "'Arial', sans-serif", fontSize: 14,
            lineHeight: 1.6, maxWidth: 320, marginTop: 14,
            position: 'relative', zIndex: 1,
          }}>
            {league.welcome_message || league.description}
          </p>
        )}
      </div>

      {/* ── JOIN FORM (bottom ~60%) ── */}
      <div style={{
        maxWidth: 440, margin: '0 auto',
        padding: '32px 24px 48px',
        animation: 'slideUp 0.35s ease-out',
      }}>
        <h2 style={{
          fontFamily: BEBAS, fontSize: 32, letterSpacing: '0.15em',
          color: GOLD, margin: '0 0 6px', textAlign: 'center',
        }}>
          JOIN THE LEAGUE
        </h2>
        <p style={{
          color: '#555', fontFamily: "'Arial', sans-serif", fontSize: 13,
          textAlign: 'center', marginBottom: 28,
        }}>
          Enter your name to start predicting
        </p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            ref={inputRef}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            required
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#161616', border: `1.5px solid ${displayName ? GOLD + '88' : '#2a2a2a'}`,
              borderRadius: 12, padding: '16px 18px',
              color: '#fff', fontSize: 18,
              fontFamily: "'Arial', sans-serif",
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = GOLD }}
            onBlur={e => { e.currentTarget.style.borderColor = displayName ? GOLD + '88' : '#2a2a2a' }}
          />

          {joinError && (
            <p style={{ color: '#e74c3c', fontSize: 12, fontFamily: "'Arial', sans-serif", margin: 0 }}>
              {joinError}
            </p>
          )}

          <button
            type="submit"
            disabled={joining || !displayName.trim()}
            style={{
              width: '100%', height: 56, borderRadius: 14, border: 'none',
              background: joining || !displayName.trim()
                ? '#2a2a2a'
                : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              color: joining || !displayName.trim() ? '#555' : '#000',
              fontFamily: BEBAS, fontSize: 20, letterSpacing: '0.12em',
              cursor: joining || !displayName.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s',
            }}
          >
            {joining ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                JOINING…
              </>
            ) : (
              'JOIN & START PREDICTING →'
            )}
          </button>
        </form>

        <p style={{
          color: '#333', fontFamily: "'Arial', sans-serif", fontSize: 12,
          textAlign: 'center', marginTop: 16,
        }}>
          Free to join · No account needed
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          {['🎯 Predict scores', '📈 Climb the board', '📲 Share your picks'].map(f => (
            <div key={f} style={{
              background: '#161616', border: '1px solid #222', borderRadius: 999,
              padding: '6px 14px', color: '#555',
              fontFamily: "'Arial', sans-serif", fontSize: 12,
            }}>
              {f}
            </div>
          ))}
        </div>

        <p style={{ color: '#222', fontFamily: "'Arial', sans-serif", fontSize: 11, textAlign: 'center', marginTop: 32 }}>
          Powered by{' '}
          <Link href="/" style={{ color: '#333', textDecoration: 'none' }}>PitchLeague</Link>
          {' '}· FIFA 2026 ⚽
        </p>
      </div>
    </div>
  )
}

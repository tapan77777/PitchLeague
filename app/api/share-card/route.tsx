import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GOLD = '#c9a84c'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const teamA    = searchParams.get('teamA')    || 'Team A'
  const teamB    = searchParams.get('teamB')    || 'Team B'
  const scoreA   = searchParams.get('scoreA')   || '0'
  const scoreB   = searchParams.get('scoreB')   || '0'
  const league   = searchParams.get('league')   || 'FIFA League'
  const rank     = searchParams.get('rank')     || '1'
  const total    = searchParams.get('total')    || '1'
  const flagA    = searchParams.get('flagA')    || '🏴'
  const flagB    = searchParams.get('flagB')    || '🏴'
  const userName = searchParams.get('name')     || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: `8px solid ${GOLD}`,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Top gold glow ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: `radial-gradient(ellipse at 50% 0%, ${GOLD}22 0%, transparent 65%)`,
          display: 'flex',
        }} />

        {/* ── Corner accents ── */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 160, height: 160,
          background: `linear-gradient(135deg, transparent 50%, ${GOLD}33 50%)`,
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 160, height: 160,
          background: `linear-gradient(315deg, transparent 50%, ${GOLD}33 50%)`,
          display: 'flex',
        }} />

        {/* ── Content column ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '100px 80px 0',
          width: '100%',
          flex: 1,
        }}>

          {/* League name */}
          <div style={{
            color: GOLD,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {league}
          </div>

          {/* Tournament badge */}
          <div style={{
            color: '#555',
            fontSize: 26,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: 80,
          }}>
            FIFA WORLD CUP 2026
          </div>

          {/* MY PREDICTION */}
          <div style={{
            color: GOLD,
            fontSize: 30,
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            marginBottom: 70,
            borderTop: `1px solid ${GOLD}44`,
            borderBottom: `1px solid ${GOLD}44`,
            padding: '14px 40px',
          }}>
            MY PREDICTION
          </div>

          {/* Teams + Score row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 80,
          }}>
            {/* Team A */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', flex: 1, gap: 16,
            }}>
              <div style={{ fontSize: 130 }}>{flagA}</div>
              <div style={{
                color: '#f0f0f0',
                fontSize: 48,
                fontWeight: 700,
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.1,
              }}>
                {teamA}
              </div>
            </div>

            {/* Score */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}>
              <div style={{
                color: GOLD,
                fontSize: 180,
                fontWeight: 900,
                lineHeight: 1,
              }}>
                {scoreA}
              </div>
              <div style={{ color: '#333', fontSize: 100, lineHeight: 1, padding: '0 8px' }}>
                —
              </div>
              <div style={{
                color: GOLD,
                fontSize: 180,
                fontWeight: 900,
                lineHeight: 1,
              }}>
                {scoreB}
              </div>
            </div>

            {/* Team B */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', flex: 1, gap: 16,
            }}>
              <div style={{ fontSize: 130 }}>{flagB}</div>
              <div style={{
                color: '#f0f0f0',
                fontSize: 48,
                fontWeight: 700,
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.1,
              }}>
                {teamB}
              </div>
            </div>
          </div>

          {/* Gold divider */}
          <div style={{
            width: '100%',
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${GOLD}66 30%, ${GOLD}66 70%, transparent 100%)`,
            marginBottom: 60,
            display: 'flex',
          }} />

          {/* Rank card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '44px 60px',
            background: `${GOLD}12`,
            border: `1px solid ${GOLD}44`,
            borderRadius: 24,
            width: '80%',
            marginBottom: 40,
          }}>
            <div style={{
              color: GOLD,
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1,
            }}>
              #{rank}
            </div>
            <div style={{ color: '#888', fontSize: 30 }}>
              of {total} members
            </div>
            {userName ? (
              <div style={{ color: '#555', fontSize: 26, letterSpacing: '0.08em', marginTop: 4 }}>
                {userName}
              </div>
            ) : null}
          </div>

          {/* Join nudge */}
          <div style={{
            color: '#2a2a2a',
            fontSize: 28,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 'auto',
            paddingBottom: 60,
          }}>
            PITCHLEAGUE.VERCEL.APP
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  )
}

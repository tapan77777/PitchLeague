'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ShareCardData } from '@/types'

const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'

function PredictionCard({ data }: { data: ShareCardData }) {
  const scoreA = data.predicted_score_a ?? 0
  const scoreB = data.predicted_score_b ?? 0
  const leagueUrl = data.invite_url.replace(/^https?:\/\//, '')

  return (
    <div
      style={{
        position: 'relative',
        width: 390,
        height: 692,
        overflow: 'hidden',
        border: `2px solid ${GOLD}`,
        borderRadius: 16,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Corner accent — top-left red */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 200, height: 200,
        background: 'linear-gradient(135deg, #c0392b 0%, transparent 70%)',
        opacity: 0.8,
        pointerEvents: 'none',
      }} />
      {/* Corner accent — top-right purple */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 160, height: 160,
        background: 'linear-gradient(225deg, #6c3483 0%, transparent 70%)',
        opacity: 0.6,
        pointerEvents: 'none',
      }} />
      {/* Corner accent — bottom-left teal */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 160, height: 160,
        background: 'linear-gradient(45deg, #0e6655 0%, transparent 70%)',
        opacity: 0.7,
        pointerEvents: 'none',
      }} />
      {/* Corner accent — bottom-right blue */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 200, height: 200,
        background: 'linear-gradient(315deg, #1a5276 0%, transparent 70%)',
        opacity: 0.8,
        pointerEvents: 'none',
      }} />

      {/* ── SECTION 1: TOP ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 8, zIndex: 1,
      }}>
        <div style={{ fontSize: 36, marginBottom: 4, lineHeight: 1 }}>🏆</div>
        <div style={{
          fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700,
          color: GOLD, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase',
        }}>
          FIFA WORLD CUP 2026
        </div>
        <div style={{
          fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 22, fontWeight: 900,
          color: '#ffffff', letterSpacing: 3, textAlign: 'center', marginBottom: 2,
          textTransform: 'uppercase',
        }}>
          {data.league_name}
        </div>
        <div style={{
          fontFamily: 'Arial, sans-serif', fontSize: 12, color: GOLD, letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          FIFA LEAGUE
        </div>
        {/* MY PREDICTION pill */}
        <div style={{
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 12,
          padding: '4px 16px',
          marginTop: 8,
          fontFamily: 'Arial, sans-serif',
          fontSize: 9, color: GOLD, letterSpacing: 3, textTransform: 'uppercase',
        }}>
          MY PREDICTION
        </div>
      </div>

      {/* ── SECTION 2: TEAMS & SCORE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 1 }}>
        {/* Separator */}
        <div style={{ width: '80%', height: 1, background: '#222', margin: '12px 0' }} />

        {/* Teams row */}
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', width: '100%',
        }}>
          {/* Team A */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{data.team_a_flag || '🏳️'}</span>
            <span style={{
              fontFamily: 'Arial, sans-serif', fontSize: 13, fontWeight: 900,
              color: '#ffffff', letterSpacing: 2, marginTop: 6,
              textTransform: 'uppercase', textAlign: 'center',
            }}>
              {data.team_a}
            </span>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontSize: 64, fontWeight: 900,
              color: GOLD, lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {scoreA}-{scoreB}
            </div>
            <div style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: 8, color: '#555', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              MY PREDICTION
            </div>
          </div>

          {/* Team B */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{data.team_b_flag || '🏳️'}</span>
            <span style={{
              fontFamily: 'Arial, sans-serif', fontSize: 13, fontWeight: 900,
              color: '#ffffff', letterSpacing: 2, marginTop: 6,
              textTransform: 'uppercase', textAlign: 'center',
            }}>
              {data.team_b}
            </span>
          </div>
        </div>

        {/* Match info bar */}
        <div style={{
          background: '#111', borderRadius: 4, padding: '6px 16px',
          fontFamily: 'Arial, sans-serif',
          fontSize: 9, color: '#555', letterSpacing: 2, textTransform: 'uppercase',
          marginTop: 10,
        }}>
          GROUP STAGE · FIFA WORLD CUP 2026
        </div>
      </div>

      {/* ── SECTION 3: RANK ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '100%' }}>
        {/* Separator */}
        <div style={{ width: '80%', height: 1, background: '#222', marginBottom: 12 }} />

        <div style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 9, color: '#555', letterSpacing: 4, textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          CURRENTLY RANKED
        </div>
        <div style={{
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontSize: 72, fontWeight: 900, color: GOLD, lineHeight: 1,
        }}>
          #{data.user_rank}
        </div>
        <div style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 11, color: '#777', letterSpacing: 2, textTransform: 'uppercase',
        }}>
          OF {data.total_members} MEMBERS
        </div>
        <div style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 10, color: '#555', marginTop: 4,
        }}>
          {data.user_name}
        </div>
      </div>

      {/* ── SECTION 4: BOTTOM ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '100%' }}>
        <div style={{
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontSize: 12, fontWeight: 900, color: '#ffffff', letterSpacing: 1,
          marginBottom: 8, textTransform: 'uppercase', textAlign: 'center',
        }}>
          CAN YOU BEAT MY PREDICTION?
        </div>

        {/* Join link pill */}
        <div style={{
          border: `1px solid ${GOLD}`,
          borderRadius: 20, padding: '8px 20px',
          textAlign: 'center', background: '#0a0a0a', width: '100%', boxSizing: 'border-box',
        }}>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 8, color: GOLD, letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            JOIN THE LEAGUE FREE →
          </div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 10, color: '#ffffff', fontWeight: 700,
          }}>
            {leagueUrl}
          </div>
        </div>

        {/* Flag row */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: 6, marginTop: 10,
          fontSize: 14, alignItems: 'center',
        }}>
          <span>🇧🇷</span><span>🇦🇷</span><span>🏆</span><span>🇫🇷</span><span>🇩🇪</span>
        </div>

        {/* Watermark */}
        <div style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 8, color: '#222', letterSpacing: 3, textTransform: 'uppercase', marginTop: 8,
        }}>
          PITCHLEAGUE.VERCEL.APP
        </div>
      </div>
    </div>
  )
}

export function ShareModal({
  data,
  onClose,
}: {
  data: ShareCardData
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')

  const scoreA = data.predicted_score_a ?? 0
  const scoreB = data.predicted_score_b ?? 0

  async function handleShare() {
    if (!cardRef.current) return
    setStatus('generating')
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const scale = window.devicePixelRatio || 3
      const blob: Blob = await domtoimage.toBlob(cardRef.current, {
        width: 390,
        height: 692,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${390 / scale}px`,
          height: `${692 / scale}px`,
        },
        bgcolor: '#0a0a0a',
      })

      const file = new File([blob], 'my-prediction.png', { type: 'image/png' })
      const shareText = `I predicted ${data.team_a} ${scoreA}-${scoreB} ${data.team_b}! Can you beat me? Join ${data.league_name} → ${data.invite_url}`

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'My FIFA 2026 Prediction',
          text: shareText,
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'my-prediction.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (err) {
      console.error('Share failed', err)
    } finally {
      setStatus('done')
    }
  }

  // Scale card to 85% of screen width
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 390
  const previewScale = Math.min(1, (screenW * 0.85) / 390)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        overflowY: 'auto',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #3a3a3a', background: 'transparent',
          color: '#999', cursor: 'pointer', zIndex: 10,
        }}
      >
        <X size={18} />
      </button>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 20, padding: '56px 24px 40px', width: '100%', maxWidth: 440,
        boxSizing: 'border-box',
      }}>
        <p style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: GOLD, margin: 0,
        }}>
          Your Prediction Card
        </p>

        {/* Scaled card preview */}
        <div style={{
          width: 390 * previewScale,
          height: 692 * previewScale,
          overflow: 'hidden',
          borderRadius: 12,
          flexShrink: 0,
        }}>
          <div style={{
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            width: 390,
            height: 692,
          }}>
            <div ref={cardRef}>
              <PredictionCard data={data} />
            </div>
          </div>
        </div>

        <p style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 10, color: '#555', textAlign: 'center', margin: '-8px 0 0',
        }}>
          Tap SAVE &amp; SHARE — native share sheet opens with image ready
        </p>

        {/* SAVE & SHARE button */}
        <button
          onClick={handleShare}
          disabled={status === 'generating'}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 12, border: 'none',
            background: status === 'generating'
              ? '#555'
              : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            color: '#000', fontWeight: 700,
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 16, letterSpacing: '0.1em',
            textTransform: 'uppercase', cursor: status === 'generating' ? 'not-allowed' : 'pointer',
            opacity: status === 'generating' ? 0.6 : 1,
          }}
        >
          {status === 'generating' ? 'Generating…' : '📤 SAVE & SHARE'}
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none',
            fontFamily: 'Arial, sans-serif',
            fontSize: 12, color: '#555', cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

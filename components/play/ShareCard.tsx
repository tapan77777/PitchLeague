'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ShareCardData } from '@/types'

const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const SANS = "'Arial', 'Helvetica Neue', sans-serif"

function PredictionCard({ data }: { data: ShareCardData }) {
  const scoreA = data.predicted_score_a ?? 0
  const scoreB = data.predicted_score_b ?? 0

  return (
    <div
      style={{
        width: 390,
        height: 692,
        background: '#0a0a0a',
        border: `2px solid ${GOLD}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 24px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── 1. TOP SECTION ── */}
      <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {/* Gold pill badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(201,168,76,0.12)',
          border: `1px solid ${GOLD}55`,
          borderRadius: 999,
          padding: '5px 14px',
        }}>
          <span style={{ fontSize: 11 }}>⚽</span>
          <span style={{
            color: GOLD,
            fontSize: 10,
            letterSpacing: '0.22em',
            fontFamily: SANS,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            FIFA WORLD CUP 2026
          </span>
        </div>

        {/* League name */}
        <div style={{
          color: GOLD,
          fontSize: 28,
          letterSpacing: '0.3em',
          fontFamily: BEBAS,
          fontWeight: 700,
          textTransform: 'uppercase',
          lineHeight: 1,
          textAlign: 'center',
          paddingRight: '0.3em', // compensate letter-spacing on last char
        }}>
          {data.league_name}
        </div>
      </div>

      {/* ── 2. TEAMS SECTION ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        zIndex: 1,
        flex: '0 0 auto',
      }}>
        {/* Team A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 80, lineHeight: 1, display: 'block' }}>{data.team_a_flag || '🏳️'}</span>
          <span style={{
            color: '#f0f0f0',
            fontSize: 18,
            letterSpacing: '0.1em',
            fontFamily: BEBAS,
            fontWeight: 700,
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}>
            {data.team_a}
          </span>
        </div>

        {/* Score + label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 4 }}>
          {/* Score in one row */}
          <div style={{
            color: GOLD,
            fontSize: 72,
            fontFamily: BEBAS,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            {scoreA} — {scoreB}
          </div>
          {/* MY PREDICTION label */}
          <div style={{
            color: '#555',
            fontSize: 10,
            letterSpacing: '0.25em',
            fontFamily: SANS,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            MY PREDICTION
          </div>
        </div>

        {/* Team B */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 80, lineHeight: 1, display: 'block' }}>{data.team_b_flag || '🏳️'}</span>
          <span style={{
            color: '#f0f0f0',
            fontSize: 18,
            letterSpacing: '0.1em',
            fontFamily: BEBAS,
            fontWeight: 700,
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}>
            {data.team_b}
          </span>
        </div>
      </div>

      {/* ── 3. DIVIDER ── */}
      <div style={{
        width: '60%',
        height: 1,
        background: `linear-gradient(to right, transparent, ${GOLD}4d, transparent)`,
        zIndex: 1,
        flexShrink: 0,
      }} />

      {/* ── 4. BOTTOM SECTION ── */}
      <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          color: '#555',
          fontSize: 10,
          letterSpacing: '0.25em',
          fontFamily: SANS,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          CURRENTLY
        </div>
        <div style={{
          color: GOLD_LIGHT,
          fontSize: 32,
          fontFamily: BEBAS,
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}>
          #{data.user_rank} OF {data.total_members} MEMBERS
        </div>
        <div style={{
          color: '#666',
          fontSize: 12,
          fontFamily: SANS,
          letterSpacing: '0.08em',
        }}>
          {data.user_name}
        </div>
      </div>

      {/* ── 5. LINK PILL ── */}
      <div style={{
        zIndex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#1a1a1a',
        border: `1px solid ${GOLD}`,
        borderRadius: 999,
        padding: '7px 16px',
        maxWidth: '100%',
      }}>
        <span style={{ fontSize: 12 }}>🏆</span>
        <span style={{
          color: GOLD,
          fontSize: 11,
          fontFamily: SANS,
          fontWeight: 600,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Join the league → {data.invite_url.replace(/^https?:\/\//, '')}
        </span>
      </div>

      {/* ── 6. WATERMARK ── */}
      <div style={{
        color: '#333',
        fontSize: 9,
        letterSpacing: '0.18em',
        fontFamily: SANS,
        textTransform: 'uppercase',
        zIndex: 1,
      }}>
        PITCHLEAGUE.VERCEL.APP
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
      const blob: Blob = await domtoimage.toBlob(cardRef.current, {
        width: 390,
        height: 692,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      })

      const file = new File([blob], 'my-prediction.png', { type: 'image/png' })
      const shareText = `I predicted ${data.team_a} ${scoreA}-${scoreB} ${data.team_b}! Can you beat my prediction? Join ${data.league_name} → ${data.invite_url}`

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

  const previewScale = Math.min(1, (typeof window !== 'undefined' ? Math.min(window.innerWidth - 48, 360) : 360) / 390)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center gap-5 px-4 pt-14 pb-10 w-full max-w-sm">
        <p
          className="text-[10px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: GOLD }}
        >
          Your Prediction Card
        </p>

        {/* Scaled preview wrapper */}
        <div
          style={{
            width: 390 * previewScale,
            height: 692 * previewScale,
            overflow: 'hidden',
            borderRadius: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              width: 390,
              height: 692,
            }}
          >
            <div ref={cardRef}>
              <PredictionCard data={data} />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 text-center -mt-1">
          Tap SAVE &amp; SHARE — native share sheet opens with image ready
        </p>

        <button
          onClick={handleShare}
          disabled={status === 'generating'}
          className="w-full py-3.5 rounded-xl text-black font-bold tracking-widest transition-all disabled:opacity-50 active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            fontFamily: BEBAS,
            letterSpacing: '0.12em',
            fontSize: '1.1rem',
          }}
        >
          {status === 'generating' ? 'Generating…' : '📤 SAVE & SHARE'}
        </button>

        <button
          onClick={onClose}
          className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

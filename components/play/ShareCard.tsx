'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ShareCardData } from '@/types'

const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"

// The visual card rendered at exactly 390×692 (Instagram story ratio)
function PredictionCard({ data }: { data: ShareCardData }) {
  const scoreA = data.predicted_score_a ?? 0
  const scoreB = data.predicted_score_b ?? 0

  return (
    <div
      style={{
        width: 390,
        height: 692,
        background: '#0a0a0a',
        border: `3px solid ${GOLD}`,
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 28px 24px',
        boxSizing: 'border-box',
        fontFamily: BEBAS,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top: league name */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          color: GOLD,
          fontSize: 22,
          letterSpacing: '0.2em',
          fontFamily: BEBAS,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {data.league_name}
        </div>
        <div style={{
          color: '#666',
          fontSize: 11,
          letterSpacing: '0.18em',
          marginTop: 6,
          fontFamily: "'Arial', sans-serif",
          textTransform: 'uppercase',
        }}>
          FIFA WORLD CUP 2026
        </div>
      </div>

      {/* Teams & flags */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        zIndex: 1,
      }}>
        {/* Team A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 80, lineHeight: 1 }}>{data.team_a_flag || '🏳️'}</span>
          <span style={{
            color: '#f0f0f0',
            fontSize: 18,
            letterSpacing: '0.12em',
            fontFamily: BEBAS,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {data.team_a}
          </span>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, padding: '0 8px' }}>
          <div style={{
            color: GOLD,
            fontSize: 120,
            fontFamily: BEBAS,
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
          }}>
            {scoreA}–{scoreB}
          </div>
        </div>

        {/* Team B */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 80, lineHeight: 1 }}>{data.team_b_flag || '🏳️'}</span>
          <span style={{
            color: '#f0f0f0',
            fontSize: 18,
            letterSpacing: '0.12em',
            fontFamily: BEBAS,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {data.team_b}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '100%',
        height: 1,
        background: `linear-gradient(to right, transparent, ${GOLD}66, transparent)`,
        zIndex: 1,
      }} />

      {/* MY PREDICTION label + rank */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          color: '#555',
          fontSize: 11,
          letterSpacing: '0.25em',
          fontFamily: "'Arial', sans-serif",
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          MY PREDICTION
        </div>
        <div style={{
          color: GOLD_LIGHT,
          fontSize: 28,
          fontFamily: BEBAS,
          letterSpacing: '0.1em',
        }}>
          Currently #{data.user_rank} of {data.total_members}
        </div>
        <div style={{
          color: '#888',
          fontSize: 13,
          fontFamily: "'Arial', sans-serif",
          marginTop: 4,
        }}>
          {data.user_name}
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        color: '#3a3a3a',
        fontSize: 12,
        letterSpacing: '0.15em',
        fontFamily: "'Arial', sans-serif",
        textTransform: 'lowercase',
        zIndex: 1,
      }}>
        pitchleague.vercel.app
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

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'My FIFA 2026 Prediction',
          text: `I predicted ${data.team_a} ${scoreA}-${scoreB} ${data.team_b}! Join my league 👇`,
        })
      } else {
        // Download fallback
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

  // Scale the 390px card to fit within the modal preview area
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

        {/* Card preview — scaled to fit screen, full-res off-screen for capture */}
        <div
          style={{
            width: 390 * previewScale,
            height: 692 * previewScale,
            overflow: 'hidden',
            borderRadius: 16,
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
          Tap SAVE &amp; SHARE to post to Instagram stories
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

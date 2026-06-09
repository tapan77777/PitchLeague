'use client'

import { useRef, useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { X } from 'lucide-react'
import { ShareCardData } from '@/types'

const BEBAS = "'Bebas Neue', sans-serif"
const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'

/* ────────────────────────────────────────────────────────────
   Pure visual card — 390×690px, captured by html2canvas
   ──────────────────────────────────────────────────────────── */
export function ShareCardDisplay({
  data,
  innerRef,
}: {
  data: ShareCardData
  innerRef: React.RefObject<HTMLDivElement>
}) {
  const initials = data.league_name.slice(0, 2).toUpperCase()

  return (
    <div
      ref={innerRef}
      style={{
        width: 390,
        height: 690,
        background: '#0a0a0a',
        border: `2px solid ${GOLD}`,
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Inter, sans-serif',
        color: '#f0f0f0',
        flexShrink: 0,
      }}
    >
      {/* ── Subtle gold glow top ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: `radial-gradient(ellipse at 50% 0%, ${GOLD}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* ── Top bar: league branding ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 24px 0',
      }}>
        {data.league_logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.league_logo}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: data.primary_color + '33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: BEBAS, fontSize: 18, color: GOLD,
          }}>{initials}</div>
        )}
        <span style={{
          fontFamily: BEBAS, fontSize: 18, letterSpacing: '0.08em',
          color: '#d0d0d0', textTransform: 'uppercase',
        }}>{data.league_name}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 16 }}>🏆</span>
        <span style={{
          fontFamily: BEBAS, fontSize: 14, letterSpacing: '0.12em',
          color: GOLD,
        }}>FIFA 2026</span>
      </div>

      {/* ── MY PREDICTION label ── */}
      <div style={{ textAlign: 'center', paddingTop: 28 }}>
        <span style={{
          fontFamily: BEBAS, fontSize: 13, letterSpacing: '0.25em',
          color: GOLD, textTransform: 'uppercase',
        }}>My Prediction</span>
      </div>

      {/* ── Teams + Score ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '20px 24px 0',
        gap: 8,
      }}>
        {/* Team A */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 60, lineHeight: 1 }}>{data.team_a_flag || '🏴'}</span>
          <span style={{
            fontFamily: BEBAS, fontSize: 26, letterSpacing: '0.05em',
            color: '#f0f0f0', lineHeight: 1.1,
            wordBreak: 'break-word', maxWidth: 110,
          }}>{data.team_a}</span>
        </div>

        {/* Score */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: BEBAS, fontSize: 80, lineHeight: 1,
              color: GOLD,
            }}>{data.predicted_score_a ?? 0}</span>
            <span style={{
              fontFamily: BEBAS, fontSize: 48, color: '#444',
              lineHeight: 1, margin: '0 4px',
            }}>—</span>
            <span style={{
              fontFamily: BEBAS, fontSize: 80, lineHeight: 1,
              color: GOLD,
            }}>{data.predicted_score_b ?? 0}</span>
          </div>
          <span style={{
            fontSize: 10, color: '#555', letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>predicted score</span>
        </div>

        {/* Team B */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 8,
        }}>
          <span style={{ fontSize: 60, lineHeight: 1 }}>{data.team_b_flag || '🏴'}</span>
          <span style={{
            fontFamily: BEBAS, fontSize: 26, letterSpacing: '0.05em',
            color: '#f0f0f0', lineHeight: 1.1, textAlign: 'right',
            wordBreak: 'break-word', maxWidth: 110,
          }}>{data.team_b}</span>
        </div>
      </div>

      {/* ── Gold divider ── */}
      <div style={{
        margin: '28px 24px 0',
        height: 1,
        background: `linear-gradient(90deg, transparent, ${GOLD}88, transparent)`,
      }} />

      {/* ── Bottom info ── */}
      <div style={{
        padding: '20px 24px 0',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Match info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: '#161616',
          borderRadius: 10,
          border: '1px solid #222',
        }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 12, color: '#666', letterSpacing: '0.04em' }}>
            {data.invite_url.includes('GROUP') ? '' : ''}{data.team_a} vs {data.team_b}
          </span>
        </div>

        {/* Rank */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: `${GOLD}0d`,
          borderRadius: 10,
          border: `1px solid ${GOLD}33`,
        }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <div>
            <div style={{
              fontFamily: BEBAS, fontSize: 22, letterSpacing: '0.06em',
              color: GOLD, lineHeight: 1,
            }}>Currently #{data.user_rank} of {data.total_members}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{data.league_name}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: BEBAS, fontSize: 14, letterSpacing: '0.08em',
            color: '#444',
          }}>{data.user_name}</div>
        </div>
      </div>

      {/* ── Gold corner accent ── */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `linear-gradient(135deg, transparent 50%, ${GOLD}22 50%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 60, height: 60,
        background: `linear-gradient(315deg, transparent 50%, ${GOLD}22 50%)`,
      }} />

      {/* ── Watermark ── */}
      <div style={{ flex: 1 }} />
      <div style={{
        textAlign: 'center', padding: '0 24px 20px',
        fontFamily: BEBAS, fontSize: 12, letterSpacing: '0.15em',
        color: '#2a2a2a', textTransform: 'uppercase',
      }}>
        pitchleague.vercel.app
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Modal: renders the card, captures it, triggers share/save
   ──────────────────────────────────────────────────────────── */
export function ShareModal({
  data,
  onClose,
}: {
  data: ShareCardData
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [imgUrl, setImgUrl] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (!cardRef.current) return
    setStatus('generating')
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })
      const dataUrl = canvas.toDataURL('image/png')
      setImgUrl(dataUrl)
      setStatus('done')
    } catch (e) {
      console.error('[ShareCard] html2canvas error', e)
      setStatus('idle')
    }
  }, [])

  async function handleShare() {
    if (!imgUrl) return
    const scoreText = `${data.predicted_score_a ?? 0}-${data.predicted_score_b ?? 0}`
    const text = `I predicted ${data.team_a} ${scoreText} ${data.team_b}! Join my FIFA 2026 league 👇`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const blob = await (await fetch(imgUrl)).blob()
        const file = new File([blob], 'my-prediction.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: 'My FIFA 2026 Prediction', text, files: [file] })
          return
        }
        await navigator.share({ title: 'My FIFA 2026 Prediction', text, url: data.invite_url })
        return
      } catch { /* fallthrough to download */ }
    }

    const link = document.createElement('a')
    link.download = 'my-prediction.png'
    link.href = imgUrl
    link.click()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center gap-5 px-4 w-full max-w-[420px]">
        {/* Card preview — scaled to fit mobile screen */}
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center', marginBottom: -108 }}>
          {status === 'done' && imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt="Your prediction card"
              style={{ width: 390, height: 690, borderRadius: 20 }}
            />
          ) : (
            <ShareCardDisplay data={data} innerRef={cardRef} />
          )}
        </div>

        {/* Actions */}
        {status === 'idle' && (
          <button
            onClick={generate}
            className="w-full max-w-[320px] py-3.5 rounded-xl text-black font-bold text-base tracking-widest transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              fontFamily: BEBAS,
              letterSpacing: '0.12em',
              fontSize: '1.1rem',
            }}
          >
            GENERATE CARD
          </button>
        )}

        {status === 'generating' && (
          <div className="flex items-center gap-3 py-3">
            <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Generating card…</span>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
            <button
              onClick={handleShare}
              className="w-full py-3.5 rounded-xl text-black font-bold tracking-widest transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                fontFamily: BEBAS,
                letterSpacing: '0.12em',
                fontSize: '1.1rem',
              }}
            >
              📤 SAVE &amp; SHARE
            </button>
            <button
              onClick={() => { setStatus('idle'); setImgUrl(null) }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Regenerate
            </button>
          </div>
        )}

        <p className="text-[10px] text-zinc-700">Tap outside to close</p>
      </div>
    </div>
  )
}

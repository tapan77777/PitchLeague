'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { ShareCardData } from '@/types'

const GOLD = '#c9a84c'
const GOLD_LIGHT = '#e8c96d'
const BEBAS = "var(--font-bebas, 'Bebas Neue', sans-serif)"

function buildCardUrl(data: ShareCardData): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://pitchleague.vercel.app'
  const p = new URLSearchParams({
    teamA:  data.team_a,
    teamB:  data.team_b,
    scoreA: String(data.predicted_score_a ?? 0),
    scoreB: String(data.predicted_score_b ?? 0),
    league: data.league_name,
    rank:   String(data.user_rank),
    total:  String(data.total_members),
    flagA:  data.team_a_flag || '',
    flagB:  data.team_b_flag || '',
    name:   data.user_name,
  })
  return `${base}/api/share-card?${p.toString()}`
}

export function ShareModal({
  data,
  onClose,
}: {
  data: ShareCardData
  onClose: () => void
}) {
  const cardUrl = useMemo(() => buildCardUrl(data), [data])
  const [imgLoaded, setImgLoaded] = useState(false)
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    setSharing(true)
    const scoreText = `${data.predicted_score_a ?? 0}-${data.predicted_score_b ?? 0}`
    const text = `I predicted ${data.team_a} ${scoreText} ${data.team_b}! Join my FIFA 2026 prediction league 👇`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        // Try to share as file (mobile — saves to camera roll)
        const res = await fetch(cardUrl)
        const blob = await res.blob()
        const file = new File([blob], 'my-prediction.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: 'My FIFA 2026 Prediction', text, files: [file] })
          setSharing(false)
          return
        }
        // Fallback: share URL
        await navigator.share({ title: 'My FIFA 2026 Prediction', text, url: data.invite_url })
        setSharing(false)
        return
      } catch { /* fall through */ }
    }

    // Desktop / no share API: open image in new tab (user saves manually)
    window.open(cardUrl, '_blank')
    setSharing(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.94)' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center gap-5 px-4 pt-16 pb-10 w-full max-w-sm">

        {/* Label */}
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: GOLD }}>
          Your Prediction Card
        </p>

        {/* Card preview — server-rendered PNG */}
        <div
          className="w-full rounded-2xl overflow-hidden border"
          style={{ borderColor: GOLD + '55', aspectRatio: '9/16', position: 'relative' }}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] gap-3">
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-600">Generating card…</span>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt="Your FIFA 2026 prediction card"
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
        </div>

        {/* Mobile hint */}
        <p className="text-[10px] text-zinc-600 text-center -mt-1">
          Long-press the card to save · or tap Share below
        </p>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={sharing || !imgLoaded}
          className="w-full py-3.5 rounded-xl text-black font-bold tracking-widest transition-all disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            fontFamily: BEBAS,
            letterSpacing: '0.12em',
            fontSize: '1.05rem',
          }}
        >
          {sharing ? 'Opening…' : '📤 SHARE PREDICTION'}
        </button>

        {/* Open raw image link */}
        <a
          href={cardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
        >
          Open full-size image ↗
        </a>

        <button onClick={onClose} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}

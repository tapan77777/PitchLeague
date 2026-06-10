'use client'

import { useEffect, useState } from 'react'
import TeamFlag from './TeamFlag'

interface Props {
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  onScoreAChange: (v: number) => void
  onScoreBChange: (v: number) => void
  onConfirm: () => void
  onClose: () => void
  saving: boolean
  isEdit: boolean
}

export default function PredictionSheet({
  teamA, teamB, scoreA, scoreB,
  onScoreAChange, onScoreBChange,
  onConfirm, onClose, saving, isEdit,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide-up after mount
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.75 : 0})`,
          backdropFilter: visible ? 'blur(4px)' : 'none',
        }}
        onClick={close}
      />

      {/* Sheet */}
      <div
        className="relative bg-[#141414] border-t border-[#2a2a2a] rounded-t-3xl px-6 pt-5 pb-10 transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

        {/* Teams */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={teamA} size="lg" />
            <span className="fifa-score text-xl leading-tight text-[#f0f0f0] text-center">{teamA}</span>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0 px-4">
            <span className="text-xs font-semibold text-zinc-600 tracking-widest uppercase">Your pick</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamFlag name={teamB} size="lg" />
            <span className="fifa-score text-xl leading-tight text-[#f0f0f0] text-center">{teamB}</span>
          </div>
        </div>

        {/* Score steppers */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <SheetStepper value={scoreA} onChange={onScoreAChange} disabled={saving} />
          <span className="fifa-score text-3xl text-zinc-600">—</span>
          <SheetStepper value={scoreB} onChange={onScoreBChange} disabled={saving} />
        </div>

        {/* Lock button */}
        <button
          onClick={onConfirm}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-black font-bold tracking-widest text-base disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: '1.15rem',
            letterSpacing: '0.12em',
          }}
        >
          {saving ? 'SAVING…' : isEdit ? 'UPDATE PREDICTION' : 'LOCK IN PREDICTION'}
        </button>

        <button
          onClick={close}
          className="w-full mt-3 py-3 text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function SheetStepper({ value, onChange, disabled }: {
  value: number; onChange: (v: number) => void; disabled: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled}
        className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all active:scale-90 disabled:opacity-30"
        style={{ borderColor: '#c9a84c', color: '#c9a84c' }}
      >
        +
      </button>
      <span className="fifa-score text-5xl leading-none text-[#f0f0f0] w-12 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled}
        className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all active:scale-90 disabled:opacity-30"
        style={{ borderColor: '#c9a84c44', color: '#c9a84c' }}
      >
        −
      </button>
    </div>
  )
}

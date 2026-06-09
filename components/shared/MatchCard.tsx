'use client'

import { useState } from 'react'
import { Match, Prediction } from '@/types'
import { isPredictionOpen, timeUntilKickoff, formatKickoff } from '@/lib/utils'
import { Lock, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface MatchCardProps {
  match: Match
  leagueId: string
  existingPrediction?: Prediction
  onPredict: (matchId: string, scoreA: number, scoreB: number) => Promise<void>
}

export default function MatchCard({
  match,
  leagueId,
  existingPrediction,
  onPredict,
}: MatchCardProps) {
  const [scoreA, setScoreA] = useState<number>(existingPrediction?.predicted_score_a ?? 1)
  const [scoreB, setScoreB] = useState<number>(existingPrediction?.predicted_score_b ?? 0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingPrediction)

  const open = isPredictionOpen(match.kickoff_time)
  const hasResult = match.status === 'finished'

  async function handleSubmit() {
    if (!open || submitted) return
    setLoading(true)
    try {
      await onPredict(match.id, scoreA, scoreB)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">

      {/* Stage + Time */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="uppercase tracking-widest font-semibold">
          {match.group_name ? `Group ${match.group_name}` : match.stage}
        </span>
        {open ? (
          <span className="flex items-center gap-1 text-amber-400">
            <Clock size={11} />
            Closes in {timeUntilKickoff(match.kickoff_time)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-600">
            <Lock size={11} />
            {hasResult ? 'Finished' : 'Locked'}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3">

        {/* Team A */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{match.team_a_flag || '🏴'}</span>
          <span className="text-sm font-semibold text-white text-center leading-tight">
            {match.team_a}
          </span>
          {hasResult && (
            <span className="text-2xl font-black text-white">{match.score_a}</span>
          )}
        </div>

        {/* Score input / VS */}
        <div className="flex flex-col items-center gap-1">
          {open && !submitted ? (
            <div className="flex items-center gap-2">
              <ScoreInput value={scoreA} onChange={setScoreA} />
              <span className="text-zinc-600 font-bold text-sm">—</span>
              <ScoreInput value={scoreB} onChange={setScoreB} />
            </div>
          ) : submitted && !hasResult ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[var(--league-primary,#16a34a)]">
                {existingPrediction?.predicted_score_a ?? scoreA}
              </span>
              <span className="text-zinc-600">—</span>
              <span className="text-xl font-black text-[var(--league-primary,#16a34a)]">
                {existingPrediction?.predicted_score_b ?? scoreB}
              </span>
            </div>
          ) : (
            <span className="text-zinc-600 font-bold text-sm">VS</span>
          )}
          <span className="text-[10px] text-zinc-600">{match.city}</span>
        </div>

        {/* Team B */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{match.team_b_flag || '🏴'}</span>
          <span className="text-sm font-semibold text-white text-center leading-tight">
            {match.team_b}
          </span>
          {hasResult && (
            <span className="text-2xl font-black text-white">{match.score_b}</span>
          )}
        </div>
      </div>

      {/* Points earned (after result) */}
      {hasResult && existingPrediction && (
        <PredictionResult prediction={existingPrediction} />
      )}

      {/* Submit button */}
      {open && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold
            bg-[var(--league-primary,#16a34a)] text-white
            active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Lock In Prediction'}
        </button>
      )}

      {/* Locked confirmation */}
      {submitted && !hasResult && (
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <CheckCircle2 size={13} className="text-[var(--league-primary,#16a34a)]" />
          Prediction locked — {formatKickoff(match.kickoff_time)}
        </div>
      )}
    </div>
  )
}

// Small score stepper input
function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => onChange(Math.min(value + 1, 20))}
        className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-bold
          active:bg-zinc-700 transition-colors flex items-center justify-center"
      >
        +
      </button>
      <span className="text-xl font-black text-white w-6 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.max(value - 1, 0))}
        className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-bold
          active:bg-zinc-700 transition-colors flex items-center justify-center"
      >
        −
      </button>
    </div>
  )
}

// Result display after match finished
function PredictionResult({ prediction }: { prediction: Prediction }) {
  const pts = prediction.points_earned
  const correct = prediction.is_correct_winner || prediction.is_exact_score

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm
      ${correct ? 'bg-green-950 border border-green-900' : 'bg-red-950 border border-red-900'}`}
    >
      <div className="flex items-center gap-2">
        {correct
          ? <CheckCircle2 size={15} className="text-green-400" />
          : <XCircle size={15} className="text-red-400" />
        }
        <span className={correct ? 'text-green-300' : 'text-red-300'}>
          {prediction.is_exact_score
            ? 'Exact score!'
            : prediction.is_correct_winner
            ? 'Correct winner'
            : 'Wrong prediction'}
        </span>
      </div>
      <span className={`font-black text-base ${correct ? 'text-green-400' : 'text-zinc-600'}`}>
        {pts > 0 ? `+${pts}` : '0'} pts
      </span>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

const GOLD = '#c9a84c'
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const SANS = "'Arial', 'Helvetica Neue', sans-serif"

export interface QuizQuestion {
  id: string
  question_number: number
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  category?: string
}

interface RevealData {
  is_correct: boolean
  correct_option: string
  explanation: string | null
  points_earned: number
  selected: string
}

interface Props {
  session: { id: string; session_type: string }
  questions: QuizQuestion[]
  memberId: string
  leagueId: string
  onComplete: (score: number, total: number, points: number) => void
  onClose: () => void
}

const OPTIONS = ['a', 'b', 'c', 'd'] as const
const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' }

function getOptionText(q: QuizQuestion, opt: string) {
  if (opt === 'a') return q.option_a
  if (opt === 'b') return q.option_b
  if (opt === 'c') return q.option_c
  return q.option_d
}

export default function QuizModal({ session, questions, memberId, leagueId, onComplete, onClose }: Props) {
  const [phase, setPhase] = useState<'ready' | 'question' | 'reveal' | 'results'>('ready')
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [answered, setAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<RevealData | null>(null)
  const [allAnswers, setAllAnswers] = useState<RevealData[]>([])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const currentQ = questions[currentQIdx]

  // Timer — counts down when in question phase
  useEffect(() => {
    if (answered || phase !== 'question') return
    if (timeLeft === 0) {
      handleSubmit('timeout')
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, answered, phase])

  // Auto-advance after reveal
  useEffect(() => {
    if (phase !== 'reveal') return
    const t = setTimeout(() => {
      if (currentQIdx < questions.length - 1) {
        setCurrentQIdx(i => i + 1)
        setTimeLeft(15)
        setAnswered(false)
        setSelectedOption(null)
        setRevealed(null)
        submittingRef.current = false
        setPhase('question')
      } else {
        setPhase('results')
      }
    }, 2200)
    return () => clearTimeout(t)
  }, [phase, currentQIdx, questions.length])

  // Call onComplete when results phase begins
  useEffect(() => {
    if (phase !== 'results') return
    const score = allAnswers.filter(a => a.is_correct).length
    const pts = allAnswers.reduce((s, a) => s + a.points_earned, 0)
    onComplete(score, questions.length, pts)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function handleSubmit(option: string) {
    if (submittingRef.current) return
    submittingRef.current = true
    setAnswered(true)
    setSelectedOption(option === 'timeout' ? null : option)
    setSubmitting(true)

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQ.id,
          session_id: session.id,
          member_id: memberId,
          league_id: leagueId,
          selected_option: option,
          time_taken_ms: (15 - timeLeft) * 1000,
        }),
      })
      const data = await res.json()
      const revealData: RevealData = {
        is_correct: data.is_correct ?? false,
        correct_option: data.correct_option,
        explanation: data.explanation ?? null,
        points_earned: data.points_earned ?? 0,
        selected: option,
      }
      setRevealed(revealData)
      setAllAnswers(prev => [...prev, revealData])
      setPhase('reveal')
    } catch {
      // On error, treat as wrong
      setRevealed({ is_correct: false, correct_option: '?', explanation: null, points_earned: 0, selected: option })
      setPhase('reveal')
    } finally {
      setSubmitting(false)
    }
  }

  const timerColor = timeLeft > 7 ? GOLD : timeLeft > 3 ? '#f59e0b' : '#e74c3c'

  // ── READY SCREEN ──
  if (phase === 'ready') {
    return (
      <div style={overlay}>
        <div style={sheet}>
          <button onClick={onClose} style={closeBtn}>✕</button>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>⚡</div>
            <div style={{ fontFamily: BEBAS, fontSize: 40, color: GOLD, letterSpacing: '0.1em', marginBottom: 4 }}>
              DAILY QUIZ
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
              {questions.length} Questions · 15 seconds each<br />
              <span style={{ color: GOLD }}>+0.5 pts</span> for each correct answer
            </div>
            <button
              onClick={() => setPhase('question')}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${GOLD} 0%, #e8c96d 100%)`,
                color: '#000', fontFamily: BEBAS, fontSize: 22,
                letterSpacing: '0.1em', cursor: 'pointer',
              }}
            >
              START QUIZ →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULTS SCREEN ──
  if (phase === 'results') {
    const score = allAnswers.filter(a => a.is_correct).length
    const pts = allAnswers.reduce((s, a) => s + a.points_earned, 0)
    const label = score === questions.length ? 'Perfect! 🔥' : score > 0 ? 'Good job!' : 'Nice try!'

    return (
      <div style={overlay}>
        <div style={sheet}>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontFamily: BEBAS, fontSize: 36, color: GOLD, letterSpacing: '0.1em', marginBottom: 4 }}>
              QUIZ COMPLETE!
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: '#888', marginBottom: 28 }}>{label}</div>

            {/* Score */}
            <div style={{
              background: '#111', border: `1px solid ${GOLD}33`, borderRadius: 16,
              padding: '24px 32px', marginBottom: 20,
            }}>
              <div style={{ fontFamily: BEBAS, fontSize: 72, color: GOLD, lineHeight: 1 }}>
                {score} / {questions.length}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
                Correct Answers
              </div>
              {pts > 0 && (
                <div style={{ fontFamily: BEBAS, fontSize: 28, color: '#2dc653', marginTop: 12, letterSpacing: '0.08em' }}>
                  +{pts} PTS EARNED
                </div>
              )}
              {pts === 0 && (
                <div style={{ fontFamily: SANS, fontSize: 13, color: '#555', marginTop: 12 }}>0 pts earned</div>
              )}
            </div>

            {/* Per-question recap */}
            {allAnswers.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#0d0d0d', borderRadius: 10, padding: '10px 14px',
                marginBottom: 8, border: `1px solid ${a.is_correct ? '#2dc65322' : '#e74c3c22'}`,
              }}>
                <span style={{ fontSize: 16 }}>{a.is_correct ? '✅' : '❌'}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: '#aaa', flex: 1, textAlign: 'left' }}>
                  Q{i + 1}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 11, color: a.is_correct ? '#2dc653' : '#e74c3c' }}>
                  {a.is_correct ? `+${a.points_earned} pts` : '0 pts'}
                </span>
              </div>
            ))}

            <button
              onClick={onClose}
              style={{
                width: '100%', marginTop: 16, padding: '14px 0', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${GOLD} 0%, #e8c96d 100%)`,
                color: '#000', fontFamily: BEBAS, fontSize: 20,
                letterSpacing: '0.1em', cursor: 'pointer',
              }}
            >
              BACK TO PREDICTIONS →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUESTION / REVEAL SCREEN ──
  return (
    <div style={overlay}>
      <div style={{ ...sheet, padding: '28px 20px' }}>
        {/* Q number */}
        <div style={{
          fontFamily: SANS, fontSize: 10, color: '#555',
          letterSpacing: '0.2em', textAlign: 'center', marginBottom: 16,
        }}>
          Q{currentQIdx + 1} OF {questions.length}
        </div>

        {/* Timer bar */}
        <div style={{ width: '100%', height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / 15) * 100}%`,
            background: timerColor,
            borderRadius: 2,
            transition: 'width 0.9s linear, background 0.3s',
          }} />
        </div>

        {/* Timer number */}
        <div style={{
          fontFamily: BEBAS, fontSize: 28, color: timerColor,
          textAlign: 'center', marginBottom: 20, letterSpacing: '0.05em',
          transition: 'color 0.3s',
        }}>
          {timeLeft}s
        </div>

        {/* Question text */}
        <div style={{
          fontFamily: SANS, fontSize: 18, fontWeight: 700,
          color: '#fff', textAlign: 'center', lineHeight: 1.4,
          marginBottom: 28, minHeight: 54,
        }}>
          {currentQ.question}
        </div>

        {/* Options 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {OPTIONS.map(opt => {
            const isSelected = selectedOption === opt
            const isCorrect = revealed?.correct_option === opt
            const isWrong = phase === 'reveal' && isSelected && !revealed?.is_correct

            let bg = '#161616'
            let border = '#333'
            let textColor = '#ccc'

            if (phase === 'reveal') {
              if (isCorrect) { bg = '#1a3a1a'; border = '#2dc653'; textColor = '#2dc653' }
              else if (isWrong) { bg = '#3a1a1a'; border = '#e74c3c'; textColor = '#e74c3c' }
            } else if (isSelected) {
              bg = `${GOLD}22`; border = GOLD; textColor = GOLD
            }

            return (
              <button
                key={opt}
                disabled={answered || submitting}
                onClick={() => handleSubmit(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: 12, padding: '14px 12px',
                  cursor: answered ? 'default' : 'pointer',
                  textAlign: 'left', minHeight: 52,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: phase === 'reveal' && isCorrect ? '#2dc653' : phase === 'reveal' && isWrong ? '#e74c3c' : GOLD,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: BEBAS, fontSize: 14, color: '#000',
                }}>
                  {OPTION_LABELS[opt]}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: textColor, lineHeight: 1.3, flex: 1 }}>
                  {getOptionText(currentQ, opt)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Explanation after reveal */}
        {phase === 'reveal' && revealed?.explanation && (
          <div style={{
            background: '#111', border: '1px solid #222', borderRadius: 10,
            padding: '10px 14px', marginTop: 4,
          }}>
            <span style={{ fontFamily: SANS, fontSize: 11, color: '#888', lineHeight: 1.5 }}>
              💡 {revealed.explanation}
            </span>
          </div>
        )}

        {/* Points flash */}
        {phase === 'reveal' && revealed?.is_correct && (
          <div style={{
            textAlign: 'center', marginTop: 12,
            fontFamily: BEBAS, fontSize: 24, color: '#2dc653', letterSpacing: '0.1em',
          }}>
            ✓ Correct! +{revealed.points_earned} pts
          </div>
        )}
        {phase === 'reveal' && !revealed?.is_correct && (
          <div style={{ textAlign: 'center', marginTop: 12, fontFamily: SANS, fontSize: 13, color: '#e74c3c' }}>
            ✗ {selectedOption === null ? 'Time\'s up!' : 'Wrong answer'}
          </div>
        )}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.95)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px 16px',
}

const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 440,
  background: '#0d0d0d',
  borderRadius: 20,
  border: `2px solid ${GOLD}55`,
  padding: '36px 24px 32px',
  position: 'relative',
  boxSizing: 'border-box',
}

const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 14,
  width: 30, height: 30, borderRadius: '50%',
  border: '1px solid #333', background: 'transparent',
  color: '#666', cursor: 'pointer', fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

'use client'

import { useEffect, useState } from 'react'
import QuizModal, { QuizQuestion } from './QuizModal'

const GOLD = '#c9a84c'
const SANS = "'Arial', 'Helvetica Neue', sans-serif"
const BEBAS = "'Bebas Neue', 'Impact', sans-serif"
const LS_KEY = 'pitchleague_quiz_completed'

interface QuizSession {
  id: string
  session_type: string
  session_date: string
  status: string
  questions: QuizQuestion[]
}

interface CompletedEntry {
  score: number
  total: number
  points: number
}

function getCloseHour(sessionType: string): number {
  return sessionType === 'morning' ? 14 : 23
}

function getCountdown(sessionType: string): string {
  const now = new Date()
  const close = new Date()
  close.setHours(getCloseHour(sessionType), 0, 0, 0)
  const diff = close.getTime() - now.getTime()
  if (diff <= 0) return 'Closed'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `Closes in ${h}h ${m}m`
  return `Closes in ${m}m`
}

function getCompleted(sessionId: string): CompletedEntry | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const map: Record<string, CompletedEntry> = JSON.parse(raw)
    return map[sessionId] ?? null
  } catch { return null }
}

function saveCompleted(sessionId: string, entry: CompletedEntry) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const map: Record<string, CompletedEntry> = raw ? JSON.parse(raw) : {}
    map[sessionId] = entry
    localStorage.setItem(LS_KEY, JSON.stringify(map))
  } catch { /* ignore */ }
}

export default function QuizCard({ memberId, leagueId }: { memberId: string; leagueId: string }) {
  const [session, setSession] = useState<QuizSession | null>(null)
  const [completed, setCompleted] = useState<CompletedEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/quiz/active')
      .then(r => r.json())
      .then(({ session }) => {
        console.log('Quiz data on home page:', { session })
        setSession(session ?? null)
        if (session) {
          const done = getCompleted(session.id)
          setCompleted(done)
          setCountdown(getCountdown(session.session_type))
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Countdown tick
  useEffect(() => {
    if (!session) return
    const t = setInterval(() => setCountdown(getCountdown(session.session_type)), 30000)
    return () => clearInterval(t)
  }, [session])

  if (!loaded || !session || !session.questions?.length) return null

  function handleComplete(score: number, total: number, points: number) {
    const entry = { score, total, points }
    saveCompleted(session!.id, entry)
    setCompleted(entry)
    setModalOpen(false)
  }

  const typeLabel = session.session_type.toUpperCase()
  const qCount = session.questions.length

  return (
    <>
      {modalOpen && (
        <QuizModal
          session={session}
          questions={session.questions}
          memberId={memberId}
          leagueId={leagueId}
          onComplete={handleComplete}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{
        background: '#111',
        borderTop: `3px solid ${GOLD}`,
        borderRadius: '0 0 16px 16px',
        border: `1px solid #1e1e1e`,
        borderTopColor: GOLD,
        borderTopWidth: 3,
        padding: '16px 18px',
        marginBottom: 4,
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontFamily: BEBAS, fontSize: 20, color: GOLD, letterSpacing: '0.1em' }}>
              DAILY QUIZ
            </span>
            <span style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
              color: '#000', background: GOLD, borderRadius: 4, padding: '2px 6px',
            }}>
              {typeLabel}
            </span>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 10, color: '#555' }}>{countdown}</span>
        </div>

        {/* Sub-info */}
        <div style={{ fontFamily: SANS, fontSize: 11, color: '#555', marginBottom: 12 }}>
          {qCount} questions · +0.5 pts each
        </div>

        {/* State: completed or CTA */}
        {completed ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#0d0d0d', borderRadius: 10, padding: '12px 14px',
            border: '1px solid #1e1e1e',
          }}>
            <div>
              <div style={{ fontFamily: BEBAS, fontSize: 22, color: GOLD, letterSpacing: '0.08em', lineHeight: 1 }}>
                {completed.score} / {completed.total}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: '#555', marginTop: 2 }}>correct answers</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {completed.points > 0 ? (
                <div style={{ fontFamily: BEBAS, fontSize: 20, color: '#2dc653', letterSpacing: '0.08em' }}>
                  +{completed.points} PTS ✅
                </div>
              ) : (
                <div style={{ fontFamily: SANS, fontSize: 12, color: '#555' }}>0 pts earned</div>
              )}
              <div style={{ fontFamily: SANS, fontSize: 10, color: '#333', marginTop: 2 }}>Completed today</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${GOLD} 0%, #e8c96d 100%)`,
              color: '#000', fontFamily: BEBAS, fontSize: 18, letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            TAP TO PLAY →
          </button>
        )}
      </div>
    </>
  )
}

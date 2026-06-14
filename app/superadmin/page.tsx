'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { League, Match } from '@/types'
import { formatKickoff } from '@/lib/utils'
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react'

const SA_KEY = 'pitchleague_superadmin'
const SA_PASS = 'pitchleague2026'
const GOLD = '#c9a84c'

/* ─── helpers ─── */
function getDateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const match = new Date(d); match.setHours(0, 0, 0, 0)
  const diff = Math.round((match.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function needsResult(match: Match): boolean {
  return match.status !== 'finished' && new Date(match.kickoff_time) < new Date()
}

/* ─── types ─── */
interface Stats { leagues: number; members: number; predictions: number; finished: number; total: number }
interface LeagueRow extends League { memberCount: number; featured_rank?: number | null }

const FEAT_COLORS: Record<number, string> = { 1: '#c9a84c', 2: '#aaaaaa', 3: '#cd7f32' }
interface ExpandedLeague {
  top3: { display_name: string; total_points: number }[]
  totalPreds: number
  coverage: number
}

/* ══════════════════════════════════════════════ */
export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [checkDone, setCheckDone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(SA_KEY) === 'yes') {
      setAuthed(true)
    }
    setCheckDone(true)
  }, [])

  function handleLogin() {
    if (password === SA_PASS) {
      localStorage.setItem(SA_KEY, 'yes')
      setAuthed(true)
    } else {
      setPwError(true)
      setTimeout(() => setPwError(false), 2500)
    }
  }

  function handleLogout() {
    localStorage.removeItem(SA_KEY)
    setAuthed(false)
  }

  if (!checkDone) return null

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>
              PitchLeague
            </p>
            <h1 className="text-2xl font-black text-white">Super Admin</h1>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#c9a84c] rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-zinc-700"
            />
            {pwError && <p className="text-red-400 text-xs text-center">Incorrect password</p>}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl text-black font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c96d)` }}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard onLogout={handleLogout} />
}

/* ══════════════════════════════════════════════ */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [leagues, setLeagues] = useState<LeagueRow[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null)
  const [leagueDetails, setLeagueDetails] = useState<Record<string, ExpandedLeague>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [leaguesRes, membersRes, predsRes, matchesRes] = await Promise.all([
      supabase.from('leagues').select('*').order('created_at', { ascending: false }),
      supabase.from('league_members').select('id, league_id'),
      supabase.from('predictions').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
    ])

    const allLeagues: League[] = leaguesRes.data ?? []
    const memberRows = membersRes.data ?? []
    const allMatches: Match[] = matchesRes.data ?? []

    const countMap: Record<string, number> = {}
    for (const m of memberRows) countMap[m.league_id] = (countMap[m.league_id] ?? 0) + 1

    const leagueRows: LeagueRow[] = allLeagues.map(l => ({ ...l, memberCount: countMap[l.id] ?? 0 }))

    const finished = allMatches.filter(m => m.status === 'finished').length
    setStats({
      leagues: allLeagues.length,
      members: memberRows.length,
      predictions: predsRes.count ?? 0,
      finished,
      total: allMatches.length,
    })
    setLeagues(leagueRows)
    setMatches(allMatches)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleLeague(id: string) {
    if (expandedLeague === id) { setExpandedLeague(null); return }
    setExpandedLeague(id)
    if (leagueDetails[id]) return
    const [topRes, predsRes] = await Promise.all([
      supabase.from('league_members').select('display_name, total_points').eq('league_id', id).order('total_points', { ascending: false }).limit(3),
      supabase.from('predictions').select('id', { count: 'exact', head: true }).eq('league_id', id),
    ])
    const memberCount = leagues.find(l => l.id === id)?.memberCount ?? 0
    const matchCount = matches.length
    const totalPossible = memberCount * matchCount
    const coverage = totalPossible > 0 ? Math.round(((predsRes.count ?? 0) / totalPossible) * 100) : 0
    setLeagueDetails(prev => ({
      ...prev,
      [id]: { top3: topRes.data ?? [], totalPreds: predsRes.count ?? 0, coverage },
    }))
  }

  function onMatchSaved(matchId: string, scoreA: number, scoreB: number) {
    setMatches(prev => prev.map(m => m.id === matchId
      ? { ...m, status: 'finished' as const, score_a: scoreA, score_b: scoreB }
      : m))
  }

  /* ── Group matches by date ── */
  const grouped: Record<string, Match[]> = {}
  for (const m of matches) {
    const label = getDateLabel(m.kickoff_time)
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(m)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.3em] uppercase" style={{ color: GOLD }}>PitchLeague</p>
            <p className="font-black text-sm text-white">⚡ Super Admin</p>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors border border-[#222] px-3 py-1.5 rounded-full">
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <section>
              <SASection title="OVERVIEW" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SAStatCard label="Leagues" value={stats?.leagues ?? 0} />
                <SAStatCard label="Members" value={stats?.members ?? 0} />
                <SAStatCard label="Predictions" value={stats?.predictions ?? 0} />
                <SAStatCard label="Results In" value={`${stats?.finished ?? 0}/${stats?.total ?? 0}`} />
              </div>
            </section>

            {/* All Leagues */}
            <section>
              <SASection title={`ALL LEAGUES (${leagues.length})`} />
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                {leagues.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-10">No leagues yet.</p>
                ) : (
                  <div className="divide-y divide-[#1e1e1e]">
                    {leagues.map(league => (
                      <div key={league.id}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#161616] transition-colors cursor-pointer"
                          onClick={() => toggleLeague(league.id)}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                            style={{ backgroundColor: (league.primary_color || GOLD) + '22', color: league.primary_color || GOLD }}>
                            {league.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold truncate text-white">{league.name}</p>
                              {league.featured_rank && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ color: FEAT_COLORS[league.featured_rank] ?? GOLD, background: (FEAT_COLORS[league.featured_rank] ?? GOLD) + '18', border: `1px solid ${(FEAT_COLORS[league.featured_rank] ?? GOLD)}44` }}>
                                  ★ #{league.featured_rank}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-600">/{league.slug}</p>
                          </div>
                          <div className="text-right shrink-0 mr-2">
                            <p className="text-sm font-bold" style={{ color: GOLD }}>{league.memberCount}</p>
                            <p className="text-[9px] text-zinc-700 uppercase tracking-wider">members</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <FeaturedRankSelect
                              leagueId={league.id}
                              currentRank={league.featured_rank ?? null}
                              onSaved={(rank) => setLeagues(prev => prev.map(l => l.id === league.id ? { ...l, featured_rank: rank } : l))}
                            />
                            <a href={`/admin/dashboard?league=${league.slug}&superadmin=true`}
                              className="text-[10px] font-semibold text-[#c9a84c] border border-[#c9a84c44] bg-[#c9a84c11] px-2 py-0.5 rounded-full transition-colors hover:bg-[#c9a84c22] whitespace-nowrap"
                              onClick={e => e.stopPropagation()}>
                              Manage →
                            </a>
                            <DeleteLeagueButton
                              league={league}
                              onDeleted={(id) => setLeagues(prev => prev.filter(l => l.id !== id))}
                            />
                            {expandedLeague === league.id ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
                          </div>
                        </div>

                        {/* Expanded quick stats */}
                        {expandedLeague === league.id && (
                          <div className="px-4 pb-4 pt-2 bg-[#0d0d0d] border-t border-[#1a1a1a]">
                            {!leagueDetails[league.id] ? (
                              <div className="flex justify-center py-4">
                                <div className="w-4 h-4 border border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-2">Top 3</p>
                                  {leagueDetails[league.id].top3.length === 0
                                    ? <p className="text-xs text-zinc-700">No members yet</p>
                                    : leagueDetails[league.id].top3.map((m, i) => (
                                      <div key={i} className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-bold" style={{ color: i === 0 ? '#c9a84c' : i === 1 ? '#aaa' : '#7a4f1e' }}>#{i + 1}</span>
                                        <span className="text-[11px] truncate text-zinc-300">{m.display_name}</span>
                                        <span className="text-[11px] font-bold ml-auto" style={{ color: GOLD }}>{m.total_points}</span>
                                      </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-1">Predictions</p>
                                  <p className="text-2xl font-black" style={{ color: GOLD }}>{leagueDetails[league.id].totalPreds}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-1">Coverage</p>
                                  <p className="text-2xl font-black text-white">{leagueDetails[league.id].coverage}%</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Daily Quiz */}
            <DailyQuizSection />

            {/* Match Results Entry */}
            <section>
              <SASection title="MATCH RESULTS" />
              <p className="text-[11px] text-zinc-600 -mt-1 mb-4">
                Saving a result scores all leagues simultaneously.
              </p>
              <div className="space-y-6">
                {Object.entries(grouped).map(([label, dayMatches]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-2 px-1">{label}</p>
                    <div className="space-y-2">
                      {dayMatches.map(match => (
                        <SAMatchRow key={match.id} match={match} onSaved={onMatchSaved} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Delete League Button ─── */
function DeleteLeagueButton({ league, onDeleted }: { league: LeagueRow; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    const input = prompt(`Type DELETE to confirm removing "${league.name}" and ALL its data:`)
    if (input !== 'DELETE') {
      if (input !== null) alert('Cancelled — you must type DELETE exactly')
      return
    }
    setDeleting(true)
    const res = await fetch(`/api/admin/leagues/${league.id}`, {
      method: 'DELETE',
      headers: { 'x-superadmin-key': 'pitchleague_super_2026' },
    })
    setDeleting(false)
    if (res.ok) {
      setToast('Deleted ✓')
      setTimeout(() => onDeleted(league.id), 800)
    } else {
      setToast('Failed'); setTimeout(() => setToast(''), 2500)
    }
  }

  if (toast) {
    return <span className="text-[10px] font-semibold text-red-400 shrink-0">{toast}</span>
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-[10px] font-semibold text-red-700 hover:text-red-400 border border-red-900/40 hover:border-red-500/40 px-2 py-0.5 rounded-full transition-colors shrink-0 disabled:opacity-50">
      {deleting ? '…' : 'Delete'}
    </button>
  )
}

/* ─── Featured Rank Select ─── */
function FeaturedRankSelect({ leagueId, currentRank, onSaved }: {
  leagueId: string
  currentRank: number | null
  onSaved: (rank: number | null) => void
}) {
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const newRank = val === '' ? null : Number(val)
    setSaving(true)
    await fetch(`/api/leagues/${leagueId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_rank: newRank }),
    })
    onSaved(newRank)
    setSaving(false)
  }

  return (
    <select
      value={currentRank ?? ''}
      onChange={handleChange}
      disabled={saving}
      className="text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-2 py-0.5 text-zinc-500 outline-none cursor-pointer disabled:opacity-50"
      style={{ minWidth: 90 }}
    >
      <option value="">Not Featured</option>
      <option value="1">★ #1 Gold</option>
      <option value="2">★ #2 Silver</option>
      <option value="3">★ #3 Bronze</option>
    </select>
  )
}

/* ─── Daily Quiz Section ─── */
interface QuizSessionRow {
  id: string
  session_date: string
  session_type: string
  status: string
  answerCount: number
  quiz_questions: { id: string; question_number: number; question: string }[]
}

const SA_QUIZ_KEY = 'pitchleague_super_2026'

function DailyQuizSection() {
  const [sessions, setSessions] = useState<QuizSessionRow[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [type, setType] = useState('morning')
  const [questions, setQuestions] = useState(
    Array.from({ length: 2 }, () => ({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', category: 'general' }))
  )

  useEffect(() => {
    setLoadingQ(true)
    fetch('/api/admin/quiz', { headers: { 'x-superadmin-key': SA_QUIZ_KEY } })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions ?? []); setLoadingQ(false) })
      .catch(() => setLoadingQ(false))
  }, [])

  function updateQ(i: number, field: string, value: string) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  async function handleCreate() {
    for (const q of questions) {
      if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        setMsg('Fill all question fields.'); return
      }
    }
    setSubmitting(true); setMsg('')
    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-superadmin-key': SA_QUIZ_KEY },
      body: JSON.stringify({ session_date: date, session_type: type, questions }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setMsg(data.error || 'Failed'); return }
    setMsg(`✅ Created! League count: ${data.leagueCount}`)
    setSessions(prev => [{ ...data.session, answerCount: 0, quiz_questions: [] }, ...prev])
    setShowForm(false)
  }

  async function closeSession(id: string) {
    await fetch('/api/admin/quiz', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-superadmin-key': SA_QUIZ_KEY },
      body: JSON.stringify({ session_id: id, status: 'closed' }),
    })
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'closed' } : s))
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SASection title="DAILY QUIZ" />
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-[10px] font-semibold px-3 py-1 rounded-full border transition-colors"
          style={{ color: GOLD, borderColor: GOLD + '44', background: GOLD + '11' }}
        >
          {showForm ? 'Cancel' : '+ New Quiz'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Date</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#c9a84c] rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Session</p>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#c9a84c] rounded-xl px-3 py-2 text-sm text-white outline-none">
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 space-y-2">
              <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: GOLD }}>Q{i + 1}</p>
              <input value={q.question} onChange={e => updateQ(i, 'question', e.target.value)}
                placeholder="Question"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-zinc-700" />
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map(opt => (
                  <input key={opt} value={(q as Record<string, string>)[`option_${opt}`]}
                    onChange={e => updateQ(i, `option_${opt}`, e.target.value)}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder-zinc-700" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-zinc-600 mb-1">Correct</p>
                  <select value={q.correct_option} onChange={e => updateQ(i, 'correct_option', e.target.value)}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none">
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 mb-1">Category</p>
                  <input value={q.category} onChange={e => updateQ(i, 'category', e.target.value)}
                    placeholder="general"
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder-zinc-700" />
                </div>
              </div>
              <input value={q.explanation} onChange={e => updateQ(i, 'explanation', e.target.value)}
                placeholder="Explanation (optional)"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder-zinc-700" />
            </div>
          ))}

          {msg && <p className={`text-xs ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

          <button onClick={handleCreate} disabled={submitting}
            className="w-full py-3 rounded-xl text-black font-bold text-sm disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c96d)` }}>
            {submitting ? 'Creating…' : 'Create Quiz Session'}
          </button>
        </div>
      )}

      {loadingQ ? (
        <div className="flex justify-center py-6">
          <div className="w-4 h-4 border border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-zinc-700 text-sm text-center py-6">No quiz sessions yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{s.session_date}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ color: GOLD, background: GOLD + '18', border: `1px solid ${GOLD}44` }}>
                    {s.session_type}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${s.status === 'active' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-zinc-600 border-zinc-700 bg-zinc-800/30'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-700 mt-0.5">{s.quiz_questions?.length ?? 0} questions · {s.answerCount} answers</p>
              </div>
              {s.status === 'active' && (
                <button onClick={() => closeSession(s.id)}
                  className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-0.5 rounded-full transition-colors shrink-0">
                  Close
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── Super Admin Match Row ─── */
function SAMatchRow({ match, onSaved }: { match: Match; onSaved: (id: string, a: number, b: number) => void }) {
  const [open, setOpen] = useState(false)
  const [scoreA, setScoreA] = useState(match.score_a ?? 0)
  const [scoreB, setScoreB] = useState(match.score_b ?? 0)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const finished = match.status === 'finished'
  const needs = needsResult(match)

  async function handleSave() {
    setSaving(true); setErr('')
    const res = await fetch('/api/admin/results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, score_a: scoreA, score_b: scoreB }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error || 'Failed'); return }
    setResult(`✅ Updated ${data.leagues} leagues · ${data.updated} predictions scored`)
    setOpen(false)
    onSaved(match.id, scoreA, scoreB)
  }

  return (
    <div className="bg-[#111] border rounded-xl overflow-hidden"
      style={{ borderColor: finished ? '#1e3a1e' : needs ? '#3a2e00' : '#1e1e1e' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold flex-wrap">
            <span className="text-base">{match.team_a_flag || ''}</span>
            <span className="text-white truncate">{match.team_a}</span>
            {finished
              ? <span className="font-black text-[#2dc653] mx-1">{match.score_a} – {match.score_b}</span>
              : <span className="text-zinc-700 mx-1">vs</span>}
            <span className="text-white truncate">{match.team_b}</span>
            <span className="text-base">{match.team_b_flag || ''}</span>
          </div>
          <p className="text-[10px] text-zinc-700 mt-0.5">{formatKickoff(match.kickoff_time)}</p>
        </div>

        {result && <span className="text-[10px] text-[#2dc653] text-right shrink-0 max-w-[120px]">{result}</span>}

        {finished && !result && (
          <span className="text-[10px] font-semibold text-[#2dc653] shrink-0">✅ Done</span>
        )}
        {!finished && needs && !result && (
          <button onClick={() => setOpen(v => !v)}
            className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors"
            style={{ color: '#f59e0b', borderColor: '#f59e0b44', backgroundColor: '#f59e0b11' }}>
            {open ? 'Cancel' : 'Enter Result'}
          </button>
        )}
        {!finished && !needs && (
          <span className="text-[10px] text-zinc-700 shrink-0">Not started</span>
        )}
      </div>

      {open && !finished && (
        <div className="px-4 pb-4 pt-2 border-t border-[#1e1e1e]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600 mb-1 truncate">{match.team_a}</p>
              <input type="number" min={0} max={20} value={scoreA}
                onChange={e => setScoreA(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#c9a84c] rounded-xl px-3 py-2.5 text-center text-xl font-black text-white outline-none" />
            </div>
            <span className="text-zinc-700 text-lg mt-4">–</span>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600 mb-1 truncate">{match.team_b}</p>
              <input type="number" min={0} max={20} value={scoreB}
                onChange={e => setScoreB(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#333] focus:border-[#c9a84c] rounded-xl px-3 py-2.5 text-center text-xl font-black text-white outline-none" />
            </div>
          </div>
          {err && <p className="text-red-400 text-xs mb-2">{err}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl text-black font-bold text-sm disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c96d)` }}>
            {saving ? 'Saving…' : 'Save & Score All Leagues'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Shared UI ─── */
function SASection({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: GOLD }} />
      <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500">{title}</span>
    </div>
  )
}

function SAStatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl px-5 py-4">
      <p className="text-[9px] font-semibold tracking-widest uppercase text-zinc-700 mb-1">{label}</p>
      <p className="text-3xl font-black text-white leading-tight">{value}</p>
    </div>
  )
}

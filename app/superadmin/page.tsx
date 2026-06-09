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
interface LeagueRow extends League { memberCount: number }
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
                            <p className="text-sm font-semibold truncate text-white">{league.name}</p>
                            <p className="text-[10px] text-zinc-600">/{league.slug}</p>
                          </div>
                          <div className="text-right shrink-0 mr-2">
                            <p className="text-sm font-bold" style={{ color: GOLD }}>{league.memberCount}</p>
                            <p className="text-[9px] text-zinc-700 uppercase tracking-wider">members</p>
                          </div>
                          <div className="text-[10px] text-zinc-600 shrink-0 hidden sm:block">
                            {new Date(league.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a href={`/league/${league.slug}`} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-zinc-600 hover:text-[#c9a84c] border border-[#222] px-2 py-0.5 rounded-full transition-colors"
                              onClick={e => e.stopPropagation()}>
                              View ↗
                            </a>
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

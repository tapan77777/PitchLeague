'use client'

import { Suspense } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAdminSession, getAdminLeagues, addAdminLeague, AdminSession } from '@/lib/admin'
import { getLeagueThemeVars, getLeagueShareUrl } from '@/lib/utils'
import { League, LeagueMember } from '@/types'
import { Copy, Check, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

interface PageData {
  league: League
  members: LeagueMember[]
  totalPredictions: number
  mostPredictedTeam: string
  activeTodayCount: number
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [session, setSession] = useState<AdminSession | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load admin session from localStorage
  useEffect(() => {
    const s = getAdminSession()
    const slugParam = searchParams.get('league')
    if (!s && !slugParam) {
      setError('no_session')
      setLoading(false)
      return
    }
    setSession(s)
  }, [searchParams])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const slugParam = searchParams.get('league')
      const adminSession = getAdminSession()

      // Find league: prefer URL slug → localStorage session → first admin league
      let league: League | null = null
      if (slugParam) {
        const { data } = await supabase.from('leagues').select('*').eq('slug', slugParam).maybeSingle()
        league = data
      }
      if (!league && adminSession) {
        const { data } = await supabase.from('leagues').select('*').eq('id', adminSession.league_id).maybeSingle()
        league = data
      }
      if (!league) {
        const firstAdminLeague = getAdminLeagues()[0]
        if (firstAdminLeague) {
          const { data } = await supabase.from('leagues').select('*').eq('slug', firstAdminLeague.slug).maybeSingle()
          league = data
        }
      }
      if (!league) { setError('no_league'); setLoading(false); return }

      addAdminLeague({ slug: league.slug, name: league.name, created_at: new Date().toISOString() })

      const [membersRes, predsRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', league.id).order('total_points', { ascending: false }),
        supabase.from('predictions').select('match_id, predicted_winner, submitted_at, clerk_id').eq('league_id', league.id),
      ])

      const members: LeagueMember[] = membersRes.data ?? []
      const preds = predsRes.data ?? []

      const teamVoteCounts: Record<string, number> = {}
      for (const p of preds) {
        if (!p.predicted_winner || p.predicted_winner === 'draw') continue
        teamVoteCounts[p.predicted_winner] = (teamVoteCounts[p.predicted_winner] ?? 0) + 1
      }
      const mostPredictedTeam = Object.entries(teamVoteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const activeTodayCount = new Set(preds.filter(p => new Date(p.submitted_at) >= todayStart).map(p => p.clerk_id)).size

      setData({ league, members, totalPredictions: preds.length, mostPredictedTeam, activeTodayCount })
    } catch (err) {
      console.error('[admin dashboard]', err)
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function onLeagueUpdated(updated: League) {
    setData(prev => prev ? { ...prev, league: updated } : prev)
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (error === 'no_session' || error === 'no_league') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 text-center">
        <span className="text-5xl mb-4">🏟️</span>
        <p className="text-white font-bold mb-1">No league found</p>
        <p className="text-zinc-500 text-sm mb-5">Create a league first to access your dashboard.</p>
        <button onClick={() => router.push('/create')}
          className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">
          Create a League
        </button>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-zinc-400 text-sm mb-4">Failed to load dashboard.</p>
        <button onClick={fetchData} className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, members, totalPredictions, mostPredictedTeam, activeTodayCount } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const inviteUrl = getLeagueShareUrl(league.slug)

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={themeVars}>
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto gap-3">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Admin Dashboard</p>
            <p className="font-bold text-sm leading-tight truncate max-w-[160px] sm:max-w-xs">{league.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {league.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={league.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
              : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{ backgroundColor: primary + '33', color: primary }}>{league.name.charAt(0)}</div>
            }
            <a href={`/league/${league.slug}`}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-full transition-colors">
              <ArrowLeft size={11} /> League page
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <InviteLinkBox url={inviteUrl} primary={primary} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Members" value={String(members.length)} primary={primary} />
          <StatCard label="Predictions" value={String(totalPredictions)} primary={primary} />
          <StatCard label="Most Backed" value={mostPredictedTeam} small primary={primary} />
          <StatCard label="Active Today" value={String(activeTodayCount)} primary={primary} />
        </div>

        <section>
          <SectionHeading>Results</SectionHeading>
          <EmptyCard>Results are managed centrally. Scores update automatically after each match.</EmptyCard>
        </section>

        <BrandingPanel league={league} primary={primary} onSaved={onLeagueUpdated} />

        <RewardsPanel league={league} primary={primary} onSaved={onLeagueUpdated} />

        <section>
          <SectionHeading>Members ({members.length})</SectionHeading>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {members.length === 0
              ? <p className="text-zinc-500 text-sm text-center py-8">No members yet.</p>
              : <div className="divide-y divide-zinc-800">
                  {members.map((m, i) => <MemberRow key={m.id} member={m} rank={i + 1} primary={primary} />)}
                </div>
            }
          </div>
        </section>
      </div>
    </div>
  )
}

function InviteLinkBox({ url, primary }: { url: string; primary: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Invite Link</p>
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 font-mono outline-none truncate" />
        <button onClick={copy} className="shrink-0 flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
          style={{ backgroundColor: copied ? primary : primary + '22', color: copied ? '#000' : primary }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-zinc-600 text-xs mt-2">Share this link on WhatsApp, Instagram, or your loyalty app.</p>
    </div>
  )
}

function BrandingPanel({ league, primary: initialPrimary, onSaved }:
  { league: League; primary: string; onSaved: (l: League) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(league.name)
  const [welcomeMessage, setWelcomeMessage] = useState(league.welcome_message ?? '')
  const [primaryColor, setPrimaryColor] = useState(league.primary_color)
  const [logoUrl, setLogoUrl] = useState(league.logo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSave() {
    setSaving(true); setToast('')
    try {
      const res = await fetch(`/api/leagues/${league.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), welcome_message: welcomeMessage, primary_color: primaryColor, logo_url: logoUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setToast(data.error || 'Save failed'); return }
      onSaved(data.league); setToast('Saved ✓'); setTimeout(() => setToast(''), 2500)
    } catch { setToast('Network error') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <button onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full">
        <SectionHeading>Branding</SectionHeading>
        <span className="text-zinc-500 mb-3">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Field label="League name">
                <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
              </Field>
              <Field label="Primary color">
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-zinc-700 cursor-pointer bg-transparent p-0.5" />
                  <span className="text-sm text-zinc-400 font-mono">{primaryColor}</span>
                  <div className="flex gap-1.5 ml-auto">
                    {['#16a34a','#2563eb','#dc2626','#d97706','#7c3aed'].map(c => (
                      <button key={c} onClick={() => setPrimaryColor(c)} className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c, borderColor: primaryColor === c ? '#fff' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </Field>
              <Field label="Welcome message">
                <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} maxLength={200} rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none" />
              </Field>
              <Field label="Logo URL">
                <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-zinc-600" />
              </Field>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleSave} disabled={saving || name.trim().length < 3}
                  className="flex-1 font-bold py-3 rounded-xl text-sm text-black disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}>
                  {saving ? 'Saving…' : 'Save Branding'}
                </button>
                {toast && <span className={`text-sm font-semibold ${toast === 'Saved ✓' ? 'text-green-400' : 'text-red-400'}`}>{toast}</span>}
              </div>
            </div>
            <div className="lg:w-60 shrink-0">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold text-center mb-3">Preview</p>
              <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950">
                <div className="h-2.5" style={{ backgroundColor: primaryColor }} />
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    {logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={logoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: primaryColor }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ backgroundColor: primaryColor + '33', color: primaryColor }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                    }
                    <div>
                      <p className="font-bold text-xs text-white leading-tight">{name || 'Your League'}</p>
                      <p className="text-zinc-500 text-[10px]">FIFA 2026 League</p>
                    </div>
                  </div>
                  <div className="w-full py-2 rounded-xl text-center text-xs font-bold"
                    style={{ backgroundColor: primaryColor, color: '#000' }}>Join League</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function RewardsPanel({ league, primary, onSaved }:
  { league: League; primary: string; onSaved: (l: League) => void }) {
  const [open, setOpen] = useState(false)
  const [rewardMessage, setRewardMessage] = useState(league.reward_message ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSave() {
    setSaving(true); setToast('')
    try {
      const res = await fetch(`/api/leagues/${league.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_message: rewardMessage }),
      })
      const data = await res.json()
      if (!res.ok) { setToast(data.error || 'Save failed'); return }
      onSaved(data.league); setToast('Saved ✓'); setTimeout(() => setToast(''), 2500)
    } catch { setToast('Network error') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <button onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full">
        <SectionHeading>Custom Rewards</SectionHeading>
        <span className="text-zinc-500 mb-3">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
            Describe the prize or reward for your league winner. This will appear as a banner on your leaderboard page visible to all members.
          </p>
          <Field label="Reward message (shown on leaderboard)">
            <textarea value={rewardMessage} onChange={e => setRewardMessage(e.target.value)} maxLength={300} rows={3}
              placeholder="e.g. 🏆 Winner gets a free dinner for two at our restaurant!"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none placeholder-zinc-600" />
          </Field>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 font-bold py-3 rounded-xl text-sm text-black disabled:opacity-60"
              style={{ backgroundColor: primary }}>
              {saving ? 'Saving…' : 'Save Reward'}
            </button>
            {toast && <span className={`text-sm font-semibold ${toast === 'Saved ✓' ? 'text-green-400' : 'text-red-400'}`}>{toast}</span>}
          </div>
          {league.reward_message && (
            <div className="mt-4 rounded-xl border border-[#c9a84c44] bg-[#c9a84c0a] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c] mb-1">Preview (leaderboard banner)</p>
              <p className="text-sm text-[#f0f0f0]">🎁 REWARDS: {league.reward_message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function MemberRow({ member, rank, primary }: { member: LeagueMember; rank: number; primary: string }) {
  const initials = member.display_name.slice(0, 2).toUpperCase()
  const joinedDate = new Date(member.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const rankColors: Record<number, string> = { 1: '#eab308', 2: '#a1a1aa', 3: '#b45309' }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-6 text-center shrink-0">
        <span className="text-sm font-black" style={{ color: rankColors[rank] || '#52525b' }}>
          {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
        </span>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
        style={{ backgroundColor: primary + '22', color: primary }}>
        {member.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.display_name}</p>
        <p className="text-zinc-600 text-xs">Joined {joinedDate}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0 text-right">
        <div className="hidden sm:block">
          <p className="text-xs text-zinc-500">Correct</p>
          <p className="text-sm font-bold text-white">{member.correct_predictions}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Points</p>
          <p className="text-sm font-black" style={{ color: primary }}>{member.total_points}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">{children}</h2>
}
function StatCard({ label, value, small = false, primary }: { label: string; value: string; small?: boolean; primary: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold mb-1">{label}</p>
      <p className={`font-black leading-tight ${small ? 'text-base' : 'text-3xl'}`} style={{ color: primary }}>{value}</p>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-zinc-400 mb-1.5">{label}</label>{children}</div>
}
function EmptyCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center"><p className="text-zinc-500 text-sm">{children}</p></div>
}

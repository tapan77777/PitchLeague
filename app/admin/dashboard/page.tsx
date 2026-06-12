'use client'

import { Suspense } from 'react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { getAdminSession, getAdminLeagues, addAdminLeague, clearAdminSession, AdminSession } from '@/lib/admin'
import { getOrCreateMemberId } from '@/lib/member'
import { getLeagueThemeVars, getLeagueShareUrl } from '@/lib/utils'
import { League, LeagueMember } from '@/types'
import { Copy, Check, ChevronDown, ChevronUp, ArrowLeft, LogOut, Download, Printer, Trash2, Users } from 'lucide-react'

interface PageData {
  league: League
  members: LeagueMember[]
  totalPredictions: number
  mostPredictedTeam: string
  totalMatches: number
  predsByMember: Record<string, number>
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [session, setSession] = useState<AdminSession | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessDeniedSlug, setAccessDeniedSlug] = useState('')

  useEffect(() => {
    const s = getAdminSession()
    const slugParam = searchParams.get('league')
    if (!s && !slugParam) { setError('no_session'); setLoading(false); return }
    setSession(s)
  }, [searchParams])

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const slugParam = searchParams.get('league')
      const adminSession = getAdminSession()

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

      // Access control — verify this device created the league (superadmin bypass)
      const memberId = getOrCreateMemberId()
      const isSuperAdmin = searchParams.get('superadmin') === 'true' &&
        typeof window !== 'undefined' &&
        localStorage.getItem('pitchleague_superadmin') === 'yes'
      if (league.admin_clerk_id && memberId && league.admin_clerk_id !== memberId && !isSuperAdmin) {
        setAccessDeniedSlug(league.slug)
        setError('access_denied')
        setLoading(false)
        return
      }

      addAdminLeague({ slug: league.slug, name: league.name, created_at: new Date().toISOString() })

      const [membersRes, predsRes, matchCountRes] = await Promise.all([
        supabase.from('league_members').select('*').eq('league_id', league.id).order('total_points', { ascending: false }),
        supabase.from('predictions').select('match_id, predicted_winner, clerk_id').eq('league_id', league.id),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
      ])

      const members: LeagueMember[] = membersRes.data ?? []
      const preds = predsRes.data ?? []

      const teamVoteCounts: Record<string, number> = {}
      const predsByMember: Record<string, number> = {}
      for (const p of preds) {
        predsByMember[p.clerk_id] = (predsByMember[p.clerk_id] ?? 0) + 1
        if (!p.predicted_winner || p.predicted_winner === 'draw') continue
        teamVoteCounts[p.predicted_winner] = (teamVoteCounts[p.predicted_winner] ?? 0) + 1
      }
      const mostPredictedTeam = Object.entries(teamVoteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

      setData({
        league, members, totalPredictions: preds.length, mostPredictedTeam,
        totalMatches: matchCountRes.count ?? 0, predsByMember,
      })
    } catch (err) {
      console.error('[admin dashboard]', err); setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => { fetchData() }, [fetchData])

  function onLeagueUpdated(updated: League) {
    setData(prev => prev ? { ...prev, league: updated } : prev)
  }

  function onMemberRemoved(memberId: string) {
    setData(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev)
  }

  function handleLogout() {
    clearAdminSession()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error === 'no_session' || error === 'no_league') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 text-center">
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

  if (error === 'access_denied') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>🔒</span>
        <h1 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 32, color: '#e74c3c', letterSpacing: '0.12em', marginBottom: 12 }}>
          ACCESS DENIED
        </h1>
        <p style={{ fontFamily: "'Arial', sans-serif", fontSize: 14, color: '#666', maxWidth: 300, lineHeight: 1.6, marginBottom: 8 }}>
          This admin panel belongs to a different account.
        </p>
        <p style={{ fontFamily: "'Arial', sans-serif", fontSize: 13, color: '#444', maxWidth: 300, lineHeight: 1.6, marginBottom: 28 }}>
          Are you the league creator? Make sure you&apos;re using the same device you created this league on.
        </p>
        <a
          href={`/league/${accessDeniedSlug}`}
          style={{
            display: 'inline-block',
            background: '#c9a84c', color: '#000',
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: 18, letterSpacing: '0.1em',
            padding: '12px 28px', borderRadius: 999,
            textDecoration: 'none',
          }}
        >
          Go to League Page
        </a>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-zinc-400 text-sm mb-4">Failed to load dashboard.</p>
        <button onClick={fetchData} className="bg-green-500 text-black font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
      </div>
    )
  }

  const { league, members, totalPredictions, mostPredictedTeam, totalMatches, predsByMember } = data
  const primary = league.primary_color || '#16a34a'
  const themeVars = getLeagueThemeVars(primary, league.accent_color || '#15803d')
  const inviteUrl = getLeagueShareUrl(league.slug)

  const totalPossible = members.length * totalMatches
  const coveragePct = totalPossible > 0 ? Math.round((totalPredictions / totalPossible) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={themeVars}>

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-zinc-900 px-4 h-14 flex items-center">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full gap-3">
          <a href={`/league/${league.slug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={14} /> League
          </a>
          <span className="fifa-score text-lg leading-none text-[#f0f0f0] truncate flex-1 text-center">
            {league.name}
          </span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-400 transition-colors shrink-0">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── 1. Hero Header ── */}
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <div className="flex items-center gap-4">
            {league.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={league.logo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 shrink-0"
                style={{ borderColor: primary }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
                style={{ backgroundColor: primary + '22', color: primary }}>
                {league.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="fifa-score text-2xl leading-none text-[#f0f0f0] truncate">{league.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Admin Dashboard · FIFA 2026</p>
              <p className="text-xs text-zinc-600 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Invite link inline */}
          <div className="mt-4">
            <QuickCopyBar url={inviteUrl} primary={primary} />
          </div>
        </div>

        {/* ── 2. Stats Row ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Members" value={String(members.length)} icon="👥" primary={primary} />
          <StatCard label="Predictions" value={String(totalPredictions)} icon="🎯" primary={primary} />
          <StatCard label="Most Backed" value={mostPredictedTeam} icon="⭐" primary={primary} small />
          <StatCard label="Coverage" value={`${coveragePct}%`} icon="📊" primary={primary} />
        </div>

        {/* ── 3. QR Code ── */}
        <QRSection url={inviteUrl} leagueName={league.name} primary={primary} />

        {/* ── 4. Share Section ── */}
        <ShareSection url={inviteUrl} primary={primary} />

        {/* ── 5. Branding Panel ── */}
        <BrandingPanel league={league} primary={primary} onSaved={onLeagueUpdated} />

        {/* ── 6. Rewards Section ── */}
        <RewardsPanel league={league} primary={primary} onSaved={onLeagueUpdated} />

        {/* ── 7. Results Note ── */}
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <div className="flex gap-3">
            <span className="text-xl shrink-0">⚡</span>
            <div>
              <p className="font-bold text-sm text-white mb-1">Results Update Automatically</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Match scores are managed centrally and update across all leagues simultaneously. Your members&apos; points are calculated automatically after each match.
              </p>
            </div>
          </div>
        </div>

        {/* ── 8. Members ── */}
        <MembersSection
          members={members}
          predsByMember={predsByMember}
          leagueId={league.id}
          primary={primary}
          onRemoved={onMemberRemoved}
        />

      </div>
    </div>
  )
}

/* ─────────────────────── Quick copy bar ─────────────────────── */

function QuickCopyBar({ url, primary }: { url: string; primary: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-400 font-mono truncate">
        {url}
      </div>
      <button onClick={copy}
        className="shrink-0 flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
        style={{ backgroundColor: copied ? '#16a34a' : primary, color: '#000' }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

/* ─────────────────────── QR Section ─────────────────────── */

function QRSection({ url, leagueName, primary }: { url: string; leagueName: string; primary: string }) {
  const [open, setOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${leagueName.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function printQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code – ${leagueName}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff;}
      img{width:240px;height:240px;} p{margin-top:12px;font-size:14px;color:#555;}</style></head>
      <body><img src="${dataUrl}"/><p>Scan to join ${leagueName}</p>
      <script>window.onload=()=>window.print()</script></body></html>
    `)
    win.document.close()
  }

  return (
    <section>
      <CollapsibleHeader title="QR Code for Tables" open={open} onToggle={() => setOpen(v => !v)} />
      {open && (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            Print this QR code and place it on your cafe tables, counter, or notice board. Customers scan it to join your league instantly.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div ref={qrRef} className="p-4 rounded-2xl" style={{ backgroundColor: '#111' }}>
              <QRCodeCanvas
                value={url}
                size={200}
                bgColor="#111111"
                fgColor="#c9a84c"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-zinc-500 font-semibold tracking-wide">Scan to join · {leagueName}</p>
            <div className="flex gap-3 w-full max-w-xs">
              <button onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all active:scale-95"
                style={{ backgroundColor: primary, color: '#000' }}>
                <Download size={15} /> Download
              </button>
              <button onClick={printQR}
                className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl border transition-all active:scale-95"
                style={{ borderColor: primary + '55', color: primary, backgroundColor: primary + '11' }}>
                <Printer size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────── Share Section ─────────────────────── */

function ShareSection({ url, primary }: { url: string; primary: string }) {
  const [open, setOpen] = useState(false)
  const [instagramCopied, setInstagramCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const waText = encodeURIComponent(`Join my FIFA 2026 prediction league! Predict match scores and compete with friends. Join here: ${url}`)
  const twitterText = encodeURIComponent(`Join my FIFA 2026 prediction league! Make your picks, climb the leaderboard. 🏆⚽`)

  async function copyForInstagram() {
    await navigator.clipboard.writeText(url)
    setInstagramCopied(true); setTimeout(() => setInstagramCopied(false), 3000)
  }
  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <section>
      <CollapsibleHeader title="Share Your League" open={open} onToggle={() => setOpen(v => !v)} />
      {open && (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5 space-y-4">
          {/* Link box */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Invite Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-400 font-mono truncate">{url}</div>
              <button onClick={copyLink}
                className="shrink-0 flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
                style={{ backgroundColor: linkCopied ? '#16a34a' : primary, color: '#000' }}>
                {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-1 gap-3">
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 bg-[#25D366] text-black">
              <span className="text-base">💬</span> Share on WhatsApp
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(url)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 bg-zinc-900 border border-zinc-700 text-white">
              <span className="text-base">𝕏</span> Share on X / Twitter
            </a>
            <button onClick={copyForInstagram}
              className="flex items-center justify-center gap-2.5 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 border"
              style={{ borderColor: primary + '55', color: primary, backgroundColor: primary + '11' }}>
              {instagramCopied ? <Check size={15} /> : <span className="text-base">📸</span>}
              {instagramCopied ? 'Link copied! Paste in your Instagram bio or story.' : 'Share on Instagram'}
            </button>
          </div>
          {instagramCopied && (
            <p className="text-xs text-zinc-500 text-center">Paste this link in your Instagram bio or story caption.</p>
          )}
        </div>
      )}
    </section>
  )
}

/* ─────────────────────── Branding Panel ─────────────────────── */

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
      const d = await res.json()
      if (!res.ok) { setToast(d.error || 'Save failed'); return }
      onSaved(d.league); setToast('Saved ✓'); setTimeout(() => setToast(''), 2500)
    } catch { setToast('Network error') }
    finally { setSaving(false) }
  }

  const presetColors = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2']

  return (
    <section>
      <CollapsibleHeader title="Customize Your League" open={open} onToggle={() => setOpen(v => !v)} />
      {open && (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5 space-y-4">
          <Field label="League name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60}
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-3 text-sm text-white outline-none" />
          </Field>

          <Field label="Brand color">
            <div className="flex items-center gap-3 flex-wrap">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-zinc-700 cursor-pointer bg-transparent p-0.5 shrink-0" />
              <span className="text-sm text-zinc-400 font-mono">{primaryColor}</span>
              <div className="flex gap-2 ml-auto">
                {presetColors.map(c => (
                  <button key={c} onClick={() => setPrimaryColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-transform active:scale-95"
                    style={{ backgroundColor: c, borderColor: primaryColor === c ? '#fff' : 'transparent' }} />
                ))}
              </div>
            </div>
          </Field>

          <Field label="Logo URL (optional)">
            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-3 text-sm text-white outline-none placeholder-zinc-600" />
          </Field>

          <Field label="Welcome message">
            <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} maxLength={200} rows={2}
              placeholder="Welcome to our FIFA 2026 league!"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-3 text-sm text-white outline-none resize-none placeholder-zinc-600" />
          </Field>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Preview</p>
            <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 max-w-xs">
              <div className="h-2" style={{ backgroundColor: primaryColor }} />
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  {logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2"
                        style={{ borderColor: primaryColor }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ backgroundColor: primaryColor + '33', color: primaryColor }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                  }
                  <div>
                    <p className="font-bold text-sm text-white leading-tight">{name || 'Your League'}</p>
                    <p className="text-zinc-500 text-xs">FIFA 2026 League</p>
                  </div>
                </div>
                {welcomeMessage && (
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{welcomeMessage}</p>
                )}
                <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold"
                  style={{ backgroundColor: primaryColor, color: '#000' }}>Join League</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={saving || name.trim().length < 3}
              className="flex-1 font-bold py-3.5 rounded-xl text-sm text-black disabled:opacity-60 transition-all active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {toast && (
              <span className={`text-sm font-semibold ${toast === 'Saved ✓' ? 'text-green-400' : 'text-red-400'}`}>
                {toast}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────── Rewards Panel ─────────────────────── */

function RewardsPanel({ league, primary, onSaved }:
  { league: League; primary: string; onSaved: (l: League) => void }) {
  const [open, setOpen] = useState(false)
  const [rewardMessage, setRewardMessage] = useState(league.reward_message ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const MAX = 150

  async function handleSave() {
    setSaving(true); setToast('')
    try {
      const res = await fetch(`/api/leagues/${league.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_message: rewardMessage }),
      })
      const d = await res.json()
      if (!res.ok) { setToast(d.error || 'Save failed'); return }
      onSaved(d.league); setToast('Saved ✓'); setTimeout(() => setToast(''), 2500)
    } catch { setToast('Network error') }
    finally { setSaving(false) }
  }

  const isActive = !!(league.reward_message?.trim())

  return (
    <section>
      <div className="flex items-center justify-between mb-0">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left py-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Set a Reward</span>
          {isActive && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Active
            </span>
          )}
        </button>
        <button onClick={() => setOpen(v => !v)} className="text-zinc-500 p-1">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5 mt-3 space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Set a prize or reward for your league winner. Members will see this as a banner on the leaderboard page — it keeps them motivated to participate.
          </p>
          <Field label={`Reward message (${rewardMessage.length}/${MAX})`}>
            <textarea
              value={rewardMessage}
              onChange={e => setRewardMessage(e.target.value.slice(0, MAX))}
              rows={3}
              placeholder="🏆 Winner gets free coffee! Top 3 get 20% off next visit"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-green-500 rounded-xl px-3 py-3 text-sm text-white outline-none resize-none placeholder-zinc-600"
            />
          </Field>

          {rewardMessage.trim() && (
            <div className="rounded-xl border border-[#c9a84c44] bg-[#c9a84c0a] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c] mb-1">Leaderboard preview</p>
              <div className="flex items-start gap-2">
                <span className="text-base">🎁</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c] mb-0.5">Rewards</p>
                  <p className="text-sm text-[#f0f0f0] leading-snug">{rewardMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 font-bold py-3.5 rounded-xl text-sm text-black disabled:opacity-60 transition-all active:scale-[0.98]"
              style={{ backgroundColor: primary }}>
              {saving ? 'Saving…' : 'Save Reward'}
            </button>
            {toast && (
              <span className={`text-sm font-semibold ${toast === 'Saved ✓' ? 'text-green-400' : 'text-red-400'}`}>
                {toast}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────── Members Section ─────────────────────── */

function MembersSection({ members, predsByMember, leagueId, primary, onRemoved }:
  { members: LeagueMember[]; predsByMember: Record<string, number>; leagueId: string; primary: string; onRemoved: (id: string) => void }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  function copyAllMembers() {
    const text = members.map((m, i) => `${i + 1}. ${m.display_name} — ${m.total_points} pts`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-0">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left py-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Your Members ({members.length})
          </span>
        </button>
        <div className="flex items-center gap-2">
          {members.length > 0 && (
            <button onClick={copyAllMembers}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
              style={{ color: copied ? '#16a34a' : primary, borderColor: copied ? '#16a34a44' : primary + '44', backgroundColor: copied ? '#16a34a11' : primary + '11' }}>
              {copied ? <Check size={12} /> : <Users size={12} />}
              {copied ? 'Copied!' : 'Copy list'}
            </button>
          )}
          <button onClick={() => setOpen(v => !v)} className="text-zinc-500 p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#111] p-8 text-center">
              <span className="text-4xl block mb-3">👥</span>
              <p className="font-bold text-sm text-white mb-1">No members yet</p>
              <p className="text-zinc-500 text-xs">Share your invite link to get people to join!</p>
            </div>
          ) : (
            members.map((m, i) => (
              <MemberCard
                key={m.id}
                member={m}
                rank={i + 1}
                predCount={predsByMember[m.clerk_id] ?? 0}
                leagueId={leagueId}
                primary={primary}
                onRemoved={onRemoved}
              />
            ))
          )}
        </div>
      )}
    </section>
  )
}

function MemberCard({ member, rank, predCount, leagueId, primary, onRemoved }:
  { member: LeagueMember; rank: number; predCount: number; leagueId: string; primary: string; onRemoved: (id: string) => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  const rankColors: Record<number, string> = { 1: '#eab308', 2: '#a1a1aa', 3: '#b45309' }
  const rankColor = rankColors[rank] || '#52525b'
  const rankLabel = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`
  const joinedDate = new Date(member.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/members`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      })
      if (res.ok) onRemoved(member.id)
    } catch { /* ignore */ }
    finally { setRemoving(false); setConfirmRemove(false) }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg w-8 text-center shrink-0 leading-none" style={{ color: rankColor }}>
          {rankLabel}
        </span>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: primary + '22', color: primary }}>
          {member.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : member.display_name.slice(0, 2).toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{member.display_name}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {predCount} predictions · Joined {joinedDate}
          </p>
        </div>
        <div className="shrink-0 text-right mr-2">
          <p className="font-black text-lg leading-none" style={{ color: primary }}>{member.total_points}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">pts</p>
        </div>
        {!confirmRemove ? (
          <button onClick={() => setConfirmRemove(true)}
            className="shrink-0 p-2 rounded-xl text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={15} />
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5">
            <button onClick={handleRemove} disabled={removing}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50">
              {removing ? '…' : 'Remove'}
            </button>
            <button onClick={() => setConfirmRemove(false)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────── Shared primitives ─────────────────────── */

function CollapsibleHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center justify-between w-full mb-3 py-1">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</span>
      <span className="text-zinc-500">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
    </button>
  )
}

function StatCard({ label, value, icon, small = false, primary }:
  { label: string; value: string; icon: string; small?: boolean; primary: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{label}</p>
      </div>
      <p className={`font-black leading-none ${small ? 'text-lg' : 'text-3xl'} truncate`} style={{ color: primary }}>
        {value}
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

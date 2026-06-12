'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminAccessBar from '@/components/AdminAccessBar'
import { supabase } from '@/lib/supabase'

interface Match {
  id: string
  team_a: string
  team_b: string
  group_name?: string
  kickoff_time: string
  stage: string
}

interface SiteStats {
  leagues: number
  members: number
  predictions: number
}

interface LiveLeague {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  is_public: boolean
  memberCount: number
  featured_rank?: number | null
}

const FEAT_COLORS: Record<number, string> = { 1: '#c9a84c', 2: '#aaaaaa', 3: '#cd7f32' }

const FLAG_EMOJIS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭', 'Brazil': '🇧🇷',
  'Morocco': '🇲🇦', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Turkey': '🇹🇷', 'Germany': '🇩🇪', 'Ecuador': '🇪🇨', 'Netherlands': '🇳🇱',
  'Japan': '🇯🇵', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Iran': '🇮🇷',
  'Spain': '🇪🇸', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'France': '🇫🇷',
  'Senegal': '🇸🇳', 'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Portugal': '🇵🇹',
  'Colombia': '🇨🇴', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Panama': '🇵🇦',
  'Ghana': '🇬🇭', 'Italy': '🇮🇹', 'Serbia': '🇷🇸', 'Denmark': '🇩🇰',
  'Peru': '🇵🇪', 'Nigeria': '🇳🇬', 'Poland': '🇵🇱', 'Chile': '🇨🇱',
  'Greece': '🇬🇷', 'Costa Rica': '🇨🇷', 'Indonesia': '🇮🇩', 'Ukraine': '🇺🇦',
  'New Zealand': '🇳🇿', 'Cameroon': '🇨🇲', 'Hungary': '🇭🇺', 'Slovakia': '🇸🇰',
}

function flag(name: string) { return FLAG_EMOJIS[name] || '🏴' }

function formatTickerDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
}

export default function LandingPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<SiteStats>({ leagues: 0, members: 0, predictions: 0 })
  const [liveLeagues, setLiveLeagues] = useState<LiveLeague[]>([])

  useEffect(() => {
    async function load() {
      const [matchRes, leagueRes, memberRes, predRes] = await Promise.all([
        supabase.from('matches').select('id,team_a,team_b,group_name,kickoff_time,stage')
          .order('kickoff_time', { ascending: true }).limit(40),
        supabase.from('leagues').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('league_members').select('*', { count: 'exact', head: true }),
        supabase.from('predictions').select('*', { count: 'exact', head: true }),
      ])
      setMatches(matchRes.data ?? [])
      setStats({
        leagues: leagueRes.count ?? 0,
        members: memberRes.count ?? 0,
        predictions: predRes.count ?? 0,
      })

      // Fetch live leagues with member counts (all active, featured first)
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name, slug, logo_url, primary_color, is_public, featured_rank')
        .eq('is_active', true)
        .order('featured_rank', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6)

      console.log('[LiveLeagues] fetch result:', leaguesData, 'error:', leaguesError)

      const withCounts = await Promise.all(
        (leaguesData ?? []).map(async (l) => {
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', l.id)
          return { ...l, memberCount: count ?? 0 } as LiveLeague
        })
      )
      console.log('[LiveLeagues] with counts:', withCounts)
      setLiveLeagues(withCounts)
    }
    load()
  }, [])

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">

      {/* ── Admin access bar (fixed bottom, device only) ── */}
      <AdminAccessBar />

      {/* ══════════════════════════════════════
          1. NAV
      ══════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between px-5 py-3 max-w-6xl mx-auto">
          <span className="bebas text-2xl tracking-widest" style={{ color: '#c9a84c' }}>
            PITCHLEAGUE
          </span>
          <Link
            href="/create"
            className="bebas text-sm tracking-widest px-5 py-2 rounded-full border transition-all duration-200 hover:bg-[#c9a84c] hover:text-black"
            style={{ borderColor: '#c9a84c', color: '#c9a84c' }}
          >
            CREATE YOUR LEAGUE →
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          2. HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 text-center overflow-hidden">
        {/* Radial gold glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(201,168,76,0.12) 0%, transparent 70%)',
          }}
        />
        {/* Faint grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#c9a84c 1px, transparent 1px), linear-gradient(90deg, #c9a84c 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Label */}
          <p className="bebas text-sm tracking-[0.3em] mb-6" style={{ color: '#c9a84c' }}>
            FIFA WORLD CUP 2026 · OFFICIAL PREDICTION PLATFORM
          </p>

          {/* Headline */}
          <h1 className="bebas leading-none mb-6">
            <span className="block text-5xl sm:text-7xl lg:text-[10rem] text-white">YOUR BRAND.</span>
            <span className="block text-5xl sm:text-7xl lg:text-[10rem]" style={{ color: '#c9a84c' }}>YOUR LEAGUE.</span>
            <span className="block text-5xl sm:text-7xl lg:text-[10rem] text-white">FIFA 2026.</span>
          </h1>

          {/* Sub */}
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Create a branded prediction league for your cafe, turf, or company.
            Your customers predict scores, compete on your leaderboard, and keep coming back.
          </p>

          {/* Live leagues pill strip */}
          {liveLeagues.length > 0 && (
            <div style={{ maxWidth: '100%', overflow: 'hidden', marginBottom: 24 }}>
              <p style={{ fontSize: 10, color: '#c9a84c', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>
                LIVE LEAGUES PLAYING NOW
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {liveLeagues.slice(0, 3).map((league) => (
                  <Link
                    key={league.id}
                    href={`/league/${league.slug}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#111', border: '1px solid #333', borderRadius: 20,
                      padding: '6px 14px', textDecoration: 'none',
                      fontFamily: "'Arial', sans-serif", fontSize: 12,
                      color: '#fff', fontWeight: 600,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dc653', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                      {league.name.length > 15 ? league.name.slice(0, 15) + '…' : league.name}
                    </span>
                    <span style={{ color: '#666', fontWeight: 400, whiteSpace: 'nowrap' }}>
                      · {league.memberCount} {league.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </Link>
                ))}
                {liveLeagues.length > 3 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: '#111', border: '1px solid #333', borderRadius: 20,
                    padding: '6px 14px', fontFamily: "'Arial', sans-serif",
                    fontSize: 12, color: '#555',
                  }}>
                    +{liveLeagues.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/create"
              className="bebas text-xl tracking-widest px-10 py-4 rounded-full text-black transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)' }}
            >
              CREATE YOUR LEAGUE
            </Link>
            <a
              href="#how-it-works"
              className="bebas text-xl tracking-widest px-10 py-4 rounded-full border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: '#333', color: '#888' }}
            >
              SEE HOW IT WORKS →
            </a>
          </div>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {[
              { value: stats.leagues || '—', label: 'LEAGUES ACTIVE' },
              { value: stats.members || '—', label: 'MEMBERS PREDICTING' },
              { value: 72, label: 'GROUP MATCHES' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="bebas text-3xl sm:text-4xl leading-none" style={{ color: '#c9a84c' }}>{value}</span>
                <span className="text-[10px] text-zinc-600 tracking-widest uppercase mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <span className="text-zinc-700 text-xs tracking-widest">SCROLL</span>
          <span className="text-zinc-700 text-lg">↓</span>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. MATCH TICKER
      ══════════════════════════════════════ */}
      {matches.length > 0 && (
        <div className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-3 overflow-hidden">
          <div className="ticker-track">
            {[...matches, ...matches].map((m, i) => {
              const g = m.group_name?.replace(/^Group\s*/i, '') || ''
              return (
                <span key={`${m.id}-${i}`} className="bebas text-sm tracking-widest whitespace-nowrap px-6 shrink-0" style={{ color: '#c9a84c' }}>
                  {flag(m.team_a)} {m.team_a.toUpperCase()} VS {m.team_b.toUpperCase()} {flag(m.team_b)}
                  {g && <span className="text-zinc-600 mx-1">· GROUP {g}</span>}
                  <span className="text-zinc-700 mx-1">· {formatTickerDate(m.kickoff_time)}</span>
                  <span className="text-[#2a2a2a] mx-3">◆</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          4. HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="px-5 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="bebas text-sm tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>THE PROCESS</p>
          <h2 className="bebas text-5xl sm:text-7xl text-white leading-none">UP AND RUNNING IN 3 MINUTES</h2>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-0">
          {/* Connector line (desktop) */}
          <div className="hidden sm:block absolute top-[52px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a84c44, #c9a84c44, transparent)' }} />

          {[
            { num: '01', icon: '🏆', title: 'CREATE YOUR LEAGUE', text: 'Add your brand name, logo, and colors. Takes 2 minutes. Your identity, your rules.' },
            { num: '02', icon: '📲', title: 'SHARE THE LINK', text: "Drop it on WhatsApp or Instagram. Anyone can join instantly — no app download needed." },
            { num: '03', icon: '⚡', title: 'WATCH THEM COMPETE', text: 'Members predict every match. Live leaderboard keeps the energy going all tournament.' },
          ].map(({ num, icon, title, text }) => (
            <div key={num} className="relative flex flex-col items-center text-center px-6 py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5 relative z-10"
                style={{ backgroundColor: '#111', border: '2px solid #c9a84c33' }}>
                {icon}
              </div>
              <span className="bebas text-xs tracking-widest mb-2" style={{ color: '#c9a84c' }}>STEP {num}</span>
              <h3 className="bebas text-2xl text-white mb-3 leading-tight">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. WHO IT'S FOR
      ══════════════════════════════════════ */}
      <section className="px-5 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="bebas text-sm tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>USE CASES</p>
          <h2 className="bebas text-5xl sm:text-7xl text-white leading-none">BUILT FOR YOUR COMMUNITY</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: '☕',
              title: 'CAFES & RESTAURANTS',
              text: 'Turn match days into packed tables. Your customers predict, compete, and come back for every game.',
            },
            {
              icon: '⚽',
              title: 'SPORTS TURFS',
              text: 'Build loyalty beyond bookings. Create a league your regulars actually care about.',
            },
            {
              icon: '🏢',
              title: 'COMPANIES & HR',
              text: 'The perfect team bonding activity. Keep the office talking all tournament long.',
            },
            {
              icon: '🎓',
              title: 'COLLEGES & CLUBS',
              text: "Fire up campus rivalry. Who's the best predictor in your batch?",
            },
          ].map(({ icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border p-7 transition-all duration-300 hover:border-[#c9a84c44] hover:bg-[#111]"
              style={{ borderColor: '#1e1e1e', backgroundColor: '#0d0d0d' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ backgroundColor: '#c9a84c11', border: '1px solid #c9a84c22' }}>
                {icon}
              </div>
              <h3 className="bebas text-2xl text-white mb-2 leading-tight">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. FEATURES STRIP
      ══════════════════════════════════════ */}
      <section className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-16 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {[
            { icon: '🎨', title: 'YOUR BRANDING', text: 'Logo, colors, name — looks built for you' },
            { icon: '📊', title: 'LIVE LEADERBOARD', text: 'Real-time rankings after every match' },
            { icon: '📤', title: 'SHAREABLE CARDS', text: 'Members share predictions to stories' },
            { icon: '⚡', title: 'ZERO SETUP', text: 'Live in under 2 minutes, no code needed' },
          ].map(({ icon, title, text }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <span className="text-3xl mb-3">{icon}</span>
              <h4 className="bebas text-lg text-white leading-tight mb-1">{title}</h4>
              <p className="text-zinc-600 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. LIVE LEAGUES
      ══════════════════════════════════════ */}
      <section className="px-5 py-20">
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Arial', sans-serif", fontSize: 10, fontWeight: 700, color: '#e74c3c', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                  LIVE NOW
                </span>
              </div>
              <h2 className="bebas text-4xl sm:text-5xl text-white leading-none mb-2">ACTIVE LEAGUES</h2>
              <p style={{ fontFamily: "'Arial', sans-serif", fontSize: 13, color: '#555' }}>
                Join a league and start predicting today
              </p>
            </div>

            {/* League cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {liveLeagues.length === 0 && (
                <div style={{
                  background: '#111', border: '1px solid #1a1a1a', borderRadius: 14,
                  padding: '28px 20px', textAlign: 'center',
                }}>
                  <p style={{ fontFamily: "'Arial', sans-serif", fontSize: 13, color: '#444' }}>
                    No active leagues yet. Be the first to create one!
                  </p>
                </div>
              )}
              {liveLeagues.map((league) => {
                const color = league.primary_color || '#c9a84c'
                const initial = league.name.charAt(0).toUpperCase()
                const featRank = league.featured_rank
                const featColor = featRank ? (FEAT_COLORS[featRank] ?? color) : null
                const isFeatured = !!featRank

                return (
                  <div
                    key={league.id}
                    style={{
                      background: isFeatured ? '#141414' : '#111',
                      border: isFeatured ? `1px solid ${featColor}55` : '1px solid #1a1a1a',
                      borderRadius: 14,
                      padding: isFeatured ? '16px 16px' : '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      position: 'relative',
                    }}
                  >
                    {/* Featured badge */}
                    {isFeatured && (
                      <span style={{
                        position: 'absolute', top: 10, right: 12,
                        fontFamily: "'Arial', sans-serif", fontSize: 9, fontWeight: 900,
                        color: featColor!, letterSpacing: '0.12em',
                        background: `${featColor}18`,
                        border: `1px solid ${featColor}44`,
                        borderRadius: 999, padding: '2px 8px',
                      }}>
                        ★ FEATURED
                      </span>
                    )}

                    {/* Avatar */}
                    <div style={{
                      width: isFeatured ? 52 : 48,
                      height: isFeatured ? 52 : 48,
                      borderRadius: '50%', flexShrink: 0,
                      background: `${color}26`,
                      border: `2px solid ${isFeatured ? featColor! : color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Arial Black', Arial, sans-serif",
                      fontSize: isFeatured ? 22 : 20, fontWeight: 900, color,
                      overflow: 'hidden',
                    }}>
                      {league.logo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={league.logo_url} alt={league.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : initial
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: isFeatured ? 70 : 0 }}>
                      <div style={{
                        fontFamily: "'Arial', sans-serif",
                        fontSize: isFeatured ? 16 : 15,
                        fontWeight: 900,
                        color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 4,
                      }}>
                        {league.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontFamily: "'Arial', sans-serif",
                          fontSize: isFeatured ? 11 : 10,
                          fontWeight: isFeatured ? 700 : 400,
                          color: isFeatured ? '#888' : '#555',
                        }}>
                          {league.memberCount} {league.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        <span style={{ color: '#333', fontSize: 10 }}>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dc653', display: 'inline-block' }} />
                          <span style={{ fontFamily: "'Arial', sans-serif", fontSize: 10, color: '#2dc653' }}>Active</span>
                        </span>
                      </div>
                    </div>

                    {/* JOIN button — always shown */}
                    <Link
                      href={`/league/${league.slug}`}
                      style={{
                        display: 'inline-block', flexShrink: 0,
                        background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
                        color: '#000', fontFamily: "'Arial', sans-serif",
                        fontSize: 11, fontWeight: 900,
                        borderRadius: 20, padding: '8px 14px',
                        textDecoration: 'none', letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      JOIN →
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Create CTA */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Arial', sans-serif", fontSize: 11, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                WANT YOUR OWN LEAGUE?
              </p>
              <Link
                href="/create"
                style={{
                  display: 'inline-block',
                  border: '1px solid #c9a84c', borderRadius: 999,
                  padding: '10px 24px', background: 'transparent',
                  fontFamily: "'Arial', sans-serif", fontSize: 13, fontWeight: 700,
                  color: '#c9a84c', textDecoration: 'none', letterSpacing: '0.06em',
                }}
              >
                CREATE YOUR LEAGUE FREE →
              </Link>
            </div>
          </div>
        </section>

      {/* ══════════════════════════════════════
          8. SOCIAL PROOF / STATS
      ══════════════════════════════════════ */}
      <section className="px-5 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="bebas text-sm tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>BY THE NUMBERS</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { value: stats.leagues || '—', label: 'LEAGUES CREATED' },
            { value: stats.members || '—', label: 'MEMBERS COMPETING' },
            { value: 72, label: 'GROUP STAGE MATCHES' },
            { value: stats.predictions || '—', label: 'PREDICTIONS MADE' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center border border-[#1a1a1a] rounded-2xl py-8 px-4 bg-[#0d0d0d]">
              <span className="bebas text-5xl sm:text-6xl leading-none mb-1" style={{ color: '#c9a84c' }}>{value}</span>
              <span className="text-[10px] text-zinc-600 tracking-widest uppercase leading-snug mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          8. CTA BANNER
      ══════════════════════════════════════ */}
      <section className="px-5 py-5">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-12 sm:p-16 flex flex-col items-center text-center"
          style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #a8882e 50%, #c9a84c 100%)' }}
        >
          <p className="bebas text-sm tracking-[0.3em] text-black/60 mb-3">DON&apos;T MISS THE GROUP STAGE</p>
          <h2 className="bebas text-5xl sm:text-7xl text-black leading-none mb-4">
            WORLD CUP<br />STARTS NOW.
          </h2>
          <p className="text-black/70 text-base mb-10 max-w-md">
            Create your league before the group stage ends. Your members are waiting.
          </p>
          <Link
            href="/create"
            className="bebas text-xl tracking-widest px-12 py-4 rounded-full bg-black text-white transition-all duration-200 hover:bg-zinc-900 hover:scale-105 active:scale-95"
          >
            CREATE YOUR LEAGUE FREE →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          9. FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-5 py-10 mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <span className="bebas text-2xl tracking-widest" style={{ color: '#c9a84c' }}>PITCHLEAGUE</span>
            <p className="text-zinc-600 text-xs text-center">
              Built for FIFA 2026 · Made by <span className="text-zinc-400">BuddyTech Labs</span>
            </p>
            <Link href="/superadmin" className="text-[#0a0a0a] hover:text-[#1a1a1a] text-[10px] transition-colors select-none">SA</Link>
          </div>
          <div className="border-t border-[#1a1a1a] pt-5 text-center">
            <p className="text-zinc-700 text-xs">© 2026 PitchLeague. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

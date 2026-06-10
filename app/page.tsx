'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReturningUserBar from '@/components/ReturningUserBar'
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
    }
    load()
  }, [])

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">

      {/* ── Returning user bar ── */}
      <ReturningUserBar />

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
            <span className="block text-7xl sm:text-8xl lg:text-[10rem] text-white">YOUR BRAND.</span>
            <span className="block text-7xl sm:text-8xl lg:text-[10rem]" style={{ color: '#c9a84c' }}>YOUR LEAGUE.</span>
            <span className="block text-7xl sm:text-8xl lg:text-[10rem] text-white">FIFA 2026.</span>
          </h1>

          {/* Sub */}
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Create a branded prediction league for your cafe, turf, or company.
            Your customers predict scores, compete on your leaderboard, and keep coming back.
          </p>

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
          7. SOCIAL PROOF / STATS
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

import Link from 'next/link'
import ReturningUserBar from '@/components/ReturningUserBar'

export default function LandingPage() {
  return (
    <main className="bg-zinc-950 text-white min-h-screen scroll-smooth">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <span className="font-bold text-lg tracking-tight">
          Pitch<span className="text-green-500">League</span>
        </span>
        <Link
          href="/create"
          className="bg-green-500 hover:bg-green-600 text-black font-semibold text-sm px-4 py-2 rounded-full transition-colors"
        >
          Create a League
        </Link>
      </nav>
      <ReturningUserBar />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-5 pt-16 pb-20 max-w-2xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-green-500 mb-4">
          FIFA 2026 · White-Label Prediction Leagues
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
          Your Brand.{' '}
          <span className="text-green-500">Your League.</span>{' '}
          FIFA 2026.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
          Launch a fully branded FIFA 2026 prediction league for your cafe,
          turf, restaurant, or company — in minutes. Keep your customers and
          employees hooked all tournament long.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/create"
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-7 py-3.5 rounded-full transition-colors text-base"
          >
            Create a League
          </Link>
          <a
            href="#how-it-works"
            className="border border-zinc-700 hover:border-zinc-500 text-white font-semibold px-7 py-3.5 rounded-full transition-colors text-base"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Up and running in{' '}
          <span className="text-green-500">3 steps</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '🏟️',
              title: 'Create your league',
              desc: 'Add your brand name, logo, and colors. Your league, your identity.',
            },
            {
              step: '02',
              icon: '🔗',
              title: 'Share the invite link',
              desc: 'Drop the link on WhatsApp, Instagram, or your loyalty app. Anyone can join instantly.',
            },
            {
              step: '03',
              icon: '🏆',
              title: 'Watch your community compete',
              desc: 'Live leaderboard keeps the excitement going across every match.',
            },
          ].map(({ step, icon, title, desc }) => (
            <div
              key={step}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <span className="absolute top-4 right-4 text-zinc-700 font-black text-xl">
                {step}
              </span>
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-bold text-base mb-1">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section id="who" className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Built for every community
        </h2>
        <p className="text-zinc-400 text-center text-sm mb-10">
          Whoever your crowd is — PitchLeague keeps them engaged.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '☕', label: 'Cafes &\nRestaurants', desc: 'Turn match days into packed tables.' },
            { icon: '⚽', label: 'Sports Turfs', desc: 'Build loyalty beyond bookings.' },
            { icon: '💼', label: 'Companies &\nHR Teams', desc: 'The perfect team-bonding activity.' },
            { icon: '🎓', label: 'College\nClubs', desc: 'Fire up campus rivalry.' },
          ].map(({ icon, label, desc }) => (
            <div
              key={label}
              className="bg-zinc-900 border border-zinc-800 hover:border-green-500/40 rounded-2xl p-5 flex flex-col items-center text-center transition-colors"
            >
              <span className="text-3xl mb-3">{icon}</span>
              <span className="font-semibold text-sm whitespace-pre-line mb-1">{label}</span>
              <span className="text-zinc-500 text-xs leading-snug">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Everything you need,{' '}
          <span className="text-green-500">nothing you don&apos;t</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              icon: '🎨',
              title: 'Branded league',
              desc: 'Your logo, your colors, your domain. Looks like it was built just for you.',
            },
            {
              icon: '📊',
              title: 'Live leaderboard',
              desc: 'Real-time standings update after every match. Drama guaranteed.',
            },
            {
              icon: '📲',
              title: 'Shareable prediction cards',
              desc: 'Auto-generated cards your members can post to Instagram and WhatsApp stories.',
            },
            {
              icon: '📱',
              title: 'Works on any phone',
              desc: 'No app download needed. Pure mobile-web, loads fast on 4G.',
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <span className="text-2xl mt-0.5 shrink-0">{icon}</span>
              <div>
                <h3 className="font-bold text-sm mb-1">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-5 py-16">
        <div className="max-w-2xl mx-auto bg-green-500/10 border border-green-500/30 rounded-3xl p-10 flex flex-col items-center text-center">
          <span className="text-3xl mb-4">🏆</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Ready to launch your league?
          </h2>
          <p className="text-zinc-400 text-sm mb-7 max-w-md">
            FIFA 2026 kicks off in June. Set up your branded league now and
            have it ready before the first whistle.
          </p>
          <Link
            href="/create"
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-3.5 rounded-full transition-colors text-base"
          >
            Create a League — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-5 py-8 text-center">
        <p className="text-zinc-400 text-sm font-semibold">
          PitchLeague by{' '}
          <span className="text-white">BuddyTech Labs</span>
        </p>
        <p className="text-zinc-600 text-xs mt-1">Built for FIFA 2026 ⚽</p>
      </footer>
    </main>
  )
}

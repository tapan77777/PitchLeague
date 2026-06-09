'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Trophy, Calendar, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/home',        label: 'Home',        icon: Home },
  { href: '/matches',     label: 'Matches',     icon: Calendar },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile',     label: 'Profile',     icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-colors ${
                active
                  ? 'text-[var(--league-primary,#16a34a)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

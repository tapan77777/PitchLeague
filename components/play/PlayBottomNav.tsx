'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Clock, Trophy, User } from 'lucide-react'

export default function PlayBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/play/${slug}`

  const items = [
    { href: base,                  label: 'Home',        icon: Home },
    { href: `${base}/history`,     label: 'History',     icon: Clock },
    { href: `${base}/leaderboard`, label: 'Leaderboard', icon: Trophy },
    { href: `${base}/profile`,     label: 'Profile',     icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-5 rounded-xl transition-colors ${
                active
                  ? 'text-[#c9a84c]'
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

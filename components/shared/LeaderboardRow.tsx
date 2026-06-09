'use client'

import { LeaderboardEntry } from '@/types'
import { ordinalRank } from '@/lib/utils'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-zinc-300',
  3: 'text-amber-600',
}

const RANK_BG: Record<number, string> = {
  1: 'bg-yellow-950 border-yellow-900',
  2: 'bg-zinc-900 border-zinc-700',
  3: 'bg-amber-950 border-amber-900',
}

export default function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const rankColor = RANK_COLORS[entry.rank] || 'text-zinc-500'
  const rowBg = isCurrentUser
    ? 'bg-[var(--league-primary-10,#16a34a1a)] border-[var(--league-primary,#16a34a)]'
    : RANK_BG[entry.rank] || 'bg-zinc-900 border-zinc-800'

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${rowBg} transition-colors`}>

      {/* Rank */}
      <div className={`w-8 text-center font-black text-lg ${rankColor}`}>
        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center
        text-sm font-bold text-zinc-300 shrink-0 overflow-hidden">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          : entry.display_name.slice(0, 2).toUpperCase()
        }
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-[var(--league-primary,#16a34a)]' : 'text-white'}`}>
            {entry.display_name}
            {isCurrentUser && <span className="text-xs ml-1 text-zinc-500">(you)</span>}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {entry.current_streak >= 3 && (
            <span className="text-xs">🔥{entry.current_streak}</span>
          )}
          {entry.badges?.slice(0, 3).map(b => (
            <span key={b.id} className="text-xs" title={b.badge_label}>{b.badge_emoji}</span>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <div className={`text-lg font-black ${isCurrentUser ? 'text-[var(--league-primary,#16a34a)]' : 'text-white'}`}>
          {entry.total_points}
        </div>
        <div className="text-[10px] text-zinc-600">pts</div>
      </div>
    </div>
  )
}

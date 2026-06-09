// ============================================
// PITCHLEAGUE — Utility Functions
// ============================================

// Generate a short random invite code e.g. "XK9P2M"
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// Generate URL-safe slug from league name e.g. "CultFit FIFA 2026" → "cultfit-fifa-2026"
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

// Format match kickoff time for display
export function formatKickoff(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST'
}

// Is this match still open for predictions?
export function isPredictionOpen(kickoffTime: string): boolean {
  return new Date(kickoffTime) > new Date()
}

// How long until kickoff (for countdown)
export function timeUntilKickoff(kickoffTime: string): string {
  const diff = new Date(kickoffTime).getTime() - Date.now()
  if (diff <= 0) return 'Started'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// Calculate points for a prediction
export function calculatePoints(
  predictedScoreA: number,
  predictedScoreB: number,
  actualScoreA: number,
  actualScoreB: number,
  isUnderdogPick: boolean = false
): { points: number; isExact: boolean; isCorrectWinner: boolean } {
  const isExact = predictedScoreA === actualScoreA && predictedScoreB === actualScoreB

  const actualWinner =
    actualScoreA > actualScoreB ? 'a' : actualScoreB > actualScoreA ? 'b' : 'draw'
  const predictedWinner =
    predictedScoreA > predictedScoreB ? 'a' : predictedScoreB > predictedScoreA ? 'b' : 'draw'

  const isCorrectWinner = actualWinner === predictedWinner

  let points = 0
  if (isExact) points += 5
  else if (isCorrectWinner) points += 2
  if (isUnderdogPick && isCorrectWinner) points += 1

  return { points, isExact, isCorrectWinner }
}

// Get ordinal rank string: 1 → "1st", 2 → "2nd"
export function ordinalRank(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Get accuracy percentage
export function getAccuracy(correct: number, total: number): string {
  if (total === 0) return '0%'
  return Math.round((correct / total) * 100) + '%'
}

// Badge definitions
export const BADGE_DEFINITIONS = {
  on_fire: { label: 'On Fire', emoji: '🔥', description: '3 correct predictions in a row' },
  sniper: { label: 'Sniper', emoji: '🎯', description: '3 exact scores' },
  underdog_hunter: { label: 'Underdog Hunter', emoji: '🐉', description: '2 correct underdog picks' },
  perfect_round: { label: 'Perfect Round', emoji: '⭐', description: 'All correct in a round' },
  early_bird: { label: 'Early Bird', emoji: '🐦', description: 'First to predict a match' },
  top_3: { label: 'Top 3', emoji: '🏆', description: 'Reached top 3 on leaderboard' },
}

// CSS variable injection for white-label theming
export function getLeagueThemeVars(primaryColor: string, accentColor: string) {
  return {
    '--league-primary': primaryColor,
    '--league-accent': accentColor,
    '--league-primary-10': primaryColor + '1a', // 10% opacity
    '--league-primary-20': primaryColor + '33', // 20% opacity
  } as React.CSSProperties
}

// Share URL builder
export function getLeagueShareUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchleague.vercel.app'
  return `${base}/league/${slug}`
}

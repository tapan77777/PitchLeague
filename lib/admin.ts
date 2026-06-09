export interface AdminSession {
  admin_id: string
  league_id: string
  slug: string
  league_name: string
}

export interface AdminLeague {
  slug: string
  name: string
  created_at: string
}

const SESSION_KEY = 'pitchleague_admin'
const ID_KEY = 'pitchleague_admin_id'
const LEAGUES_KEY = 'pitchleague_admin_leagues'

export function getOrCreateAdminId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

export function saveAdminSession(session: AdminSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(ID_KEY, session.admin_id)
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getAdminLeagues(): AdminLeague[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LEAGUES_KEY)
    return raw ? (JSON.parse(raw) as AdminLeague[]) : []
  } catch {
    return []
  }
}

export function addAdminLeague(league: AdminLeague): void {
  if (typeof window === 'undefined') return
  const leagues = getAdminLeagues()
  if (leagues.find(l => l.slug === league.slug)) return
  localStorage.setItem(LEAGUES_KEY, JSON.stringify([league, ...leagues]))
}

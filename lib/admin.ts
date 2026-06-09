export interface AdminSession {
  admin_id: string
  league_id: string
  slug: string
  league_name: string
}

const SESSION_KEY = 'pitchleague_admin'
const ID_KEY = 'pitchleague_admin_id'

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

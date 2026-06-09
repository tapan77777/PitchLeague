export interface MemberSession {
  member_id: string
  display_name: string
  league_id: string
  slug: string
}

const SESSION_KEY = 'pitchleague_member'
const ID_KEY = 'pitchleague_member_id'

export function getOrCreateMemberId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

export function getMemberSession(): MemberSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as MemberSession) : null
  } catch {
    return null
  }
}

export function saveMemberSession(session: MemberSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(ID_KEY, session.member_id)
}

// Clears session but keeps the member_id so rejoining reuses the same UUID
export function clearMemberSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

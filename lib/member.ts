export interface MemberSessions {
  member_id: string
  display_name: string
  leagues: Record<string, { joined_at: string }>
}

const SESSIONS_KEY = 'pitchleague_sessions'

function getSessions(): MemberSessions | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as MemberSessions) : null
  } catch {
    return null
  }
}

function saveSessions(s: MemberSessions): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(s))
}

export function getOrCreateMemberId(): string {
  if (typeof window === 'undefined') return ''
  const s = getSessions()
  if (s?.member_id) return s.member_id
  const id = crypto.randomUUID()
  saveSessions({ member_id: id, display_name: '', leagues: {} })
  return id
}

export function getMemberName(): string {
  return getSessions()?.display_name ?? ''
}

export function hasJoinedLeague(slug: string): boolean {
  return !!getSessions()?.leagues[slug]
}

export function addLeagueToSession(slug: string, displayName: string): void {
  if (typeof window === 'undefined') return
  const s = getSessions()
  const member_id = s?.member_id ?? crypto.randomUUID()
  saveSessions({
    member_id,
    display_name: displayName,
    leagues: {
      ...(s?.leagues ?? {}),
      [slug]: { joined_at: new Date().toISOString() },
    },
  })
}

export function getAllSessions(): MemberSessions | null {
  return getSessions()
}

export function saveDisplayName(name: string): void {
  if (typeof window === 'undefined') return
  const s = getSessions()
  if (!s) return
  saveSessions({ ...s, display_name: name })
}

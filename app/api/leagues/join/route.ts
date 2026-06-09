import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// POST /api/leagues/join — body: { invite_code, display_name, member_id }
// No Clerk auth — members are identified by a client-generated UUID
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { invite_code, display_name, member_id } = body

  if (!invite_code || !display_name?.trim() || !member_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, slug, max_members, is_active')
    .eq('invite_code', invite_code.toUpperCase().trim())
    .maybeSingle()

  if (!league) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }
  if (!league.is_active) {
    return NextResponse.json({ error: 'This league is no longer active' }, { status: 403 })
  }

  const { count } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id)

  if (count !== null && count >= league.max_members) {
    return NextResponse.json({ error: 'This league is full' }, { status: 403 })
  }

  // Return existing membership if already joined (idempotent)
  const { data: existing } = await supabase
    .from('league_members')
    .select('id, display_name')
    .eq('league_id', league.id)
    .eq('clerk_id', member_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ league, member: existing, alreadyMember: true })
  }

  const { data: member, error: joinError } = await supabase
    .from('league_members')
    .insert({
      league_id: league.id,
      clerk_id: member_id,
      display_name: display_name.trim(),
    })
    .select()
    .single()

  if (joinError) {
    console.error('Join error:', joinError)
    return NextResponse.json({ error: 'Failed to join league' }, { status: 500 })
  }

  return NextResponse.json({ league, member, joined: true })
}

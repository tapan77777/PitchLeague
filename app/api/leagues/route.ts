import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateInviteCode, generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, primary_color, accent_color, welcome_message, logo_url, admin_id, display_name } = body

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: 'League name must be at least 3 characters' }, { status: 400 })
  }
  if (!admin_id) {
    return NextResponse.json({ error: 'admin_id required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  let slug = generateSlug(name)
  const { data: existing } = await supabase.from('leagues').select('slug').eq('slug', slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  let invite_code = generateInviteCode()
  let codeExists = true
  while (codeExists) {
    const { data } = await supabase.from('leagues').select('invite_code').eq('invite_code', invite_code).maybeSingle()
    if (!data) codeExists = false
    else invite_code = generateInviteCode()
  }

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      slug,
      name: name.trim(),
      primary_color: primary_color || '#16a34a',
      accent_color: accent_color || '#15803d',
      welcome_message: welcome_message || null,
      logo_url: logo_url || null,
      admin_clerk_id: admin_id,
      invite_code,
      plan: 'starter',
      max_members: 50,
    })
    .select()
    .single()

  if (error) {
    console.error('League creation error:', error)
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 })
  }

  // Auto-add admin as first member
  await supabase.from('league_members').insert({
    league_id: league.id,
    clerk_id: admin_id,
    display_name: display_name || 'Admin',
  })

  return NextResponse.json({ league }, { status: 201 })
}

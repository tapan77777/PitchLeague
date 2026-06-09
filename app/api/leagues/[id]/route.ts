import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json()
  const { name, welcome_message, primary_color, accent_color, logo_url } = body

  if (name !== undefined && name.trim().length < 3) {
    return NextResponse.json({ error: 'League name must be at least 3 characters' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (welcome_message !== undefined) updates.welcome_message = welcome_message
  if (primary_color !== undefined) updates.primary_color = primary_color
  if (accent_color !== undefined) updates.accent_color = accent_color
  if (logo_url !== undefined) updates.logo_url = logo_url || null

  const { data: league, error } = await supabase
    .from('leagues')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('League update error:', error)
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 })
  }

  return NextResponse.json({ league })
}

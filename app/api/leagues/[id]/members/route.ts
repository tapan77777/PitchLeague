import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: leagueId } = params
  const { memberId } = await req.json()

  if (!memberId) {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('id', memberId)
    .eq('league_id', leagueId)

  if (error) {
    console.error('Member remove error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

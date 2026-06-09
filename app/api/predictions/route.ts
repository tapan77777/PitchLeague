import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// POST /api/predictions — body: { league_id, match_id, predicted_score_a, predicted_score_b, member_id }
// No Clerk auth — member_id is a client-generated UUID stored in localStorage
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { league_id, match_id, predicted_score_a, predicted_score_b, member_id } = body

  if (!league_id || !match_id || !member_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof predicted_score_a !== 'number' || typeof predicted_score_b !== 'number') {
    return NextResponse.json({ error: 'Invalid scores' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, kickoff_time, status')
    .eq('id', match_id)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }
  if (new Date(match.kickoff_time) <= new Date()) {
    return NextResponse.json({ error: 'Predictions are locked for this match' }, { status: 403 })
  }
  if (match.status !== 'upcoming') {
    return NextResponse.json({ error: 'Match is not accepting predictions' }, { status: 403 })
  }

  const { data: memberRow } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', league_id)
    .eq('clerk_id', member_id)
    .maybeSingle()

  if (!memberRow) {
    return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
  }

  const predicted_winner =
    predicted_score_a > predicted_score_b ? 'team_a'
    : predicted_score_b > predicted_score_a ? 'team_b'
    : 'draw'

  const { data: prediction, error } = await supabase
    .from('predictions')
    .upsert(
      {
        league_id,
        match_id,
        clerk_id: member_id,
        predicted_winner,
        predicted_score_a,
        predicted_score_b,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'league_id,match_id,clerk_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Prediction error:', error)
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 })
  }

  return NextResponse.json({ prediction }, { status: 201 })
}

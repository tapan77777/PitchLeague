import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calculatePoints } from '@/lib/utils'

// POST /api/admin/results
// body: { match_id, score_a, score_b, league_id? }
// If league_id is omitted, scores ALL leagues that have predictions for this match.
export async function POST(req: NextRequest) {
  const { match_id, score_a, score_b, league_id } = await req.json()

  if (!match_id || score_a == null || score_b == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { error: matchError } = await supabase
    .from('matches')
    .update({ score_a, score_b, status: 'finished' })
    .eq('id', match_id)

  if (matchError) {
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }

  // Determine which leagues to score
  let leagueIds: string[] = league_id ? [league_id] : []
  if (!league_id) {
    const { data: allLeagues } = await supabase.from('leagues').select('id')
    leagueIds = (allLeagues ?? []).map((l: { id: string }) => l.id)
  }

  let totalPredictions = 0

  for (const lid of leagueIds) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', match_id)
      .eq('league_id', lid)

    if (!predictions || predictions.length === 0) continue

    totalPredictions += predictions.length

    const updates = predictions.map((pred) => {
      const { points, isExact, isCorrectWinner } = calculatePoints(
        pred.predicted_score_a ?? 0,
        pred.predicted_score_b ?? 0,
        score_a,
        score_b,
        pred.is_underdog_pick
      )
      return { id: pred.id, points_earned: points, is_exact_score: isExact, is_correct_winner: isCorrectWinner, clerk_id: pred.clerk_id }
    })

    for (const update of updates) {
      await supabase
        .from('predictions')
        .update({ points_earned: update.points_earned, is_exact_score: update.is_exact_score, is_correct_winner: update.is_correct_winner })
        .eq('id', update.id)

      const { data: member } = await supabase
        .from('league_members')
        .select('total_points, correct_predictions, exact_scores, current_streak, best_streak')
        .eq('league_id', lid)
        .eq('clerk_id', update.clerk_id)
        .single()

      if (member) {
        const newStreak = update.is_correct_winner || update.is_exact_score ? member.current_streak + 1 : 0
        await supabase
          .from('league_members')
          .update({
            total_points: member.total_points + update.points_earned,
            correct_predictions: member.correct_predictions + (update.is_correct_winner || update.is_exact_score ? 1 : 0),
            exact_scores: member.exact_scores + (update.is_exact_score ? 1 : 0),
            current_streak: newStreak,
            best_streak: Math.max(member.best_streak, newStreak),
          })
          .eq('league_id', lid)
          .eq('clerk_id', update.clerk_id)
      }
    }

    await supabase.rpc('update_league_ranks', { p_league_id: lid })
  }

  return NextResponse.json({ updated: totalPredictions, leagues: leagueIds.length })
}

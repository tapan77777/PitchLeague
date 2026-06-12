import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question_id, session_id, member_id, league_id, selected_option, time_taken_ms } = body

  if (!question_id || !session_id || !member_id || !selected_option) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Fetch correct answer server-side
  const { data: question, error: qErr } = await supabase
    .from('quiz_questions')
    .select('correct_option, explanation')
    .eq('id', question_id)
    .single()

  if (qErr || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const is_correct = selected_option === question.correct_option
  const points_earned = is_correct ? 0.5 : 0

  // Insert answer — UNIQUE(question_id, member_id) prevents duplicates
  const { error: insertErr } = await supabase.from('quiz_answers').insert({
    session_id, question_id, member_id,
    league_id: league_id || null,
    selected_option, is_correct, points_earned,
    time_taken_ms: time_taken_ms || null,
  })

  // Duplicate answer — return result without adding points again
  if (insertErr?.code === '23505') {
    return NextResponse.json({
      is_correct, correct_option: question.correct_option,
      explanation: question.explanation, points_earned: 0,
      already_answered: true,
    })
  }

  if (insertErr) {
    console.error('[quiz/answer]', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  console.log('Updating points for member:', member_id)

  if (is_correct) {
    // Get all leagues this member is in
    const { data: memberships } = await supabase
      .from('league_members')
      .select('id, league_id, total_points')
      .eq('clerk_id', member_id)

    console.log('Memberships found:', memberships?.length)

    for (const membership of memberships ?? []) {
      await supabase
        .from('league_members')
        .update({ total_points: (membership.total_points ?? 0) + 0.5 })
        .eq('id', membership.id)
    }

    console.log('Points updated: +0.5')
  } else {
    console.log('Points updated: 0')
  }

  return NextResponse.json({
    is_correct, correct_option: question.correct_option,
    explanation: question.explanation, points_earned,
  })
}

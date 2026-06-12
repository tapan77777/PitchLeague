import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-superadmin-key') === process.env.SUPERADMIN_KEY
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions, error } = await supabase
    .from('quiz_sessions')
    .select('*, quiz_questions(id, question_number, question)')
    .gte('session_date', today)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch answer counts per session
  const sessionIds = (sessions ?? []).map(s => s.id)
  const answerCounts: Record<string, number> = {}
  if (sessionIds.length > 0) {
    const { data: answers } = await supabase
      .from('quiz_answers')
      .select('session_id')
      .in('session_id', sessionIds)
    for (const a of answers ?? []) {
      answerCounts[a.session_id] = (answerCounts[a.session_id] ?? 0) + 1
    }
  }

  return NextResponse.json({
    sessions: (sessions ?? []).map(s => ({ ...s, answerCount: answerCounts[s.id] ?? 0 }))
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { session_date, session_type, questions } = body

  if (!session_date || !session_type || !questions?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: session, error: sErr } = await supabase
    .from('quiz_sessions')
    .insert({ session_date, session_type, status: 'active' })
    .select()
    .single()

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qs = questions.map((q: any, i: number) => ({
    session_id: session.id,
    question_number: i + 1,
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_option: q.correct_option,
    explanation: q.explanation || null,
    category: q.category || 'general',
  }))

  const { error: qErr } = await supabase.from('quiz_questions').insert(qs)
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  const { count: leagueCount } = await supabase
    .from('leagues')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return NextResponse.json({ session, leagueCount: leagueCount ?? 0 })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, status } = await req.json()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('quiz_sessions')
    .update({ status })
    .eq('id', session_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

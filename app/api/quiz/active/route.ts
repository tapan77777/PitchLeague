import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  const today = new Date().toISOString().split('T')[0]
  console.log('Fetching quiz for date:', today)

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('status', 'active')
    .lte('session_date', today)
    .order('session_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log('Session found:', session, 'Error:', error)

  if (!session) {
    return NextResponse.json({ session: null })
  }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_number, question, option_a, option_b, option_c, option_d, category')
    .eq('session_id', session.id)
    .order('question_number', { ascending: true })

  console.log('Questions found:', questions?.length)

  return NextResponse.json({
    session: {
      ...session,
      questions: questions || [],
    },
  })
}

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*, quiz_questions(*)')
    .eq('session_date', today)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[quiz/active]', error)
    return NextResponse.json({ session: null })
  }

  const session = data?.[0] ?? null
  if (!session) return NextResponse.json({ session: null })

  // Sort questions and strip correct_option before sending to client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = ((session.quiz_questions as any[]) ?? [])
    .sort((a, b) => a.question_number - b.question_number)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ correct_option, ...q }) => q)

  return NextResponse.json({ session: { ...session, quiz_questions: questions } })
}

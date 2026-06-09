// ============================================
// PITCHLEAGUE — TypeScript Types
// ============================================

export type LeaguePlan = 'starter' | 'growth' | 'premium'
export type MatchStatus = 'upcoming' | 'live' | 'finished'
export type MatchStage = 'group' | 'round_of_32' | 'quarterfinal' | 'semifinal' | 'final'

export interface League {
  id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  primary_color: string
  accent_color: string
  welcome_message?: string
  admin_clerk_id: string
  is_active: boolean
  is_public: boolean
  invite_code: string
  plan: LeaguePlan
  max_members: number
  created_at: string
  updated_at: string
  // Joined fields
  member_count?: number
}

export interface LeagueMember {
  id: string
  league_id: string
  clerk_id: string
  display_name: string
  avatar_url?: string
  total_points: number
  correct_predictions: number
  exact_scores: number
  current_streak: number
  best_streak: number
  rank: number
  joined_at: string
  // Joined fields
  badges?: Badge[]
}

export interface Match {
  id: string
  match_number: number
  stage: MatchStage
  group_name?: string
  team_a: string
  team_b: string
  team_a_flag?: string
  team_b_flag?: string
  kickoff_time: string
  venue?: string
  city?: string
  score_a?: number
  score_b?: number
  status: MatchStatus
  created_at: string
  // Joined
  user_prediction?: Prediction
}

export interface Prediction {
  id: string
  league_id: string
  match_id: string
  clerk_id: string
  predicted_winner?: string
  predicted_score_a?: number
  predicted_score_b?: number
  points_earned: number
  is_correct_winner?: boolean
  is_exact_score?: boolean
  is_underdog_pick: boolean
  submitted_at: string
}

export interface Badge {
  id: string
  league_id: string
  clerk_id: string
  badge_type: BadgeType
  badge_label: string
  badge_emoji: string
  earned_at: string
}

export type BadgeType =
  | 'on_fire'           // 3 correct in a row
  | 'sniper'            // 3 exact scores
  | 'underdog_hunter'   // 2 correct underdog picks
  | 'perfect_round'     // All correct in a round
  | 'early_bird'        // Predicted within 1hr of match creation
  | 'top_3'             // Reached top 3 on leaderboard

export interface LeaderboardEntry {
  rank: number
  clerk_id: string
  display_name: string
  avatar_url?: string
  total_points: number
  correct_predictions: number
  exact_scores: number
  current_streak: number
  badges: Badge[]
}

// For the admin branding panel
export interface LeagueBranding {
  name: string
  description?: string
  welcome_message?: string
  primary_color: string
  accent_color: string
  logo_url?: string
}

// Shareable card data
export interface ShareCardData {
  league_name: string
  league_logo?: string
  primary_color: string
  user_name: string
  team_a: string
  team_b: string
  team_a_flag?: string
  team_b_flag?: string
  predicted_winner: string
  predicted_score_a?: number
  predicted_score_b?: number
  user_rank: number
  total_members: number
  invite_url: string
}

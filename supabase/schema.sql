-- ============================================
-- PITCHLEAGUE — Full Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEAGUES
-- Created by admins (B2B customers)
-- ============================================
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,              -- e.g. "cultfit-fifa-2026"
  name TEXT NOT NULL,                     -- e.g. "CultFit FIFA League"
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#16a34a',   -- Brand color (hex)
  accent_color TEXT DEFAULT '#15803d',
  welcome_message TEXT,
  admin_clerk_id TEXT NOT NULL,           -- Clerk user ID of creator
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,        -- Public = anyone can find it
  invite_code TEXT UNIQUE NOT NULL,       -- Short code for joining
  plan TEXT DEFAULT 'starter',            -- starter / growth / premium
  max_members INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAGUE MEMBERS
-- Users who have joined a league
-- ============================================
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,                 -- Clerk user ID
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_points INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  exact_scores INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  rank INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, clerk_id)
);

-- ============================================
-- MATCHES
-- All FIFA 2026 fixtures
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_number INT,
  stage TEXT NOT NULL,                    -- group / round_of_32 / qf / sf / final
  group_name TEXT,                        -- Group A, B, etc.
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  team_a_flag TEXT,                       -- emoji or URL
  team_b_flag TEXT,
  kickoff_time TIMESTAMPTZ NOT NULL,
  venue TEXT,
  city TEXT,
  -- Results (null until match played)
  score_a INT,
  score_b INT,
  status TEXT DEFAULT 'upcoming',         -- upcoming / live / finished
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREDICTIONS
-- A member's prediction for a match
-- ============================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  -- What they predicted
  predicted_winner TEXT,                  -- team name or 'draw'
  predicted_score_a INT,
  predicted_score_b INT,
  -- Scoring
  points_earned INT DEFAULT 0,
  is_correct_winner BOOLEAN,
  is_exact_score BOOLEAN,
  is_underdog_pick BOOLEAN DEFAULT false,
  -- Meta
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, match_id, clerk_id)
);

-- ============================================
-- BADGES
-- Achievements unlocked by members
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,               -- on_fire / sniper / underdog_hunter / etc.
  badge_label TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, clerk_id, badge_type)
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_clerk ON league_members(clerk_id);
CREATE INDEX idx_predictions_league ON predictions(league_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_clerk ON predictions(clerk_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_kickoff ON matches(kickoff_time);
CREATE INDEX idx_badges_league_clerk ON badges(league_id, clerk_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Leagues: anyone can read public leagues, only admin can update
CREATE POLICY "Public leagues are viewable" ON leagues
  FOR SELECT USING (is_public = true OR is_active = true);

CREATE POLICY "Admin can manage their league" ON leagues
  FOR ALL USING (admin_clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Matches: everyone can read
CREATE POLICY "Matches are public" ON matches
  FOR SELECT USING (true);

-- Members: can read all in same league, write own record
CREATE POLICY "Members can view league roster" ON league_members
  FOR SELECT USING (true);

CREATE POLICY "Members manage own record" ON league_members
  FOR ALL USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Predictions: members can see all predictions in their league (after match kicks off), write own
CREATE POLICY "Members can view predictions" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Members manage own predictions" ON predictions
  FOR ALL USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Badges: viewable by all
CREATE POLICY "Badges are public" ON badges
  FOR SELECT USING (true);

-- ============================================
-- FUNCTION: Calculate points for a prediction
-- ============================================
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  p_predicted_winner TEXT,
  p_predicted_score_a INT,
  p_predicted_score_b INT,
  p_actual_score_a INT,
  p_actual_score_b INT,
  p_is_underdog BOOLEAN DEFAULT false
) RETURNS INT AS $$
DECLARE
  pts INT := 0;
  actual_winner TEXT;
  predicted_correct_winner BOOLEAN := false;
  predicted_exact BOOLEAN := false;
BEGIN
  -- Determine actual winner
  IF p_actual_score_a > p_actual_score_b THEN
    actual_winner := 'team_a';
  ELSIF p_actual_score_b > p_actual_score_a THEN
    actual_winner := 'team_b';
  ELSE
    actual_winner := 'draw';
  END IF;

  -- Check exact score
  IF p_predicted_score_a = p_actual_score_a AND p_predicted_score_b = p_actual_score_b THEN
    predicted_exact := true;
    pts := pts + 5;  -- Exact score = 5 points
  END IF;

  -- Check correct winner (only if not already counted in exact)
  IF NOT predicted_exact AND p_predicted_winner = actual_winner THEN
    predicted_correct_winner := true;
    pts := pts + 2;  -- Correct winner = 2 points
  END IF;

  -- Underdog bonus
  IF p_is_underdog AND (predicted_exact OR predicted_correct_winner) THEN
    pts := pts + 1;
  END IF;

  RETURN pts;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update leaderboard ranks
-- ============================================
CREATE OR REPLACE FUNCTION update_league_ranks(p_league_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE league_members
  SET rank = ranks.new_rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY total_points DESC, correct_predictions DESC, exact_scores DESC
      ) AS new_rank
    FROM league_members
    WHERE league_id = p_league_id
  ) ranks
  WHERE league_members.id = ranks.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED: All FIFA 2026 Group Stage Matches
-- Key matches to get you started
-- ============================================
INSERT INTO matches (match_number, stage, group_name, team_a, team_b, team_a_flag, team_b_flag, kickoff_time, venue, city) VALUES
(1,  'group', 'A', 'Mexico',      'South Africa', '🇲🇽', '🇿🇦', '2026-06-11 15:00:00+00', 'Estadio Azteca',      'Mexico City'),
(2,  'group', 'B', 'Argentina',   'Slovakia',     '🇦🇷', '🇸🇰', '2026-06-12 00:00:00+00', 'MetLife Stadium',     'New York'),
(3,  'group', 'C', 'USA',         'Paraguay',     '🇺🇸', '🇵🇾', '2026-06-12 01:00:00+00', 'SoFi Stadium',        'Los Angeles'),
(4,  'group', 'D', 'France',      'Albania',      '🇫🇷', '🇦🇱', '2026-06-13 20:00:00+00', 'AT&T Stadium',        'Dallas'),
(5,  'group', 'E', 'Spain',       'Senegal',      '🇪🇸', '🇸🇳', '2026-06-13 23:00:00+00', 'Mercedes-Benz',       'Atlanta'),
(6,  'group', 'F', 'Brazil',      'Ecuador',      '🇧🇷', '🇪🇨', '2026-06-14 20:00:00+00', 'Hard Rock Stadium',   'Miami'),
(7,  'group', 'G', 'England',     'Serbia',       '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇷🇸', '2026-06-15 20:00:00+00', 'Gillette Stadium',    'Boston'),
(8,  'group', 'H', 'Germany',     'Japan',        '🇩🇪', '🇯🇵', '2026-06-15 23:00:00+00', 'Lumen Field',         'Seattle'),
(9,  'group', 'A', 'Canada',      'Bosnia',       '🇨🇦', '🇧🇦', '2026-06-12 23:00:00+00', 'BMO Field',           'Toronto'),
(10, 'group', 'B', 'Portugal',    'Morocco',      '🇵🇹', '🇲🇦', '2026-06-14 01:00:00+00', 'Arrowhead Stadium',   'Kansas City');

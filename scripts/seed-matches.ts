import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim()
  process.env[key] = val
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Match {
  match_number: number
  stage: string
  group_name: string
  team_a: string
  team_b: string
  team_a_flag: string
  team_b_flag: string
  kickoff_time: string
  venue: string
  city: string
  status: string
}

const matches: Match[] = [
  // ── GROUP A: Mexico, Ecuador, Venezuela, Jamaica ──
  { match_number: 1,  stage: 'group', group_name: 'Group A', team_a: 'Mexico',    team_b: 'Ecuador',    team_a_flag: '🇲🇽', team_b_flag: '🇪🇨', kickoff_time: '2026-06-11T20:00:00Z', venue: 'Estadio Azteca',             city: 'Mexico City',  status: 'upcoming' },
  { match_number: 2,  stage: 'group', group_name: 'Group A', team_a: 'Venezuela', team_b: 'Jamaica',    team_a_flag: '🇻🇪', team_b_flag: '🇯🇲', kickoff_time: '2026-06-12T00:00:00Z', venue: 'Estadio Akron',              city: 'Guadalajara',  status: 'upcoming' },
  { match_number: 3,  stage: 'group', group_name: 'Group A', team_a: 'Mexico',    team_b: 'Venezuela',  team_a_flag: '🇲🇽', team_b_flag: '🇻🇪', kickoff_time: '2026-06-17T20:00:00Z', venue: 'Estadio BBVA',               city: 'Monterrey',    status: 'upcoming' },
  { match_number: 4,  stage: 'group', group_name: 'Group A', team_a: 'Ecuador',   team_b: 'Jamaica',    team_a_flag: '🇪🇨', team_b_flag: '🇯🇲', kickoff_time: '2026-06-17T23:00:00Z', venue: 'Estadio Azteca',             city: 'Mexico City',  status: 'upcoming' },
  { match_number: 5,  stage: 'group', group_name: 'Group A', team_a: 'Ecuador',   team_b: 'Venezuela',  team_a_flag: '🇪🇨', team_b_flag: '🇻🇪', kickoff_time: '2026-06-21T22:00:00Z', venue: 'Estadio Akron',              city: 'Guadalajara',  status: 'upcoming' },
  { match_number: 6,  stage: 'group', group_name: 'Group A', team_a: 'Jamaica',   team_b: 'Mexico',     team_a_flag: '🇯🇲', team_b_flag: '🇲🇽', kickoff_time: '2026-06-21T22:00:00Z', venue: 'Estadio BBVA',               city: 'Monterrey',    status: 'upcoming' },

  // ── GROUP B: USA, Panama, Ukraine, Albania ──
  { match_number: 7,  stage: 'group', group_name: 'Group B', team_a: 'USA',       team_b: 'Panama',     team_a_flag: '🇺🇸', team_b_flag: '🇵🇦', kickoff_time: '2026-06-12T23:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 8,  stage: 'group', group_name: 'Group B', team_a: 'Ukraine',   team_b: 'Albania',    team_a_flag: '🇺🇦', team_b_flag: '🇦🇱', kickoff_time: '2026-06-13T02:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },
  { match_number: 9,  stage: 'group', group_name: 'Group B', team_a: 'USA',       team_b: 'Ukraine',    team_a_flag: '🇺🇸', team_b_flag: '🇺🇦', kickoff_time: '2026-06-18T00:00:00Z', venue: 'AT&T Stadium',               city: 'Dallas',       status: 'upcoming' },
  { match_number: 10, stage: 'group', group_name: 'Group B', team_a: 'Panama',    team_b: 'Albania',    team_a_flag: '🇵🇦', team_b_flag: '🇦🇱', kickoff_time: '2026-06-18T00:00:00Z', venue: 'Lincoln Financial Field',    city: 'Philadelphia', status: 'upcoming' },
  { match_number: 11, stage: 'group', group_name: 'Group B', team_a: 'Panama',    team_b: 'Ukraine',    team_a_flag: '🇵🇦', team_b_flag: '🇺🇦', kickoff_time: '2026-06-22T22:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 12, stage: 'group', group_name: 'Group B', team_a: 'Albania',   team_b: 'USA',        team_a_flag: '🇦🇱', team_b_flag: '🇺🇸', kickoff_time: '2026-06-22T22:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },

  // ── GROUP C: Canada, Chile, Morocco, Saudi Arabia ──
  { match_number: 13, stage: 'group', group_name: 'Group C', team_a: 'Canada',       team_b: 'Chile',        team_a_flag: '🇨🇦', team_b_flag: '🇨🇱', kickoff_time: '2026-06-13T20:00:00Z', venue: 'BC Place',                   city: 'Vancouver',    status: 'upcoming' },
  { match_number: 14, stage: 'group', group_name: 'Group C', team_a: 'Morocco',      team_b: 'Saudi Arabia', team_a_flag: '🇲🇦', team_b_flag: '🇸🇦', kickoff_time: '2026-06-13T23:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 15, stage: 'group', group_name: 'Group C', team_a: 'Canada',       team_b: 'Morocco',      team_a_flag: '🇨🇦', team_b_flag: '🇲🇦', kickoff_time: '2026-06-18T23:00:00Z', venue: 'Lumen Field',                city: 'Seattle',      status: 'upcoming' },
  { match_number: 16, stage: 'group', group_name: 'Group C', team_a: 'Chile',        team_b: 'Saudi Arabia', team_a_flag: '🇨🇱', team_b_flag: '🇸🇦', kickoff_time: '2026-06-19T02:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 17, stage: 'group', group_name: 'Group C', team_a: 'Chile',        team_b: 'Morocco',      team_a_flag: '🇨🇱', team_b_flag: '🇲🇦', kickoff_time: '2026-06-23T22:00:00Z', venue: 'BC Place',                   city: 'Vancouver',    status: 'upcoming' },
  { match_number: 18, stage: 'group', group_name: 'Group C', team_a: 'Saudi Arabia', team_b: 'Canada',       team_a_flag: '🇸🇦', team_b_flag: '🇨🇦', kickoff_time: '2026-06-23T22:00:00Z', venue: 'Lumen Field',                city: 'Seattle',      status: 'upcoming' },

  // ── GROUP D: Argentina, Peru, Croatia, Senegal ──
  { match_number: 19, stage: 'group', group_name: 'Group D', team_a: 'Argentina', team_b: 'Peru',      team_a_flag: '🇦🇷', team_b_flag: '🇵🇪', kickoff_time: '2026-06-14T00:00:00Z', venue: 'Gillette Stadium',           city: 'Boston',       status: 'upcoming' },
  { match_number: 20, stage: 'group', group_name: 'Group D', team_a: 'Croatia',   team_b: 'Senegal',   team_a_flag: '🇭🇷', team_b_flag: '🇸🇳', kickoff_time: '2026-06-14T20:00:00Z', venue: 'Arrowhead Stadium',          city: 'Kansas City',  status: 'upcoming' },
  { match_number: 21, stage: 'group', group_name: 'Group D', team_a: 'Argentina', team_b: 'Croatia',   team_a_flag: '🇦🇷', team_b_flag: '🇭🇷', kickoff_time: '2026-06-19T23:00:00Z', venue: 'SoFi Stadium',               city: 'Los Angeles',  status: 'upcoming' },
  { match_number: 22, stage: 'group', group_name: 'Group D', team_a: 'Peru',      team_b: 'Senegal',   team_a_flag: '🇵🇪', team_b_flag: '🇸🇳', kickoff_time: '2026-06-20T02:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 23, stage: 'group', group_name: 'Group D', team_a: 'Peru',      team_b: 'Croatia',   team_a_flag: '🇵🇪', team_b_flag: '🇭🇷', kickoff_time: '2026-06-24T22:00:00Z', venue: 'Gillette Stadium',           city: 'Boston',       status: 'upcoming' },
  { match_number: 24, stage: 'group', group_name: 'Group D', team_a: 'Senegal',   team_b: 'Argentina', team_a_flag: '🇸🇳', team_b_flag: '🇦🇷', kickoff_time: '2026-06-24T22:00:00Z', venue: 'Arrowhead Stadium',          city: 'Kansas City',  status: 'upcoming' },

  // ── GROUP E: Brazil, Colombia, Japan, New Zealand ──
  { match_number: 25, stage: 'group', group_name: 'Group E', team_a: 'Brazil',      team_b: 'Colombia',     team_a_flag: '🇧🇷', team_b_flag: '🇨🇴', kickoff_time: '2026-06-14T23:00:00Z', venue: 'AT&T Stadium',               city: 'Dallas',       status: 'upcoming' },
  { match_number: 26, stage: 'group', group_name: 'Group E', team_a: 'Japan',       team_b: 'New Zealand',  team_a_flag: '🇯🇵', team_b_flag: '🇳🇿', kickoff_time: '2026-06-15T02:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },
  { match_number: 27, stage: 'group', group_name: 'Group E', team_a: 'Brazil',      team_b: 'Japan',        team_a_flag: '🇧🇷', team_b_flag: '🇯🇵', kickoff_time: '2026-06-20T22:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 28, stage: 'group', group_name: 'Group E', team_a: 'Colombia',    team_b: 'New Zealand',  team_a_flag: '🇨🇴', team_b_flag: '🇳🇿', kickoff_time: '2026-06-21T02:00:00Z', venue: 'SoFi Stadium',               city: 'Los Angeles',  status: 'upcoming' },
  { match_number: 29, stage: 'group', group_name: 'Group E', team_a: 'Colombia',    team_b: 'Japan',        team_a_flag: '🇨🇴', team_b_flag: '🇯🇵', kickoff_time: '2026-06-25T22:00:00Z', venue: 'AT&T Stadium',               city: 'Dallas',       status: 'upcoming' },
  { match_number: 30, stage: 'group', group_name: 'Group E', team_a: 'New Zealand', team_b: 'Brazil',       team_a_flag: '🇳🇿', team_b_flag: '🇧🇷', kickoff_time: '2026-06-25T22:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },

  // ── GROUP F: France, South Korea, Australia, Egypt ──
  { match_number: 31, stage: 'group', group_name: 'Group F', team_a: 'France',      team_b: 'South Korea', team_a_flag: '🇫🇷', team_b_flag: '🇰🇷', kickoff_time: '2026-06-15T22:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },
  { match_number: 32, stage: 'group', group_name: 'Group F', team_a: 'Australia',   team_b: 'Egypt',       team_a_flag: '🇦🇺', team_b_flag: '🇪🇬', kickoff_time: '2026-06-16T02:00:00Z', venue: 'Arrowhead Stadium',          city: 'Kansas City',  status: 'upcoming' },
  { match_number: 33, stage: 'group', group_name: 'Group F', team_a: 'France',      team_b: 'Australia',   team_a_flag: '🇫🇷', team_b_flag: '🇦🇺', kickoff_time: '2026-06-21T20:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 34, stage: 'group', group_name: 'Group F', team_a: 'South Korea', team_b: 'Egypt',       team_a_flag: '🇰🇷', team_b_flag: '🇪🇬', kickoff_time: '2026-06-21T23:00:00Z', venue: 'Lumen Field',                city: 'Seattle',      status: 'upcoming' },
  { match_number: 35, stage: 'group', group_name: 'Group F', team_a: 'South Korea', team_b: 'Australia',   team_a_flag: '🇰🇷', team_b_flag: '🇦🇺', kickoff_time: '2026-06-26T02:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },
  { match_number: 36, stage: 'group', group_name: 'Group F', team_a: 'Egypt',       team_b: 'France',      team_a_flag: '🇪🇬', team_b_flag: '🇫🇷', kickoff_time: '2026-06-26T02:00:00Z', venue: 'Arrowhead Stadium',          city: 'Kansas City',  status: 'upcoming' },

  // ── GROUP G: Germany, Switzerland, Nigeria, Costa Rica ──
  { match_number: 37, stage: 'group', group_name: 'Group G', team_a: 'Germany',     team_b: 'Switzerland', team_a_flag: '🇩🇪', team_b_flag: '🇨🇭', kickoff_time: '2026-06-16T23:00:00Z', venue: 'Lincoln Financial Field',    city: 'Philadelphia', status: 'upcoming' },
  { match_number: 38, stage: 'group', group_name: 'Group G', team_a: 'Nigeria',     team_b: 'Costa Rica',  team_a_flag: '🇳🇬', team_b_flag: '🇨🇷', kickoff_time: '2026-06-17T02:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },
  { match_number: 39, stage: 'group', group_name: 'Group G', team_a: 'Germany',     team_b: 'Nigeria',     team_a_flag: '🇩🇪', team_b_flag: '🇳🇬', kickoff_time: '2026-06-22T00:00:00Z', venue: 'AT&T Stadium',               city: 'Dallas',       status: 'upcoming' },
  { match_number: 40, stage: 'group', group_name: 'Group G', team_a: 'Switzerland', team_b: 'Costa Rica',  team_a_flag: '🇨🇭', team_b_flag: '🇨🇷', kickoff_time: '2026-06-22T00:00:00Z', venue: 'Gillette Stadium',           city: 'Boston',       status: 'upcoming' },
  { match_number: 41, stage: 'group', group_name: 'Group G', team_a: 'Switzerland', team_b: 'Nigeria',     team_a_flag: '🇨🇭', team_b_flag: '🇳🇬', kickoff_time: '2026-06-26T22:00:00Z', venue: 'Lincoln Financial Field',    city: 'Philadelphia', status: 'upcoming' },
  { match_number: 42, stage: 'group', group_name: 'Group G', team_a: 'Costa Rica',  team_b: 'Germany',     team_a_flag: '🇨🇷', team_b_flag: '🇩🇪', kickoff_time: '2026-06-26T22:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },

  // ── GROUP H: Spain, Portugal, Turkey, Ivory Coast ──
  { match_number: 43, stage: 'group', group_name: 'Group H', team_a: 'Spain',       team_b: 'Portugal',     team_a_flag: '🇪🇸', team_b_flag: '🇵🇹', kickoff_time: '2026-06-16T20:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 44, stage: 'group', group_name: 'Group H', team_a: 'Turkey',      team_b: 'Ivory Coast',  team_a_flag: '🇹🇷', team_b_flag: '🇨🇮', kickoff_time: '2026-06-17T00:00:00Z', venue: 'BC Place',                   city: 'Vancouver',    status: 'upcoming' },
  { match_number: 45, stage: 'group', group_name: 'Group H', team_a: 'Spain',       team_b: 'Turkey',       team_a_flag: '🇪🇸', team_b_flag: '🇹🇷', kickoff_time: '2026-06-22T20:00:00Z', venue: 'SoFi Stadium',               city: 'Los Angeles',  status: 'upcoming' },
  { match_number: 46, stage: 'group', group_name: 'Group H', team_a: 'Portugal',    team_b: 'Ivory Coast',  team_a_flag: '🇵🇹', team_b_flag: '🇨🇮', kickoff_time: '2026-06-22T23:00:00Z', venue: 'BC Place',                   city: 'Vancouver',    status: 'upcoming' },
  { match_number: 47, stage: 'group', group_name: 'Group H', team_a: 'Portugal',    team_b: 'Turkey',       team_a_flag: '🇵🇹', team_b_flag: '🇹🇷', kickoff_time: '2026-06-27T02:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 48, stage: 'group', group_name: 'Group H', team_a: 'Ivory Coast', team_b: 'Spain',        team_a_flag: '🇨🇮', team_b_flag: '🇪🇸', kickoff_time: '2026-06-27T02:00:00Z', venue: 'SoFi Stadium',               city: 'Los Angeles',  status: 'upcoming' },

  // ── GROUP I: England, Netherlands, Poland, Bolivia ──
  { match_number: 49, stage: 'group', group_name: 'Group I', team_a: 'England',     team_b: 'Netherlands', team_a_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team_b_flag: '🇳🇱', kickoff_time: '2026-06-15T20:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },
  { match_number: 50, stage: 'group', group_name: 'Group I', team_a: 'Poland',      team_b: 'Bolivia',     team_a_flag: '🇵🇱', team_b_flag: '🇧🇴', kickoff_time: '2026-06-16T00:00:00Z', venue: 'NRG Stadium',                city: 'Houston',      status: 'upcoming' },
  { match_number: 51, stage: 'group', group_name: 'Group I', team_a: 'England',     team_b: 'Poland',      team_a_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team_b_flag: '🇵🇱', kickoff_time: '2026-06-20T23:00:00Z', venue: 'Gillette Stadium',           city: 'Boston',       status: 'upcoming' },
  { match_number: 52, stage: 'group', group_name: 'Group I', team_a: 'Netherlands', team_b: 'Bolivia',     team_a_flag: '🇳🇱', team_b_flag: '🇧🇴', kickoff_time: '2026-06-21T02:00:00Z', venue: 'Lumen Field',                city: 'Seattle',      status: 'upcoming' },
  { match_number: 53, stage: 'group', group_name: 'Group I', team_a: 'Netherlands', team_b: 'Poland',      team_a_flag: '🇳🇱', team_b_flag: '🇵🇱', kickoff_time: '2026-06-25T02:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },
  { match_number: 54, stage: 'group', group_name: 'Group I', team_a: 'Bolivia',     team_b: 'England',     team_a_flag: '🇧🇴', team_b_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff_time: '2026-06-25T02:00:00Z', venue: 'NRG Stadium',                city: 'Houston',      status: 'upcoming' },

  // ── GROUP J: Belgium, Uruguay, Iran, Cameroon ──
  { match_number: 55, stage: 'group', group_name: 'Group J', team_a: 'Belgium',   team_b: 'Uruguay',   team_a_flag: '🇧🇪', team_b_flag: '🇺🇾', kickoff_time: '2026-06-16T22:00:00Z', venue: 'Lincoln Financial Field',    city: 'Philadelphia', status: 'upcoming' },
  { match_number: 56, stage: 'group', group_name: 'Group J', team_a: 'Iran',      team_b: 'Cameroon',  team_a_flag: '🇮🇷', team_b_flag: '🇨🇲', kickoff_time: '2026-06-17T22:00:00Z', venue: 'Arrowhead Stadium',          city: 'Kansas City',  status: 'upcoming' },
  { match_number: 57, stage: 'group', group_name: 'Group J', team_a: 'Belgium',   team_b: 'Iran',      team_a_flag: '🇧🇪', team_b_flag: '🇮🇷', kickoff_time: '2026-06-23T00:00:00Z', venue: 'SoFi Stadium',               city: 'Los Angeles',  status: 'upcoming' },
  { match_number: 58, stage: 'group', group_name: 'Group J', team_a: 'Uruguay',   team_b: 'Cameroon',  team_a_flag: '🇺🇾', team_b_flag: '🇨🇲', kickoff_time: '2026-06-23T00:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },
  { match_number: 59, stage: 'group', group_name: 'Group J', team_a: 'Uruguay',   team_b: 'Iran',      team_a_flag: '🇺🇾', team_b_flag: '🇮🇷', kickoff_time: '2026-06-27T22:00:00Z', venue: 'Lincoln Financial Field',    city: 'Philadelphia', status: 'upcoming' },
  { match_number: 60, stage: 'group', group_name: 'Group J', team_a: 'Cameroon',  team_b: 'Belgium',   team_a_flag: '🇨🇲', team_b_flag: '🇧🇪', kickoff_time: '2026-06-27T22:00:00Z', venue: 'Hard Rock Stadium',          city: 'Miami',        status: 'upcoming' },

  // ── GROUP K: Italy, Austria, Paraguay, DR Congo ──
  { match_number: 61, stage: 'group', group_name: 'Group K', team_a: 'Italy',    team_b: 'Austria',   team_a_flag: '🇮🇹', team_b_flag: '🇦🇹', kickoff_time: '2026-06-18T20:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 62, stage: 'group', group_name: 'Group K', team_a: 'Paraguay', team_b: 'DR Congo',  team_a_flag: '🇵🇾', team_b_flag: '🇨🇩', kickoff_time: '2026-06-18T23:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },
  { match_number: 63, stage: 'group', group_name: 'Group K', team_a: 'Italy',    team_b: 'Paraguay',  team_a_flag: '🇮🇹', team_b_flag: '🇵🇾', kickoff_time: '2026-06-24T00:00:00Z', venue: 'AT&T Stadium',               city: 'Dallas',       status: 'upcoming' },
  { match_number: 64, stage: 'group', group_name: 'Group K', team_a: 'Austria',  team_b: 'DR Congo',  team_a_flag: '🇦🇹', team_b_flag: '🇨🇩', kickoff_time: '2026-06-24T00:00:00Z', venue: 'Mercedes-Benz Stadium',      city: 'Atlanta',      status: 'upcoming' },
  { match_number: 65, stage: 'group', group_name: 'Group K', team_a: 'Austria',  team_b: 'Paraguay',  team_a_flag: '🇦🇹', team_b_flag: '🇵🇾', kickoff_time: '2026-06-28T22:00:00Z', venue: 'MetLife Stadium',            city: 'New York',     status: 'upcoming' },
  { match_number: 66, stage: 'group', group_name: 'Group K', team_a: 'DR Congo', team_b: 'Italy',     team_a_flag: '🇨🇩', team_b_flag: '🇮🇹', kickoff_time: '2026-06-28T22:00:00Z', venue: 'Levi\'s Stadium',            city: 'San Francisco',status: 'upcoming' },

  // ── GROUP L: Serbia, Denmark, South Africa, Honduras ──
  { match_number: 67, stage: 'group', group_name: 'Group L', team_a: 'Serbia',       team_b: 'Denmark',      team_a_flag: '🇷🇸', team_b_flag: '🇩🇰', kickoff_time: '2026-06-19T20:00:00Z', venue: 'BMO Field',                  city: 'Toronto',      status: 'upcoming' },
  { match_number: 68, stage: 'group', group_name: 'Group L', team_a: 'South Africa', team_b: 'Honduras',     team_a_flag: '🇿🇦', team_b_flag: '🇭🇳', kickoff_time: '2026-06-20T00:00:00Z', venue: 'BC Place',                   city: 'Vancouver',    status: 'upcoming' },
  { match_number: 69, stage: 'group', group_name: 'Group L', team_a: 'Serbia',       team_b: 'South Africa', team_a_flag: '🇷🇸', team_b_flag: '🇿🇦', kickoff_time: '2026-06-25T20:00:00Z', venue: 'Gillette Stadium',           city: 'Boston',       status: 'upcoming' },
  { match_number: 70, stage: 'group', group_name: 'Group L', team_a: 'Denmark',      team_b: 'Honduras',     team_a_flag: '🇩🇰', team_b_flag: '🇭🇳', kickoff_time: '2026-06-26T00:00:00Z', venue: 'NRG Stadium',                city: 'Houston',      status: 'upcoming' },
  { match_number: 71, stage: 'group', group_name: 'Group L', team_a: 'Denmark',      team_b: 'Serbia',       team_a_flag: '🇩🇰', team_b_flag: '🇷🇸', kickoff_time: '2026-06-29T22:00:00Z', venue: 'BMO Field',                  city: 'Toronto',      status: 'upcoming' },
  { match_number: 72, stage: 'group', group_name: 'Group L', team_a: 'Honduras',     team_b: 'South Africa', team_a_flag: '🇭🇳', team_b_flag: '🇿🇦', kickoff_time: '2026-06-29T22:00:00Z', venue: 'NRG Stadium',                city: 'Houston',      status: 'upcoming' },
]

async function seed() {
  console.log(`Seeding ${matches.length} group stage matches...`)

  // Clear existing group stage matches first
  const { error: delErr } = await supabase
    .from('matches')
    .delete()
    .eq('stage', 'group')

  if (delErr) {
    console.error('Failed to clear existing matches:', delErr.message)
    process.exit(1)
  }

  const { data, error } = await supabase
    .from('matches')
    .insert(matches)
    .select('id')

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ Inserted ${data?.length ?? 0} group stage matches`)
}

seed()

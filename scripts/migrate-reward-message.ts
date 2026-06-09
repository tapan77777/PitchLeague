import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('='); if (eq === -1) continue
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function migrate() {
  // Supabase REST API doesn't support raw DDL — use the rpc or update a dummy row to trigger column add
  // We'll use the management API approach via supabase-js v2 schema introspection workaround:
  // Just insert a null update which will fail if column missing, confirming we need to add it manually
  // Instead, test with a select and report the SQL to run
  const { error } = await supabase.from('leagues').select('reward_message').limit(1)
  if (error) {
    console.log('\n⚠️  reward_message column is missing.')
    console.log('Run this SQL in your Supabase dashboard → SQL Editor:\n')
    console.log('  ALTER TABLE leagues ADD COLUMN IF NOT EXISTS reward_message TEXT;\n')
  } else {
    console.log('✅ reward_message column already exists.')
  }
}

migrate()

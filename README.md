# ⚽ PitchLeague
### White-label FIFA 2026 prediction leagues for cafes, turfs, companies & communities

---

## What This Is
A B2B SaaS where businesses (cafes, turfs, companies, HR teams) pay to get their own
branded prediction league — "CultFit FIFA League", "Blue Tokai World Cup Picks", etc.
Members join via invite link, predict match scores, compete on a leaderboard.

**Your revenue:** Charge ₹999–₹4,999 per league setup. Target Bengaluru businesses NOW.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Auth:** Clerk
- **Database:** Supabase (Postgres + Realtime)
- **Styling:** Tailwind CSS (dark mode, mobile-first)
- **Deploy:** Vercel

---

## Day-by-Day Build Plan

### Day 1 — Foundation (TODAY)
- [ ] `npx create-next-app@latest pitchleague`
- [ ] Install deps: `npm install @clerk/nextjs @supabase/supabase-js lucide-react html2canvas`
- [ ] Copy `.env.example` → `.env.local`, fill in Clerk + Supabase keys
- [ ] Run `supabase/schema.sql` in your Supabase SQL editor
- [ ] Copy all files from this scaffold into your project
- [ ] Test: `npm run dev` → should show default Next.js page

### Day 2 — Core Pages
- [ ] `/` Landing page with pricing (sell while you build!)
- [ ] `/create` Admin league creation form
- [ ] `/league/[slug]` Branded join page (public)
- [ ] `/home` Member home with today's matches

### Day 3 — Predictions + Leaderboard
- [ ] MatchCard component rendering with score inputs
- [ ] Prediction submission (POST /api/predictions)
- [ ] Leaderboard page with real-time updates
- [ ] Profile page with stats + badges

### Day 4 — Admin Dashboard
- [ ] `/admin/dashboard` — league overview
- [ ] Branding panel (color picker, logo upload)
- [ ] Result entry form → auto-calculates points
- [ ] Member management table

### Day 5 — Shareable Card + Polish
- [ ] Auto-generate shareable prediction card (html2canvas)
- [ ] WhatsApp/Instagram share button
- [ ] Mobile polish (bottom nav, safe areas, PWA)
- [ ] Deploy to Vercel

### Day 6 — SELL
- [ ] DM 10 cafes/turfs in Bengaluru on Instagram
- [ ] Post on LinkedIn: "Built this in 5 days"
- [ ] Apply to Upwork job (UAE client)

---

## Project Structure

```
pitchleague/
├── app/
│   ├── layout.tsx              # Root layout + Clerk
│   ├── globals.css             # Global styles + CSS vars
│   ├── page.tsx                # Landing page (build this Day 2)
│   ├── home/
│   │   └── page.tsx            # Member home (matches + predictions)
│   ├── matches/
│   │   └── page.tsx            # All fixtures
│   ├── leaderboard/
│   │   └── page.tsx            # Full leaderboard
│   ├── profile/
│   │   └── page.tsx            # User profile + stats
│   ├── admin/
│   │   └── dashboard/
│   │       └── page.tsx        # Admin panel
│   ├── league/
│   │   └── [slug]/
│   │       └── page.tsx        # Public branded join page
│   └── api/
│       ├── leagues/
│       │   ├── route.ts        # POST create league ✅
│       │   └── join/
│       │       └── route.ts    # POST join via invite code ✅
│       ├── predictions/
│       │   └── route.ts        # POST submit prediction ✅
│       └── admin/
│           └── results/
│               └── route.ts    # POST enter match result ✅
├── components/
│   └── shared/
│       ├── BottomNav.tsx       # Mobile bottom navigation ✅
│       ├── MatchCard.tsx       # Prediction card ✅
│       └── LeaderboardRow.tsx  # Leaderboard entry ✅
├── lib/
│   ├── supabase.ts             # Supabase client ✅
│   └── utils.ts                # Helpers + points calc ✅
├── types/
│   └── index.ts                # All TypeScript types ✅
├── supabase/
│   └── schema.sql              # Full DB schema ✅
├── middleware.ts               # Clerk route protection ✅
└── .env.example                # Environment template ✅
```

---

## Points System
| Prediction | Points |
|---|---|
| Exact score (e.g. 2-1 = 2-1) | +5 |
| Correct winner/draw | +2 |
| Underdog correct pick | +1 bonus |
| Wrong | 0 |
| 3-match streak bonus | +1/match |

---

## White-Label Theming
Each league has `primary_color` and `accent_color` stored in DB.
These are injected as CSS variables on the page root:
```css
--league-primary: #e11d48;   /* rose for a restaurant */
--league-primary-10: #e11d481a;
```
Use `bg-[var(--league-primary)]` in Tailwind anywhere you want brand color.

---

## Pricing (suggested)
| Plan | Price | Members | Features |
|---|---|---|---|
| Starter | ₹999 | 50 | Basic leaderboard, invite link |
| Growth | ₹2,499 | 200 | + Shareable cards, custom colors/logo |
| Premium | ₹4,999 | Unlimited | + Analytics, WhatsApp templates, custom domain |

---

## API Reference

### POST /api/leagues
Create a new league (admin only)
```json
{
  "name": "CultFit FIFA 2026",
  "primary_color": "#e11d48",
  "accent_color": "#be123c",
  "welcome_message": "Welcome to the CultFit prediction league!",
  "plan": "growth"
}
```

### POST /api/leagues/join
Join a league via invite code
```json
{ "invite_code": "XK9P2M" }
```

### POST /api/predictions
Submit or update a prediction (locked at kickoff)
```json
{
  "league_id": "uuid",
  "match_id": "uuid",
  "predicted_score_a": 2,
  "predicted_score_b": 1
}
```

### POST /api/admin/results
Enter match result and auto-calculate points (admin only)
```json
{
  "league_id": "uuid",
  "match_id": "uuid",
  "score_a": 2,
  "score_b": 0
}
```

---

## Environment Setup
1. Create a Supabase project at supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Create a Clerk app at clerk.com
4. Copy `.env.example` → `.env.local`
5. Fill in all keys
6. `npm run dev`

---

Built by Tapan / BuddyTech Labs 🚀
# PitchLeague

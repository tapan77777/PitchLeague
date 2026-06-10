'use client'

import { useState, useMemo } from 'react'
import TeamFlag from './TeamFlag'
import { Match } from '@/types'

interface TeamStat {
  name: string
  flag: string
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  pts: number
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function computeStandings(matches: Match[], group: string): TeamStat[] {
  const stats: Record<string, TeamStat> = {}

  function ensure(name: string, flag: string) {
    if (!stats[name]) stats[name] = { name, flag, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
  }

  for (const m of matches) {
    const g = (m.group_name || '').replace(/^Group\s*/i, '').toUpperCase()
    if (g !== group) continue

    ensure(m.team_a, m.team_a_flag || '')
    ensure(m.team_b, m.team_b_flag || '')

    if (m.status === 'finished' && m.score_a != null && m.score_b != null) {
      const sa = m.score_a, sb = m.score_b
      stats[m.team_a].mp++; stats[m.team_b].mp++
      stats[m.team_a].gf += sa; stats[m.team_a].ga += sb
      stats[m.team_b].gf += sb; stats[m.team_b].ga += sa
      if (sa > sb) {
        stats[m.team_a].w++; stats[m.team_a].pts += 3
        stats[m.team_b].l++
      } else if (sb > sa) {
        stats[m.team_b].w++; stats[m.team_b].pts += 3
        stats[m.team_a].l++
      } else {
        stats[m.team_a].d++; stats[m.team_a].pts += 1
        stats[m.team_b].d++; stats[m.team_b].pts += 1
      }
    } else if (m.status !== 'finished') {
      // Just register teams from upcoming matches
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })
}

export default function GroupStandings({ matches }: { matches: Match[] }) {
  const [activeGroup, setActiveGroup] = useState('A')

  // Only show groups that have matches in the data
  const groupsWithMatches = useMemo(() => {
    const seen = new Set<string>()
    for (const m of matches) {
      const g = (m.group_name || '').replace(/^Group\s*/i, '').toUpperCase()
      if (g && GROUPS.includes(g)) seen.add(g)
    }
    return GROUPS.filter(g => seen.has(g))
  }, [matches])

  const standings = useMemo(
    () => computeStandings(matches, activeGroup),
    [matches, activeGroup]
  )

  if (groupsWithMatches.length === 0) return null

  return (
    <div className="mb-7">
      {/* Group tab strip */}
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none mb-3">
        {groupsWithMatches.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: activeGroup === g ? '#c9a84c' : '#1a1a1a',
              color: activeGroup === g ? '#000' : '#6b6b6b',
              border: `1px solid ${activeGroup === g ? '#c9a84c' : '#2a2a2a'}`,
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Standings table */}
      <div className="rounded-2xl border border-[#222] bg-[#111] overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-2.5 border-b border-[#1e1e1e]">
          <span className="fifa-score text-base leading-none" style={{ color: '#c9a84c' }}>
            GROUP {activeGroup}
          </span>
          <div className="ml-auto flex items-center gap-4 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            <span className="w-5 text-center">MP</span>
            <span className="w-5 text-center">W</span>
            <span className="w-5 text-center">D</span>
            <span className="w-5 text-center">L</span>
            <span className="w-6 text-center font-bold text-zinc-400">Pts</span>
          </div>
        </div>

        {standings.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">No teams found</div>
        ) : (
          standings.map((team, i) => (
            <div
              key={team.name}
              className="flex items-center px-4 py-2.5 border-b border-[#1a1a1a] last:border-0"
              style={{
                backgroundColor: i < 2 ? 'rgba(201,168,76,0.04)' : 'transparent',
              }}
            >
              {/* Qualify indicator */}
              <div
                className="w-0.5 h-5 rounded-full mr-3 shrink-0"
                style={{ backgroundColor: i < 2 ? '#c9a84c' : 'transparent' }}
              />

              {/* Rank */}
              <span
                className="text-xs font-black w-4 shrink-0 mr-2"
                style={{ color: i === 0 ? '#c9a84c' : i === 1 ? '#a1a1aa' : '#444' }}
              >
                {i + 1}
              </span>

              {/* Flag */}
              <div className="mr-2 shrink-0">
                <TeamFlag name={team.name} size="sm" />
              </div>

              {/* Name */}
              <span className="text-sm text-[#e0e0e0] flex-1 min-w-0 truncate font-medium leading-tight">
                {team.name}
              </span>

              {/* Stats */}
              <div className="flex items-center gap-4 ml-2 text-sm tabular-nums shrink-0">
                <span className="w-5 text-center text-zinc-500">{team.mp}</span>
                <span className="w-5 text-center text-zinc-500">{team.w}</span>
                <span className="w-5 text-center text-zinc-500">{team.d}</span>
                <span className="w-5 text-center text-zinc-500">{team.l}</span>
                <span
                  className="w-6 text-center font-black"
                  style={{ color: team.pts > 0 ? '#c9a84c' : '#555' }}
                >
                  {team.pts}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {standings.length >= 2 && (
        <p className="text-[10px] text-zinc-700 mt-2 px-1">
          ▏ Top 2 qualify to knockout stage
        </p>
      )}
    </div>
  )
}

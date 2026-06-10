'use client'

import { useState } from 'react'

const COUNTRY_CODES: Record<string, string> = {
  // Group A
  'Mexico': 'mx', 'South Africa': 'za', 'S. Africa': 'za', 'S.Africa': 'za',
  'South Korea': 'kr', 'S. Korea': 'kr', 'S.Korea': 'kr', 'Korea Republic': 'kr',
  'Czechia': 'cz', 'Czech Republic': 'cz',
  // Group B
  'Spain': 'es', 'Brazil': 'br', 'Japan': 'jp', 'Senegal': 'sn',
  // Group C
  'England': 'gb-eng', 'France': 'fr', 'Argentina': 'ar', 'Colombia': 'co',
  // Group D
  'Germany': 'de', 'Netherlands': 'nl', 'Portugal': 'pt', 'Ecuador': 'ec',
  // Group E
  'USA': 'us', 'United States': 'us', 'Morocco': 'ma', 'Uruguay': 'uy', 'Belgium': 'be',
  // Group F
  'Australia': 'au', 'Nigeria': 'ng', 'Turkey': 'tr', 'Ukraine': 'ua',
  // Group G
  'Croatia': 'hr', 'Switzerland': 'ch', 'Denmark': 'dk', 'Peru': 'pe',
  // Group H
  'Canada': 'ca', 'Egypt': 'eg', 'Poland': 'pl', 'Saudi Arabia': 'sa',
  // Group I
  'Italy': 'it', 'Serbia': 'rs', 'Hungary': 'hu', 'Chile': 'cl',
  // Group J
  'Iran': 'ir', 'Ghana': 'gh', 'New Zealand': 'nz', 'Slovakia': 'sk',
  // Group K
  'Cameroon': 'cm', 'Austria': 'at', 'Panama': 'pa', 'Iraq': 'iq',
  // Group L
  'Qatar': 'qa', 'Greece': 'gr', 'Costa Rica': 'cr', 'Indonesia': 'id',
}

function getFlagUrl(countryName: string, size: number): string {
  const code = COUNTRY_CODES[countryName] || COUNTRY_CODES[countryName?.trim()]
  if (!code) return ''
  const w = size <= 24 ? 32 : size <= 48 ? 64 : 128
  return `https://flagcdn.com/w${w}/${code}.png`
}

type FlagSize = 'sm' | 'md' | 'lg'
const SIZE_MAP: Record<FlagSize, number> = { sm: 24, md: 48, lg: 64 }

export default function TeamFlag({
  name,
  size = 'md',
  className = '',
}: {
  name: string
  size?: FlagSize
  className?: string
}) {
  const px = SIZE_MAP[size]
  const [failed, setFailed] = useState(false)
  const url = getFlagUrl(name, px)

  if (!url || failed) {
    return (
      <div
        className={`rounded-sm flex items-center justify-center bg-zinc-800 text-zinc-400 font-bold shrink-0 ${className}`}
        style={{ width: px, height: Math.round(px * 0.67) }}
      >
        <span style={{ fontSize: px * 0.35 }}>{name?.charAt(0)?.toUpperCase() ?? '?'}</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={px}
      height={Math.round(px * 0.67)}
      className={`object-cover rounded-sm shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

export { getFlagUrl }

'use client'

const FLAG_EMOJIS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'S. Africa': '🇿🇦', 'S.Africa': '🇿🇦',
  'South Korea': '🇰🇷', 'S. Korea': '🇰🇷', 'S.Korea': '🇰🇷', 'Korea Republic': '🇰🇷',
  'Czechia': '🇨🇿', 'Czech Republic': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Paraguay': '🇵🇾',
  'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Curacao': '🇨🇼',
  'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵',
  'Tunisia': '🇹🇳', 'Sweden': '🇸🇪',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳',
  'Norway': '🇳🇴', 'Iraq': '🇮🇶',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿',
  'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴',
  'Uzbekistan': '🇺🇿', 'DR Congo': '🇨🇩',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷',
  'Panama': '🇵🇦', 'Ghana': '🇬🇭',
  'Italy': '🇮🇹', 'Serbia': '🇷🇸', 'Hungary': '🇭🇺', 'Chile': '🇨🇱',
  'Denmark': '🇩🇰', 'Peru': '🇵🇪', 'Ukraine': '🇺🇦', 'Nigeria': '🇳🇬',
  'Poland': '🇵🇱', 'Slovakia': '🇸🇰', 'Cameroon': '🇨🇲', 'Indonesia': '🇮🇩',
  'Greece': '🇬🇷', 'Costa Rica': '🇨🇷',
}

const SIZE_MAP = {
  sm:  '1.5rem',
  md:  '2.5rem',
  lg:  '3.75rem',
  xl:  '4.5rem',
}

export default function TeamFlag({
  name,
  size = 'md',
  className = '',
}: {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const emoji = FLAG_EMOJIS[name] || '🏴'
  return (
    <span
      role="img"
      aria-label={name}
      className={`leading-none select-none ${className}`}
      style={{ fontSize: SIZE_MAP[size] }}
    >
      {emoji}
    </span>
  )
}

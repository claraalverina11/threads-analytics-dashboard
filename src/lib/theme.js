// JS-side color constants (Recharts needs concrete values, not CSS vars).
export const BRAND = '#045a26'
export const BRAND_500 = '#0b6e33'
export const BRAND_400 = '#2f8f52'
export const BRAND_300 = '#6fb98b'

export const METRIC_COLORS = {
  views: '#045a26',
  likes: '#2f8f52',
  comments: '#4a6fa5',
  reposts: '#b7935f',
  shares: '#7d5ba6',
  engagements: '#0b6e33',
  engagementRate: '#9a6a10',
  avgViews: '#2f8f52',
}

// A harmonious categorical palette (green-led) for pillars / types.
export const CATEGORICAL = [
  '#045a26',
  '#2f8f52',
  '#6fb98b',
  '#4a6fa5',
  '#b7935f',
  '#9a6a10',
  '#7d5ba6',
  '#3c8f8a',
]

// Fixed color per content pillar, so a pillar always reads with the same hue
// across badges and charts. Each entry: solid color + soft tinted background.
export const PILLAR_COLORS = {
  Humor: { color: '#9a6a10', bg: '#fbf1dd' }, // amber
  Community: { color: '#045a26', bg: '#e6f0ea' }, // brand green
  Product: { color: '#4a6fa5', bg: '#eaf0f8' }, // blue
  Lifestyle: { color: '#7d5ba6', bg: '#f1ecf7' }, // purple
  Discussion: { color: '#3c8f8a', bg: '#e6f2f1' }, // teal
  Sales: { color: '#b4402a', bg: '#fbebe6' }, // red-clay
}

const PILLAR_FALLBACKS = ['#045a26', '#2f8f52', '#4a6fa5', '#b7935f', '#9a6a10', '#7d5ba6', '#3c8f8a']

/** Return a stable {color,bg} for any pillar name (known or not). */
export function pillarColor(name) {
  if (PILLAR_COLORS[name]) return PILLAR_COLORS[name]
  // Deterministic fallback for unknown pillar names.
  let h = 0
  for (let i = 0; i < String(name).length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const c = PILLAR_FALLBACKS[h % PILLAR_FALLBACKS.length]
  return { color: c, bg: 'transparent' }
}

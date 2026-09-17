// Deterministic sample-data generator for the Threads Analytics dashboard.
// Produces realistic posts across several months, pillars, and statuses.
// Run: node scripts/generateData.mjs  -> writes src/data/sampleData.json
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'sampleData.json')

// --- Seeded PRNG (mulberry32) for reproducible data ---
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260917)
const rint = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p

// --- Content pillars with characteristic performance profiles ---
const PILLARS = [
  { name: 'Product Updates',   base: 4200, engage: 0.052, growth: 1.14, share: 0.9 },
  { name: 'Educational',       base: 6100, engage: 0.071, growth: 1.22, share: 1.3 },
  { name: 'Behind the Scenes', base: 3400, engage: 0.061, growth: 1.05, share: 0.7 },
  { name: 'Customer Stories',  base: 3900, engage: 0.083, growth: 1.10, share: 1.1 },
  { name: 'Industry News',     base: 5200, engage: 0.041, growth: 0.98, share: 1.4 },
  { name: 'Community',         base: 2800, engage: 0.094, growth: 1.18, share: 0.8 },
  { name: 'Promotions',        base: 4800, engage: 0.037, growth: 0.92, share: 0.6 },
]

const CONTENT_TYPES = ['Text', 'Image', 'Carousel', 'Video', 'Poll', 'Link']
const TYPE_MULT = { Text: 0.85, Image: 1.05, Carousel: 1.25, Video: 1.45, Poll: 1.15, Link: 0.8 }

const STATUS = ['Published', 'Published', 'Published', 'Published', 'Scheduled', 'Draft']

const HOOKS = {
  'Product Updates': [
    'Shipped: {feat} is now live for everyone',
    'A small change with a big impact — meet {feat}',
    'You asked, we built it: introducing {feat}',
    'Changelog: 5 improvements landing this week',
    'We rebuilt {feat} from the ground up. Here’s why.',
  ],
  Educational: [
    'The 3-step framework we use for {topic}',
    '{n} mistakes killing your {topic} (and the fix)',
    'How to think about {topic} in 2026',
    'A thread on {topic} nobody talks about',
    'Save this: the only {topic} checklist you need',
  ],
  'Behind the Scenes': [
    'What a launch day actually looks like on our team',
    'The messy first draft vs. what we shipped',
    'How we make decisions when nobody agrees',
    'A day in the life of building {feat}',
    'The tool stack that runs our whole team',
  ],
  'Customer Stories': [
    'How {brand} grew {metric}% using our approach',
    '“This changed how we work” — a note from {brand}',
    'From skeptic to superfan: the {brand} story',
    'Real results: {brand} in their own words',
    'Why {brand} switched — and what happened next',
  ],
  'Industry News': [
    'Breaking: what the new {topic} shift means for you',
    'Everyone’s talking about {topic}. Here’s the signal.',
    'Our take on the biggest {topic} story this week',
    '{topic} is changing fast. Don’t miss this.',
    'The numbers behind this week’s {topic} news',
  ],
  Community: [
    'Drop your best {topic} tip below 👇',
    'We hit a milestone — thank you all 🙏',
    'Question for the community: how do you handle {topic}?',
    'Shoutout to everyone building in public this week',
    'Poll: which {topic} approach wins?',
  ],
  Promotions: [
    'Last chance: {offer} ends tonight',
    'Our biggest {offer} of the year is here',
    'Limited spots left for {offer}',
    'Unlock {offer} — link below',
    '48 hours only: {offer}',
  ],
}

const FEATS = ['Insights v2', 'Smart Scheduling', 'Team Spaces', 'the new Editor', 'Auto-Reports', 'Dark Mode', 'Bulk Export']
const TOPICS = ['engagement', 'content strategy', 'growth', 'analytics', 'audience building', 'retention', 'creator monetization']
const BRANDS = ['Northwind', 'Lumen Co', 'Fern & Oak', 'Bright Labs', 'Cadence', 'Harbor', 'Vela Studio']
const OFFERS = ['annual plan discount', 'free onboarding', 'the Pro trial', 'the creator bundle']
const METRICS = [38, 42, 55, 61, 73, 88, 120, 140]

function makeContent(pillar) {
  const t = pick(HOOKS[pillar])
  return t
    .replace('{feat}', pick(FEATS))
    .replace('{topic}', pick(TOPICS))
    .replace('{brand}', pick(BRANDS))
    .replace('{offer}', pick(OFFERS))
    .replace('{metric}', pick(METRICS))
    .replace('{n}', String(rint(3, 7)))
}

// --- Date range: roughly 20 weeks ending mid-Sep 2026 ---
const END = new Date('2026-09-14T00:00:00Z') // a Monday (today-ish)
const WEEKS = 20
const START = new Date(END)
START.setUTCDate(START.getUTCDate() - WEEKS * 7)

function fmt(d) {
  return d.toISOString().slice(0, 10)
}

const posts = []
let id = 1000
// Simulate an overall audience-growth curve over the period.
for (let w = 0; w < WEEKS; w++) {
  const weekStart = new Date(START)
  weekStart.setUTCDate(weekStart.getUTCDate() + w * 7)
  const seasonal = 1 + 0.14 * Math.sin((w / WEEKS) * Math.PI * 2) // seasonality
  const trend = 1 + (w / WEEKS) * 0.55 // steady account growth
  const postsThisWeek = rint(5, 8)

  for (let p = 0; p < postsThisWeek; p++) {
    const pillar = pick(PILLARS)
    const type = pick(CONTENT_TYPES)
    const dayOffset = rint(0, 6)
    const d = new Date(weekStart)
    d.setUTCDate(d.getUTCDate() + dayOffset)

    // Future-dated posts become Scheduled/Draft; past posts are Published.
    let status
    if (d > END) status = chance(0.6) ? 'Scheduled' : 'Draft'
    else status = pick(STATUS.filter((s) => s === 'Published'))
    // A few recent past items still in draft/scheduled review
    if (d <= END && chance(0.04)) status = pick(['Scheduled', 'Draft'])

    const isLive = status === 'Published'

    const noise = 0.7 + rand() * 0.8
    const viral = chance(0.06) ? rint(2, 5) : 1 // occasional breakout
    const baseViews = pillar.base * pillar.growth ** (w / WEEKS) * TYPE_MULT[type]
    const views = isLive ? Math.round(baseViews * seasonal * trend * noise * viral) : 0

    const engRate = pillar.engage * (0.8 + rand() * 0.5)
    const totalEng = isLive ? Math.round(views * engRate) : 0
    // Split engagement across likes/comments/reposts/shares.
    const likes = Math.round(totalEng * (0.62 + rand() * 0.08))
    const comments = Math.round(totalEng * (0.12 + rand() * 0.05))
    const reposts = Math.round(totalEng * (0.10 + rand() * 0.04) * pillar.share)
    const shares = Math.max(0, totalEng - likes - comments - reposts)

    posts.push({
      id: `T-${id++}`,
      date: fmt(d),
      pillar: pillar.name,
      contentType: type,
      content: makeContent(pillar.name),
      status,
      link: `https://www.threads.net/@analytics.studio/post/${id.toString(36).toUpperCase()}${rint(100, 999)}`,
      views,
      likes: isLive ? likes : 0,
      comments: isLive ? comments : 0,
      reposts: isLive ? Math.max(0, reposts) : 0,
      shares: isLive ? shares : 0,
    })
  }
}

// Add a handful of upcoming Scheduled/Draft posts so the Status filter is meaningful.
for (let f = 0; f < 8; f++) {
  const pillar = pick(PILLARS)
  const type = pick(CONTENT_TYPES)
  const d = new Date(END)
  d.setUTCDate(d.getUTCDate() + rint(1, 12))
  const status = chance(0.6) ? 'Scheduled' : 'Draft'
  posts.push({
    id: `T-${id++}`,
    date: fmt(d),
    pillar: pillar.name,
    contentType: type,
    content: makeContent(pillar.name),
    status,
    link: `https://www.threads.net/@analytics.studio/post/${id.toString(36).toUpperCase()}${rint(100, 999)}`,
    views: 0,
    likes: 0,
    comments: 0,
    reposts: 0,
    shares: 0,
  })
}

posts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

const meta = {
  account: '@analytics.studio',
  platform: 'Threads',
  generatedAt: new Date().toISOString(),
  rangeStart: fmt(START),
  rangeEnd: posts[posts.length - 1].date,
  postCount: posts.length,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ meta, posts }, null, 2))
console.log(`Wrote ${posts.length} posts to ${OUT}`)

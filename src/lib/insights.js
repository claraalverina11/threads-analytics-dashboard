// Period insight generator: compares the latest period vs the prior one and
// produces plain-language summaries with supporting metrics.
import { aggregate, groupBy, withDerived, isLive } from './analytics'
import { pctChange } from './format'
import { weekKey, weekLabel, monthKey, monthLabel, weekRange, monthRange } from './dates'

/** Split posts into ordered period buckets. Returns [{key,label,posts,range}]. */
export function splitPeriods(posts, granularity = 'week') {
  const keyFn = granularity === 'month' ? monthKey : weekKey
  const labelFn = granularity === 'month' ? monthLabel : weekLabel
  const rangeFn = granularity === 'month' ? monthRange : weekRange
  const map = new Map()
  for (const p of posts) {
    if (!isLive(p)) continue
    const key = keyFn(p.date)
    if (!map.has(key)) map.set(key, { key, label: labelFn(p.date), range: rangeFn(p.date), posts: [] })
    map.get(key).posts.push(p)
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
}

function topPillar(posts) {
  const groups = groupBy(posts, 'pillar').sort((a, b) => b.engagements - a.engagements)
  return groups[0] || null
}

function bestPost(posts) {
  const live = withDerived(posts.filter((p) => isLive(p) && p.views > 0))
  if (!live.length) return null
  return [...live].sort((a, b) => b.engagements - a.engagements)[0]
}

/**
 * Build an insight report for the most recent period vs the previous one.
 * Returns null if there is not enough data.
 */
export function buildPeriodInsights(posts, granularity = 'week') {
  const periods = splitPeriods(posts, granularity)
  if (periods.length === 0) return null
  const current = periods[periods.length - 1]
  const previous = periods.length > 1 ? periods[periods.length - 2] : null

  const c = aggregate(current.posts)
  const p = previous ? aggregate(previous.posts) : null

  const metricRows = [
    { key: 'views', label: 'Views' },
    { key: 'engagements', label: 'Engagements' },
    { key: 'engagementRate', label: 'Engagement rate', isRate: true },
    { key: 'avgViews', label: 'Avg views / post' },
    { key: 'posts', label: 'Posts published' },
  ].map((m) => ({
    ...m,
    current: c[m.key],
    previous: p ? p[m.key] : null,
    delta: p ? pctChange(p[m.key], c[m.key]) : null,
  }))

  const tp = topPillar(current.posts)
  const bp = bestPost(current.posts)

  // Pillar movement vs previous period.
  const curPillars = groupBy(current.posts, 'pillar')
  const prevPillars = previous ? groupBy(previous.posts, 'pillar') : []
  const prevMap = new Map(prevPillars.map((x) => [x.key, x]))
  const pillarMoves = curPillars
    .map((cp) => {
      const pp = prevMap.get(cp.key)
      return {
        pillar: cp.key,
        engagements: cp.engagements,
        delta: pp ? pctChange(pp.engagements, cp.engagements) : null,
      }
    })
    .sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity))

  // Narrative headlines.
  const headlines = []
  const viewDelta = metricRows.find((m) => m.key === 'views').delta
  if (viewDelta != null) {
    const dir = viewDelta >= 0 ? 'grew' : 'declined'
    headlines.push(
      `Views ${dir} ${Math.abs(viewDelta).toFixed(1)}% versus the previous ${granularity}, with ${c.posts} posts published.`,
    )
  } else {
    headlines.push(`${c.posts} posts published, generating ${Math.round(c.views).toLocaleString()} views.`)
  }
  const erDelta = metricRows.find((m) => m.key === 'engagementRate').delta
  if (erDelta != null) {
    const dir = erDelta >= 0 ? 'up' : 'down'
    headlines.push(
      `Engagement rate is ${c.engagementRate.toFixed(2)}%, ${dir} ${Math.abs(erDelta).toFixed(1)} pts of relative change.`,
    )
  }
  if (tp) headlines.push(`${tp.key} was the strongest pillar by total engagement this ${granularity}.`)
  if (pillarMoves[0]?.delta != null && pillarMoves[0].delta > 5) {
    headlines.push(`${pillarMoves[0].pillar} is trending up (+${pillarMoves[0].delta.toFixed(0)}% engagement).`)
  }

  return {
    granularity,
    current,
    previous,
    totals: c,
    prevTotals: p,
    metricRows,
    topPillar: tp,
    bestPost: bp,
    pillarMoves,
    headlines,
    periodsAvailable: periods.length,
  }
}

// Core analytics engine: aggregations, KPIs, time series, and comparisons.
import { pctChange } from './format'
import { weekKey, weekLabel, monthKey, monthLabel } from './dates'

export const ENGAGEMENT_FIELDS = ['likes', 'comments', 'reposts', 'shares']

/** Only Published posts count toward performance metrics. */
export function isLive(post) {
  return post.status === 'Published'
}

export function engagements(post) {
  return post.likes + post.comments + post.reposts + post.shares
}

/**
 * Aggregate a list of posts into a totals object.
 * Engagement rate = total engagements / total views.
 */
export function aggregate(posts) {
  const live = posts.filter(isLive)
  const totals = {
    posts: live.length,
    allPosts: posts.length,
    views: 0,
    likes: 0,
    comments: 0,
    reposts: 0,
    shares: 0,
  }
  for (const p of live) {
    totals.views += p.views
    totals.likes += p.likes
    totals.comments += p.comments
    totals.reposts += p.reposts
    totals.shares += p.shares
  }
  totals.engagements = totals.likes + totals.comments + totals.reposts + totals.shares
  totals.engagementRate = totals.views ? (totals.engagements / totals.views) * 100 : 0
  totals.avgViews = totals.posts ? totals.views / totals.posts : 0
  totals.avgEngagements = totals.posts ? totals.engagements / totals.posts : 0
  return totals
}

/** The eight headline KPIs, each with value + optional delta vs previous. */
export function computeKpis(current, previous) {
  const c = aggregate(current)
  const p = previous ? aggregate(previous) : null
  const delta = (key) => (p ? pctChange(p[key], c[key]) : null)
  return {
    totals: c,
    prevTotals: p,
    cards: [
      { key: 'views', label: 'Total Views', value: c.views, delta: delta('views'), format: 'compact' },
      { key: 'likes', label: 'Total Likes', value: c.likes, delta: delta('likes'), format: 'compact' },
      { key: 'comments', label: 'Total Comments', value: c.comments, delta: delta('comments'), format: 'compact' },
      { key: 'reposts', label: 'Total Reposts', value: c.reposts, delta: delta('reposts'), format: 'compact' },
      { key: 'shares', label: 'Total Shares', value: c.shares, delta: delta('shares'), format: 'compact' },
      { key: 'engagementRate', label: 'Engagement Rate', value: c.engagementRate, delta: delta('engagementRate'), format: 'percent' },
      { key: 'posts', label: 'Total Posts', value: c.posts, delta: delta('posts'), format: 'number' },
      { key: 'avgViews', label: 'Avg Views / Post', value: c.avgViews, delta: delta('avgViews'), format: 'compact' },
    ],
  }
}

/** Daily time series (sorted) with cumulative-free per-day metrics. */
export function dailySeries(posts) {
  const map = new Map()
  for (const p of posts.filter(isLive)) {
    const cur = map.get(p.date) || { date: p.date, views: 0, likes: 0, comments: 0, reposts: 0, shares: 0, posts: 0 }
    cur.views += p.views
    cur.likes += p.likes
    cur.comments += p.comments
    cur.reposts += p.reposts
    cur.shares += p.shares
    cur.posts += 1
    map.set(p.date, cur)
  }
  return [...map.values()]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => ({
      ...d,
      engagements: d.likes + d.comments + d.reposts + d.shares,
      engagementRate: d.views ? ((d.likes + d.comments + d.reposts + d.shares) / d.views) * 100 : 0,
    }))
}

/** Bucketed time series by 'week' or 'month'. */
export function bucketedSeries(posts, granularity = 'week') {
  const keyFn = granularity === 'month' ? monthKey : weekKey
  const labelFn = granularity === 'month' ? monthLabel : weekLabel
  const map = new Map()
  for (const p of posts.filter(isLive)) {
    const key = keyFn(p.date)
    const cur =
      map.get(key) || {
        key,
        label: labelFn(p.date),
        views: 0,
        likes: 0,
        comments: 0,
        reposts: 0,
        shares: 0,
        posts: 0,
      }
    cur.views += p.views
    cur.likes += p.likes
    cur.comments += p.comments
    cur.reposts += p.reposts
    cur.shares += p.shares
    cur.posts += 1
    map.set(key, cur)
  }
  return [...map.values()]
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((d) => ({
      ...d,
      engagements: d.likes + d.comments + d.reposts + d.shares,
      engagementRate: d.views ? ((d.likes + d.comments + d.reposts + d.shares) / d.views) * 100 : 0,
      avgViews: d.posts ? d.views / d.posts : 0,
    }))
}

/** Group + aggregate by any categorical field (pillar, contentType, status). */
export function groupBy(posts, field) {
  const map = new Map()
  for (const p of posts.filter(isLive)) {
    const key = p[field] || 'Uncategorized'
    const cur = map.get(key) || { key, views: 0, likes: 0, comments: 0, reposts: 0, shares: 0, posts: 0 }
    cur.views += p.views
    cur.likes += p.likes
    cur.comments += p.comments
    cur.reposts += p.reposts
    cur.shares += p.shares
    cur.posts += 1
    map.set(key, cur)
  }
  return [...map.values()].map((d) => {
    const engagements = d.likes + d.comments + d.reposts + d.shares
    return {
      ...d,
      engagements,
      engagementRate: d.views ? (engagements / d.views) * 100 : 0,
      avgViews: d.posts ? d.views / d.posts : 0,
    }
  })
}

/** Per-post derived metrics for the content table. */
export function withDerived(posts) {
  return posts.map((p) => {
    const eng = engagements(p)
    return {
      ...p,
      engagements: eng,
      engagementRate: p.views ? (eng / p.views) * 100 : 0,
    }
  })
}

/**
 * Classify posts into top / low performers by engagement rate among live posts.
 * Returns a Map of id -> 'top' | 'low'. Uses quantile thresholds so the
 * indicators stay meaningful regardless of dataset size.
 */
export function performanceFlags(posts) {
  const live = withDerived(posts.filter(isLive)).filter((p) => p.views > 0)
  const flags = new Map()
  if (live.length < 5) return flags
  const sorted = [...live].sort((a, b) => a.engagementRate - b.engagementRate)
  const q = (frac) => sorted[Math.floor(frac * (sorted.length - 1))].engagementRate
  const lowT = q(0.2)
  const topT = q(0.8)
  for (const p of live) {
    if (p.engagementRate >= topT) flags.set(p.id, 'top')
    else if (p.engagementRate <= lowT) flags.set(p.id, 'low')
  }
  return flags
}

/** Sum of a metric across live posts. */
export function sumMetric(posts, metric) {
  return posts.filter(isLive).reduce((acc, p) => acc + (p[metric] || 0), 0)
}

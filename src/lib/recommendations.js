// Heuristic "AI" recommendation engine. Every recommendation is derived from
// explicit data signals so the UI can show WHY it was generated. This is a
// transparent rules engine — swap it for an LLM call later without changing
// the recommendation shape consumed by the UI.
import { aggregate, groupBy, isLive, bucketedSeries } from './analytics'
import { pctChange } from './format'

const CATEGORIES = {
  invest: { label: 'Double down', tone: 'positive' },
  create: { label: 'Create more', tone: 'positive' },
  timing: { label: 'Posting pattern', tone: 'neutral' },
  engage: { label: 'Engagement opportunity', tone: 'neutral' },
  improve: { label: 'Needs improvement', tone: 'warning' },
  test: { label: 'Test next', tone: 'neutral' },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function rec(id, category, title, detail, signals, priority = 2) {
  return { id, category, meta: CATEGORIES[category], title, detail, signals, priority }
}

export function buildRecommendations(posts) {
  const live = posts.filter(isLive)
  const recs = []
  if (live.length < 6) return { recs, generatedFrom: live.length }

  const overall = aggregate(live)
  const pillars = groupBy(live, 'pillar')
  const types = groupBy(live, 'contentType')
  const avgER = overall.engagementRate

  // 1) Best pillar by engagement rate (min sample of 3 posts) -> invest.
  const rankedPillars = [...pillars]
    .filter((p) => p.posts >= 3)
    .sort((a, b) => b.engagementRate - a.engagementRate)
  const bestPillar = rankedPillars[0]
  if (bestPillar && bestPillar.engagementRate > avgER * 1.1) {
    recs.push(
      rec(
        'pillar-invest',
        'invest',
        `Lean into ${bestPillar.key}`,
        `${bestPillar.key} converts attention into engagement more efficiently than your account average. Prioritize it in the next content calendar.`,
        [
          `Engagement rate ${bestPillar.engagementRate.toFixed(2)}% vs account avg ${avgER.toFixed(2)}%`,
          `${bestPillar.posts} posts, ${bestPillar.engagements.toLocaleString()} total engagements`,
        ],
        1,
      ),
    )
  }

  // 2) High reach but low engagement pillar -> improve.
  const weakEngage = [...pillars]
    .filter((p) => p.posts >= 3 && p.engagementRate < avgER * 0.8)
    .sort((a, b) => a.engagementRate - b.engagementRate)[0]
  if (weakEngage) {
    recs.push(
      rec(
        'pillar-improve',
        'improve',
        `Rework how ${weakEngage.key} asks for interaction`,
        `${weakEngage.key} reaches people but under-converts. Add a clear question or call-to-action and tighten the opening line.`,
        [
          `Engagement rate ${weakEngage.engagementRate.toFixed(2)}% — ${((1 - weakEngage.engagementRate / avgER) * 100).toFixed(0)}% below account average`,
          `${weakEngage.posts} posts analyzed`,
        ],
        1,
      ),
    )
  }

  // 3) Best content type -> create more.
  const bestType = [...types]
    .filter((t) => t.posts >= 2)
    .sort((a, b) => b.engagementRate - a.engagementRate)[0]
  if (bestType && bestType.engagementRate > avgER) {
    recs.push(
      rec(
        'type-create',
        'create',
        `Produce more ${bestType.key} posts`,
        `${bestType.key} content outperforms your average engagement rate. It's a reliable format to increase in the mix.`,
        [
          `${bestType.key}: ${bestType.engagementRate.toFixed(2)}% engagement rate`,
          `Avg ${Math.round(bestType.avgViews).toLocaleString()} views per ${bestType.key.toLowerCase()} post`,
        ],
        2,
      ),
    )
  }

  // 4) Posting-day pattern -> timing.
  const byDay = new Map()
  for (const p of live) {
    if (!p.views) continue
    const d = new Date(`${p.date}T00:00:00`).getDay()
    const cur = byDay.get(d) || { day: d, er: 0, views: 0, count: 0 }
    cur.er += p.views ? ((p.likes + p.comments + p.reposts + p.shares) / p.views) * 100 : 0
    cur.views += p.views
    cur.count += 1
    byDay.set(d, cur)
  }
  const dayStats = [...byDay.values()]
    .filter((d) => d.count >= 2)
    .map((d) => ({ ...d, avgER: d.er / d.count, avgViews: d.views / d.count }))
    .sort((a, b) => b.avgER - a.avgER)
  if (dayStats.length >= 2) {
    const best = dayStats[0]
    const worst = dayStats[dayStats.length - 1]
    recs.push(
      rec(
        'timing',
        'timing',
        `${WEEKDAYS[best.day]} is your strongest posting day`,
        `Posts published on ${WEEKDAYS[best.day]} see the highest engagement rate. Consider shifting priority content there and testing away from ${WEEKDAYS[worst.day]}.`,
        [
          `${WEEKDAYS[best.day]}: ${best.avgER.toFixed(2)}% avg engagement rate (${best.count} posts)`,
          `${WEEKDAYS[worst.day]}: ${worst.avgER.toFixed(2)}% avg engagement rate (${worst.count} posts)`,
        ],
        2,
      ),
    )
  }

  // 5) Engagement opportunity: comments vs likes ratio -> engage.
  const commentRatio = overall.likes ? overall.comments / overall.likes : 0
  if (commentRatio < 0.18) {
    recs.push(
      rec(
        'engage-comments',
        'engage',
        'Prompt more conversation to lift comments',
        'Your audience likes readily but comments less often. Ending posts with an open question or a poll tends to convert passive likes into replies.',
        [
          `Comments are ${(commentRatio * 100).toFixed(0)}% of likes across the period`,
          `${overall.comments.toLocaleString()} comments vs ${overall.likes.toLocaleString()} likes`,
        ],
        3,
      ),
    )
  }

  // 6) Momentum trend -> test next / invest.
  const weeks = bucketedSeries(live, 'week')
  if (weeks.length >= 4) {
    const recent = weeks.slice(-2)
    const prior = weeks.slice(-4, -2)
    const avg = (arr, k) => arr.reduce((s, x) => s + x[k], 0) / arr.length
    const momentum = pctChange(avg(prior, 'views'), avg(recent, 'views'))
    if (momentum >= 8) {
      recs.push(
        rec(
          'momentum',
          'invest',
          'Reach is accelerating — increase cadence',
          'View volume has climbed over the last two weeks. Momentum periods are the best time to add one extra post per week and capture the tailwind.',
          [`Avg weekly views up ${momentum.toFixed(0)}% over the prior two weeks`],
          2,
        ),
      )
    } else if (momentum <= -8) {
      recs.push(
        rec(
          'momentum',
          'improve',
          'Reach is cooling — refresh your hooks',
          'View volume has softened over the last two weeks. Revisit opening lines and formats before adding volume.',
          [`Avg weekly views down ${Math.abs(momentum).toFixed(0)}% over the prior two weeks`],
          2,
        ),
      )
    }
  }

  // 7) Under-used but promising pillar -> test next.
  const underused = [...pillars]
    .filter((p) => p.posts <= 4 && p.engagementRate > avgER * 1.05)
    .sort((a, b) => b.engagementRate - a.engagementRate)[0]
  if (underused) {
    recs.push(
      rec(
        'test-pillar',
        'test',
        `Test scaling up ${underused.key}`,
        `${underused.key} punches above its weight but you post it rarely. Run a small experiment: publish 2–3 more over the next period and watch engagement rate.`,
        [
          `Only ${underused.posts} posts, yet ${underused.engagementRate.toFixed(2)}% engagement rate`,
          `${((underused.engagementRate / avgER - 1) * 100).toFixed(0)}% above account average`,
        ],
        3,
      ),
    )
  }

  // 8) Shares vs reposts distribution -> test next.
  const bestShareType = [...types]
    .filter((t) => t.posts >= 2 && t.views > 0)
    .map((t) => ({ ...t, shareRate: (t.shares + t.reposts) / t.views }))
    .sort((a, b) => b.shareRate - a.shareRate)[0]
  if (bestShareType) {
    recs.push(
      rec(
        'test-amplify',
        'test',
        `Use ${bestShareType.key} for reach-driving posts`,
        `${bestShareType.key} content earns the most shares and reposts per view, which extends reach beyond your followers. Choose it when the goal is growth rather than depth.`,
        [`${bestShareType.key}: highest combined share + repost rate per view`],
        3,
      ),
    )
  }

  recs.sort((a, b) => a.priority - b.priority)
  return { recs, generatedFrom: live.length, avgEngagementRate: avgER }
}

export { CATEGORIES }

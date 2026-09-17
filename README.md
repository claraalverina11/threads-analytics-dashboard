# Threads Analytics — Performance Studio

A premium, SaaS-style social media analytics dashboard for tracking, monitoring, and
analyzing Threads content performance. Built with React + Vite and Recharts, styled
around a `#045A26` (deep green) + white visual identity.

![Overview](.kiro/artifacts/screenshots/1789612679-01-overview.png)

## Features

- **Overview** — 8 dynamic KPI cards (Total Views, Likes, Comments, Reposts, Shares,
  Engagement Rate, Total Posts, Avg Views/Post) with period-over-period deltas, plus
  views-over-time, engagement mix, pillar reach, and top-content widgets.
- **Analytics** — Views & engagement trends, engagement-rate and avg-views lines,
  performance by content pillar, and content-type breakdowns with interactive tooltips.
- **Content Performance** — A sortable, searchable, filterable table of every post with
  direct links to the original Threads content and clear top / underperformer indicators.
- **Weekly & Monthly Insights** — Auto-generated, plain-language summaries of what changed
  vs the previous period, with percentage changes, strongest pillars, pillar momentum,
  and the highest-performing post.
- **AI Recommendations** — Actionable guidance (what to double down on, create more of,
  when to post, engagement opportunities, what needs improvement, and what to test next).
  Every recommendation lists the exact **data signals** behind it, clearly separated from
  the raw analytics.
- **Global controls** — Date-range presets, pillar and status filters, weekly/monthly
  grouping, a clear indication of the selected reporting period, and CSV export.
- **Responsive** — Works across desktop, tablet, and mobile with an off-canvas sidebar.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Project structure

```
src/
  data/
    sampleData.json     # generated sample dataset (Threads posts)
    dataSource.js       # data-source abstraction (loadPosts, parseCsv, normalizePost)
  lib/
    analytics.js        # KPIs, aggregations, time series, performance flags
    insights.js         # weekly/monthly period comparison + narratives
    recommendations.js  # transparent "AI" rules engine (swap for an LLM later)
    filters.js          # date presets, previous-period, filter application
    dates.js            # week/month bucketing (Monday weeks)
    format.js           # number/percent/date formatting helpers
    export.js           # CSV export for posts and summary reports
    theme.js            # chart color constants
  components/            # Sidebar, Icons, ui primitives, charts, ContentTable
  views/                # Overview, Analytics, ContentPerformance, Weekly, Monthly, AiRecommendations
scripts/
  generateData.mjs      # regenerate sample data: node scripts/generateData.mjs
```

## Data model

Each post record has this shape (see `src/data/dataSource.js`):

| Field         | Type   | Notes                                        |
| ------------- | ------ | -------------------------------------------- |
| `id`          | string | Stable unique id                             |
| `date`        | string | ISO `YYYY-MM-DD`                             |
| `pillar`      | string | Content pillar / category                    |
| `contentType` | string | Text · Image · Carousel · Video · Poll · Link |
| `content`     | string | Post copy / title                            |
| `status`      | string | Published · Scheduled · Draft                |
| `link`        | string | URL to the original Threads post             |
| `views`       | number |                                              |
| `likes`       | number |                                              |
| `comments`    | number |                                              |
| `reposts`     | number |                                              |
| `shares`      | number |                                              |

Only `Published` posts contribute to performance metrics; scheduled/draft posts appear in
the content table for planning.

## Replacing the sample data (CSV / API / database)

The entire app reads data through a single function, `loadPosts()` in
`src/data/dataSource.js`, which returns `{ meta, posts }`. To go live, replace its body —
callers never change. Two ready-to-use paths are included:

- **CSV / spreadsheet** — a dependency-free `parseCsv()` is provided. Point it at an
  exported CSV whose headers match the fields above (case-insensitive; `type`/`url` are
  aliased). Example:

  ```js
  const text = await fetch('/data/threads-export.csv').then((r) => r.text())
  const posts = parseCsv(text).map(normalizePost)
  return { meta: { platform: 'Threads', source: 'csv' }, posts }
  ```

- **API / database** — fetch your records and normalize them:

  ```js
  const { posts } = await fetch('/api/threads/posts').then((r) => r.json())
  return { meta: { platform: 'Threads', source: 'api' }, posts: posts.map(normalizePost) }
  ```

`normalizePost()` coerces types and fills sensible defaults, so partial rows won't break
the dashboard.

## Swapping the recommendation engine

`src/lib/recommendations.js` is a transparent, rules-based engine: each recommendation is
derived from an explicit signal and carries those signals for display. It's isolated
behind `buildRecommendations(posts)`, so it can be replaced with a live LLM or ML model
without touching the UI, as long as the returned recommendation shape is preserved.

> Sample data is synthetic and generated deterministically for demonstration.

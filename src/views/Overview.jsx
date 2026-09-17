import { useMemo } from 'react'
import { Card, CardHead, Section, KpiCard } from '../components/ui'
import { AreaTimeChart, BarBreakdownChart, Legend } from '../components/charts'
import ContentTable from '../components/ContentTable'
import {
  IconEye,
  IconHeart,
  IconComment,
  IconRepost,
  IconShare,
  IconGauge,
  IconDoc,
  IconTrend,
} from '../components/Icons'
import { computeKpis, bucketedSeries, groupBy, withDerived, isLive } from '../lib/analytics'
import { METRIC_COLORS, BRAND, pillarColor } from '../lib/theme'
import { formatCompact } from '../lib/format'

const KPI_ICONS = {
  views: IconEye,
  likes: IconHeart,
  comments: IconComment,
  reposts: IconRepost,
  shares: IconShare,
  engagementRate: IconGauge,
  posts: IconDoc,
  avgViews: IconTrend,
}

export default function Overview({ posts, prevPosts, granularity }) {
  const kpis = useMemo(() => computeKpis(posts, prevPosts), [posts, prevPosts])
  const series = useMemo(() => bucketedSeries(posts, granularity), [posts, granularity])
  const pillars = useMemo(
    () => groupBy(posts, 'pillar').sort((a, b) => b.views - a.views),
    [posts],
  )
  const topPosts = useMemo(
    () =>
      withDerived(posts.filter(isLive))
        .sort((a, b) => b.engagements - a.engagements)
        .slice(0, 6),
    [posts],
  )

  return (
    <>
      <Section title="Key performance indicators" sub="Live (published) content in the selected period">
        <div className="kpi-grid">
          {kpis.cards.map((c) => (
            <KpiCard
              key={c.key}
              label={c.label}
              value={c.value}
              delta={c.delta}
              format={c.format}
              icon={KPI_ICONS[c.key]}
            />
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid-3-2">
          <Card>
            <CardHead
              title="Views over time"
              sub={`Aggregated by ${granularity}`}
              right={<Legend items={[{ label: 'Views', color: METRIC_COLORS.views }]} />}
            />
            <div className="card__body">
              <AreaTimeChart
                data={series}
                series={[{ key: 'views', label: 'Views', color: METRIC_COLORS.views, format: 'compact' }]}
              />
            </div>
          </Card>
          <Card>
            <CardHead title="Engagement mix" sub="Share of total interactions" />
            <div className="card__body">
              <EngagementMix totals={kpis.totals} />
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid-2">
          <Card>
            <CardHead title="Views by content pillar" sub="Total reach per pillar" />
            <div className="card__body">
              <BarBreakdownChart
                data={pillars.map((p) => ({ name: p.key, views: p.views }))}
                xKey="name"
                bar={{ key: 'views', label: 'Views', color: BRAND, format: 'compact' }}
                colors={pillars.map((p) => pillarColor(p.key).color)}
                height={pillars.length * 46 + 20}
              />
            </div>
          </Card>
          <Card>
            <CardHead title="Engagement over time" sub={`Interactions by ${granularity}`} />
            <div className="card__body">
              <AreaTimeChart
                data={series}
                series={[
                  { key: 'engagements', label: 'Engagements', color: METRIC_COLORS.engagements, format: 'compact' },
                ]}
              />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Top performing content" sub="Ranked by total engagements" >
        <Card>
          <div className="card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <ContentTable posts={topPosts} initialSort="engagements" pageSize={6} />
          </div>
        </Card>
      </Section>
    </>
  )
}

function EngagementMix({ totals }) {
  const parts = [
    { key: 'likes', label: 'Likes', value: totals.likes, color: METRIC_COLORS.likes },
    { key: 'comments', label: 'Comments', value: totals.comments, color: METRIC_COLORS.comments },
    { key: 'reposts', label: 'Reposts', value: totals.reposts, color: METRIC_COLORS.reposts },
    { key: 'shares', label: 'Shares', value: totals.shares, color: METRIC_COLORS.shares },
  ]
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 14,
          borderRadius: 8,
          overflow: 'hidden',
          gap: 2,
          marginBottom: 18,
          background: 'var(--brand-tint-2)',
        }}
      >
        {parts.map((p) => (
          <div
            key={p.key}
            title={`${p.label}: ${formatCompact(p.value)}`}
            style={{ width: `${(p.value / sum) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <div className="bar-list">
        {parts.map((p) => (
          <div className="bar-row" key={p.key}>
            <div className="bar-head">
              <b>
                <span
                  style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: p.color,
                    marginRight: 8,
                  }}
                />
                {p.label}
              </b>
              <span>
                {formatCompact(p.value)} · {((p.value / sum) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(p.value / sum) * 100}%`, background: p.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

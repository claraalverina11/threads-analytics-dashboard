import { useMemo } from 'react'
import { Card, CardHead, Section, Delta, PillarBadge } from '../components/ui'
import { BarBreakdownChart, AreaTimeChart, Legend } from '../components/charts'
import { IconTrend, IconTrophy, IconLayers, IconGauge, IconArrowRight } from '../components/Icons'
import { buildPeriodInsights } from '../lib/insights'
import { bucketedSeries } from '../lib/analytics'
import { CATEGORICAL, METRIC_COLORS, BRAND } from '../lib/theme'
import { formatCompact, formatPercent, formatNumber, formatDateLong, truncate } from '../lib/format'

const HEADLINE_ICONS = [IconTrend, IconGauge, IconLayers, IconArrowRight]

export default function PeriodInsights({ posts, granularity }) {
  const report = useMemo(() => buildPeriodInsights(posts, granularity), [posts, granularity])
  const series = useMemo(() => bucketedSeries(posts, granularity), [posts, granularity])
  const word = granularity === 'month' ? 'month' : 'week'

  if (!report) {
    return (
      <div className="empty">
        <p>Not enough published data to generate {word}ly insights for this selection.</p>
      </div>
    )
  }

  const { current, previous, metricRows, topPillar, bestPost, pillarMoves, headlines } = report
  const rangeLabel = `${formatDateLong(fmtISO(current.range.start))} – ${formatDateLong(fmtISO(current.range.end))}`

  return (
    <>
      <Section
        title={`${cap(word)}ly insights`}
        sub={`Latest ${word}: ${current.label} · ${rangeLabel}`}
        right={
          previous ? (
            <span className="period-pill">
              <IconArrowRight /> vs {previous.label}
            </span>
          ) : null
        }
      >
        <div className="insight-hero">
          <Card>
            <CardHead title="What changed this period" sub="Auto-generated summary" />
            <div className="card__body">
              <ul className="headline-list">
                {headlines.map((h, i) => {
                  const Icon = HEADLINE_ICONS[i % HEADLINE_ICONS.length]
                  return (
                    <li key={i}>
                      <span className="ico" aria-hidden>
                        <Icon />
                      </span>
                      <span>{h}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>
          <Card>
            <CardHead title="Period vs previous" sub={previous ? `Compared to ${previous.label}` : 'No prior period'} />
            <div className="card__body">
              <div className="metric-rows">
                {metricRows.map((m) => (
                  <div className="metric-row" key={m.key}>
                    <span className="name">{m.label}</span>
                    <span className="val">
                      {m.isRate ? formatPercent(m.current) : formatCompact(m.current)}
                    </span>
                    <Delta value={m.delta} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid-2">
          <Card>
            <CardHead title="Strongest pillars this period" sub="By total engagement" />
            <div className="card__body">
              <BarBreakdownChart
                data={pillarMoves
                  .slice()
                  .sort((a, b) => b.engagements - a.engagements)
                  .map((p) => ({ name: p.pillar, engagements: p.engagements }))}
                xKey="name"
                bar={{ key: 'engagements', label: 'Engagements', color: BRAND, format: 'compact' }}
                colors={CATEGORICAL}
                height={Math.max(pillarMoves.length * 44 + 20, 160)}
              />
            </div>
          </Card>
          <Card>
            <CardHead title="Pillar momentum" sub={`Engagement change vs previous ${word}`} />
            <div className="card__body">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Pillar</th>
                      <th className="num">Engagements</th>
                      <th className="num">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillarMoves.map((p) => (
                      <tr key={p.pillar}>
                        <td>{p.pillar}</td>
                        <td className="num">{formatNumber(p.engagements)}</td>
                        <td className="num">
                          <Delta value={p.delta} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid-3-2">
          <Card>
            <CardHead
              title={`${cap(word)}ly trend`}
              sub="Views across all periods"
              right={<Legend items={[{ label: 'Views', color: METRIC_COLORS.views }]} />}
            />
            <div className="card__body">
              <AreaTimeChart
                data={series}
                series={[{ key: 'views', label: 'Views', color: METRIC_COLORS.views, format: 'compact' }]}
                height={240}
              />
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topPillar && (
              <Card>
                <CardHead title="Strongest pillar" right={<span className="flag flag--top"><IconLayers /> Leader</span>} />
                <div className="card__body">
                  <div style={{ marginBottom: 10 }}>
                    <PillarBadge pillar={topPillar.key} />
                  </div>
                  <div className="stat-inline">
                    <div className="s">
                      <b>{formatCompact(topPillar.engagements)}</b>
                      <span>Engagements</span>
                    </div>
                    <div className="s">
                      <b>{formatPercent(topPillar.engagementRate)}</b>
                      <span>Eng. rate</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {bestPost && (
              <Card>
                <CardHead title="Highest-performing post" right={<span className="flag flag--top"><IconTrophy /> Top</span>} />
                <div className="card__body">
                  <div style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: 8, lineHeight: 1.4 }}>
                    {truncate(bestPost.content, 76)}
                  </div>
                  <div className="stat-inline">
                    <div className="s">
                      <b>{formatCompact(bestPost.views)}</b>
                      <span>Views</span>
                    </div>
                    <div className="s">
                      <b>{formatCompact(bestPost.engagements)}</b>
                      <span>Engagements</span>
                    </div>
                    <div className="s">
                      <b>{formatPercent(bestPost.engagementRate)}</b>
                      <span>Eng. rate</span>
                    </div>
                  </div>
                  {bestPost.link && (
                    <a
                      href={bestPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 600 }}
                    >
                      View on Threads →
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </Section>
    </>
  )
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function fmtISO(d) {
  // Convert a Date to YYYY-MM-DD for the formatter.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

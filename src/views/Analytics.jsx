import { useMemo } from 'react'
import { Card, CardHead, Section } from '../components/ui'
import { AreaTimeChart, LineTimeChart, BarBreakdownChart, Legend } from '../components/charts'
import { bucketedSeries, groupBy } from '../lib/analytics'
import { CATEGORICAL, METRIC_COLORS, BRAND, BRAND_400 } from '../lib/theme'
import { formatCompact, formatPercent, formatNumber } from '../lib/format'

export default function Analytics({ posts, granularity }) {
  const series = useMemo(() => bucketedSeries(posts, granularity), [posts, granularity])
  const pillars = useMemo(
    () => groupBy(posts, 'pillar').sort((a, b) => b.engagements - a.engagements),
    [posts],
  )

  return (
    <>
      <Section title="Views & engagement trend" sub={`Tracked by ${granularity} across the selected period`}>
        <Card>
          <CardHead
            right={
              <Legend
                items={[
                  { label: 'Views', color: METRIC_COLORS.views },
                  { label: 'Engagements', color: METRIC_COLORS.engagements },
                ]}
              />
            }
          />
          <div className="card__body" style={{ paddingTop: 0 }}>
            <AreaTimeChart
              data={series}
              height={300}
              series={[
                { key: 'views', label: 'Views', color: METRIC_COLORS.views, format: 'compact' },
                { key: 'engagements', label: 'Engagements', color: METRIC_COLORS.engagements, format: 'compact' },
              ]}
            />
          </div>
        </Card>
      </Section>

      <Section>
        <div className="grid-2">
          <Card>
            <CardHead
              title="Engagement rate over time"
              sub="Interactions ÷ views"
              right={<Legend items={[{ label: 'Eng. rate', color: METRIC_COLORS.engagementRate }]} />}
            />
            <div className="card__body">
              <LineTimeChart
                data={series}
                series={[
                  { key: 'engagementRate', label: 'Engagement rate', color: METRIC_COLORS.engagementRate, format: 'percent' },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHead
              title="Avg views per post"
              sub={`Efficiency by ${granularity}`}
              right={<Legend items={[{ label: 'Avg views', color: BRAND_400 }]} />}
            />
            <div className="card__body">
              <LineTimeChart
                data={series}
                series={[{ key: 'avgViews', label: 'Avg views / post', color: BRAND_400, format: 'compact' }]}
              />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Performance by content pillar" sub="Which themes drive reach and interaction">
        <div className="grid-2">
          <Card>
            <CardHead title="Engagements by pillar" />
            <div className="card__body">
              <BarBreakdownChart
                data={pillars.map((p) => ({ name: p.key, engagements: p.engagements }))}
                xKey="name"
                bar={{ key: 'engagements', label: 'Engagements', color: BRAND, format: 'compact' }}
                colors={CATEGORICAL}
                height={pillars.length * 46 + 20}
              />
            </div>
          </Card>
          <Card>
            <CardHead title="Pillar efficiency" sub="Engagement rate & avg views" />
            <div className="card__body">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Pillar</th>
                      <th className="num">Posts</th>
                      <th className="num">Avg views</th>
                      <th className="num">Eng. rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillars.map((p, i) => (
                      <tr key={p.key}>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 9,
                              height: 9,
                              borderRadius: 3,
                              background: CATEGORICAL[i % CATEGORICAL.length],
                              marginRight: 8,
                            }}
                          />
                          {p.key}
                        </td>
                        <td className="num">{formatNumber(p.posts)}</td>
                        <td className="num">{formatCompact(p.avgViews)}</td>
                        <td className="num">{formatPercent(p.engagementRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </>
  )
}

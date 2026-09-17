import { useMemo } from 'react'
import { Card, Section } from '../components/ui'
import { IconSpark, IconTarget, IconBulb, IconFlask, IconTrend, IconAlert, IconGauge } from '../components/Icons'
import { buildRecommendations } from '../lib/recommendations'
import { formatPercent } from '../lib/format'

const CAT_ICON = {
  invest: IconTrend,
  create: IconTarget,
  timing: IconGauge,
  engage: IconBulb,
  improve: IconAlert,
  test: IconFlask,
}

export default function AiRecommendations({ posts, periodLabel }) {
  const { recs, generatedFrom, avgEngagementRate } = useMemo(() => buildRecommendations(posts), [posts])

  return (
    <>
      <Section>
        <div className="ai-banner">
          <span className="spark" aria-hidden>
            <IconSpark />
          </span>
          <div>
            <h3>AI Recommendations</h3>
            <p>
              These suggestions are generated from your performance data for <b>{periodLabel}</b> — analyzing{' '}
              {generatedFrom} published posts across pillars, formats, timing, and engagement patterns. Each card lists
              the exact data signals behind it, so you can distinguish AI guidance from the raw analytics.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Prioritized actions"
        sub={
          avgEngagementRate != null
            ? `Benchmarked against your ${formatPercent(avgEngagementRate)} average engagement rate`
            : undefined
        }
      >
        {recs.length === 0 ? (
          <Card>
            <div className="card__body">
              <p className="muted">
                Not enough published content in this selection to generate reliable recommendations. Widen the date
                range or clear filters to see AI guidance.
              </p>
            </div>
          </Card>
        ) : (
          <div className="rec-grid">
            {recs.map((r) => {
              const Icon = CAT_ICON[r.category] || IconBulb
              return (
                <article className="rec" key={r.id}>
                  <div className="rec__top">
                    <span className={`rec__cat tone-${r.meta.tone}`}>{r.meta.label}</span>
                    <div className="spacer" style={{ flex: 1 }} />
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--brand-tint)',
                        color: 'var(--brand)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                      aria-hidden
                    >
                      <Icon width={16} height={16} />
                    </span>
                  </div>
                  <h4>{r.title}</h4>
                  <p>{r.detail}</p>
                  <div className="rec__signals">
                    <span className="lbl">Data signals</span>
                    <ul>
                      {r.signals.map((s, i) => (
                        <li key={i}>
                          <span className="dot" aria-hidden />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Section>

      <Section>
        <Card>
          <div className="card__body">
            <p className="muted" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
              <b style={{ color: 'var(--ink-700)' }}>How this works:</b> Recommendations are produced by a transparent
              rules engine that compares each pillar, format, and posting day against your account averages and recent
              momentum. No recommendation is shown without a supporting signal. This module is architected so the
              heuristic engine can be swapped for a live LLM or ML model without changing the dashboard.
            </p>
          </div>
        </Card>
      </Section>
    </>
  )
}

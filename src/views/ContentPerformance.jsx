import { useMemo, useState } from 'react'
import { Card, CardHead, Section } from '../components/ui'
import ContentTable from '../components/ContentTable'
import { IconSearch, IconTrophy, IconAlert, IconDownload } from '../components/Icons'
import { withDerived, performanceFlags, isLive } from '../lib/analytics'
import { exportPostsCsv } from '../lib/export'
import { formatCompact, formatPercent, truncate } from '../lib/format'

export default function ContentPerformance({ posts, periodLabel, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const types = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.contentType))).sort()],
    [posts],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      if (typeFilter !== 'All' && p.contentType !== typeFilter) return false
      if (q && !p.content.toLowerCase().includes(q) && !p.pillar.toLowerCase().includes(q)) return false
      return true
    })
  }, [posts, query, typeFilter])

  const flags = useMemo(() => performanceFlags(posts), [posts])
  const live = useMemo(() => withDerived(posts.filter(isLive)), [posts])
  const top = useMemo(() => [...live].sort((a, b) => b.engagementRate - a.engagementRate)[0], [live])
  const low = useMemo(
    () => [...live].filter((p) => p.views > 0).sort((a, b) => a.engagementRate - b.engagementRate)[0],
    [live],
  )
  const topCount = [...flags.values()].filter((v) => v === 'top').length
  const lowCount = [...flags.values()].filter((v) => v === 'low').length

  return (
    <>
      <Section title="Content performance" sub={`Inspect every post · ${periodLabel}`}>
        <div className="grid-2">
          {top && (
            <Card>
              <CardHead
                title="Top performer"
                right={
                  <span className="flag flag--top">
                    <IconTrophy /> {topCount} flagged
                  </span>
                }
              />
              <div className="card__body">
                <div style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>
                  {truncate(top.content, 72)}
                </div>
                <div className="stat-inline">
                  <div className="s">
                    <b>{formatCompact(top.views)}</b>
                    <span>Views</span>
                  </div>
                  <div className="s">
                    <b>{formatCompact(top.engagements)}</b>
                    <span>Engagements</span>
                  </div>
                  <div className="s">
                    <b>{formatPercent(top.engagementRate)}</b>
                    <span>Eng. rate</span>
                  </div>
                  <div className="s">
                    <b>{top.pillar}</b>
                    <span>Pillar</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {low && (
            <Card>
              <CardHead
                title="Needs attention"
                right={
                  <span className="flag flag--low">
                    <IconAlert /> {lowCount} flagged
                  </span>
                }
              />
              <div className="card__body">
                <div style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}>
                  {truncate(low.content, 72)}
                </div>
                <div className="stat-inline">
                  <div className="s">
                    <b>{formatCompact(low.views)}</b>
                    <span>Views</span>
                  </div>
                  <div className="s">
                    <b>{formatCompact(low.engagements)}</b>
                    <span>Engagements</span>
                  </div>
                  <div className="s">
                    <b>{formatPercent(low.engagementRate)}</b>
                    <span>Eng. rate</span>
                  </div>
                  <div className="s">
                    <b>{low.pillar}</b>
                    <span>Pillar</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Section>

      <Section>
        <Card>
          <CardHead
            title="All content"
            sub={`${filtered.length} posts`}
            right={
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search">
                  <IconSearch />
                  <input
                    type="search"
                    placeholder="Search content or pillar…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search content"
                  />
                </div>
                <select
                  className="select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by content type"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All types' : t}
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={() => exportPostsCsv(filtered)}>
                  <IconDownload /> Export
                </button>
              </div>
            }
          />
          <div className="card__body" style={{ paddingTop: 6 }}>
            <ContentTable posts={filtered} initialSort="views" pageSize={14} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </Card>
      </Section>
    </>
  )
}

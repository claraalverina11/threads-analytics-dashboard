import { useEffect, useMemo, useState } from 'react'
import './styles/app.css'
import Sidebar from './components/Sidebar'
import { IconMenu, IconDownload, IconExternal } from './components/Icons'
import Overview from './views/Overview'
import Analytics from './views/Analytics'
import ContentPerformance from './views/ContentPerformance'
import Weekly from './views/Weekly'
import Monthly from './views/Monthly'
import AiRecommendations from './views/AiRecommendations'
import { loadPosts } from './data/dataSource'
import {
  DATE_PRESETS,
  resolveRange,
  previousRange,
  applyFilters,
  uniquePillars,
  uniqueStatuses,
} from './lib/filters'
import { computeKpis } from './lib/analytics'
import { exportSummaryCsv } from './lib/export'
import { formatDateLong } from './lib/format'

const VIEW_META = {
  overview: { title: 'Overview', sub: 'Account-wide performance at a glance' },
  analytics: { title: 'Analytics', sub: 'Trends, pillars, and content-type deep dive' },
  content: { title: 'Content Performance', sub: 'Every post, sortable and searchable' },
  weekly: { title: 'Weekly Insights', sub: 'Auto-summarized week-over-week changes' },
  monthly: { title: 'Monthly Insights', sub: 'Auto-summarized month-over-month changes' },
  ai: { title: 'AI Recommendations', sub: 'Actionable guidance from your data' },
}

export default function App() {
  const [data, setData] = useState(null)
  const [view, setView] = useState('overview')
  const [navOpen, setNavOpen] = useState(false)

  // Global filters
  const [preset, setPreset] = useState('90d')
  const [pillar, setPillar] = useState('All')
  const [status, setStatus] = useState('All')
  const [granularity, setGranularity] = useState('week')

  useEffect(() => {
    let alive = true
    loadPosts().then((res) => {
      if (alive) setData(res)
    })
    return () => {
      alive = false
    }
  }, [])

  const allPosts = useMemo(() => data?.posts ?? [], [data])

  const range = useMemo(() => resolveRange(preset, allPosts), [preset, allPosts])
  const prevRange = useMemo(() => previousRange(range), [range])

  const filtered = useMemo(
    () => applyFilters(allPosts, { range, pillar, status }),
    [allPosts, range, pillar, status],
  )
  const prevFiltered = useMemo(
    () => applyFilters(allPosts, { range: prevRange, pillar, status }),
    [allPosts, prevRange, pillar, status],
  )

  const pillars = useMemo(() => uniquePillars(allPosts), [allPosts])
  const statuses = useMemo(() => uniqueStatuses(allPosts), [allPosts])

  const periodLabel = `${formatDateLong(range.start)} – ${formatDateLong(range.end)}`

  function handleExport() {
    const kpis = computeKpis(filtered, prevFiltered)
    exportSummaryCsv(kpis, periodLabel)
  }

  function navigate(id) {
    setView(id)
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!data) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading Threads analytics…</p>
      </div>
    )
  }

  const meta = VIEW_META[view]

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}`}>
      <div className="backdrop" onClick={() => setNavOpen(false)} />
      <Sidebar active={view} onNavigate={navigate} account={data.meta.account} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setNavOpen((o) => !o)} aria-label="Toggle navigation">
            <IconMenu width={20} height={20} />
          </button>
          <div className="topbar__title">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className="topbar__spacer" />
          <span className="period-pill" title="Currently selected reporting period">
            {periodLabel}
          </span>
        </header>

        <div className="filterbar">
          <div className="filter">
            <span className="filter__label">Date range</span>
            <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Date range">
              {DATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter">
            <span className="filter__label">Pillar</span>
            <select className="select" value={pillar} onChange={(e) => setPillar(e.target.value)} aria-label="Content pillar">
              {pillars.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All pillars' : p}
                </option>
              ))}
            </select>
          </div>
          <div className="filter">
            <span className="filter__label">Status</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Post status">
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All statuses' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="filterbar__spacer" />

          {(view === 'overview' || view === 'analytics' || view === 'weekly' || view === 'monthly') && (
            <div className="filter">
              <span className="filter__label">Group by</span>
              <div className="segmented" role="group" aria-label="Group by period">
                <button
                  className={granularity === 'week' ? 'is-active' : ''}
                  onClick={() => setGranularity('week')}
                >
                  Weekly
                </button>
                <button
                  className={granularity === 'month' ? 'is-active' : ''}
                  onClick={() => setGranularity('month')}
                >
                  Monthly
                </button>
              </div>
            </div>
          )}

          <div className="filter" style={{ justifyContent: 'flex-end' }}>
            <span className="filter__label" aria-hidden>
              &nbsp;
            </span>
            <button className="btn btn--primary" onClick={handleExport}>
              <IconDownload /> Export report
            </button>
          </div>
        </div>

        <main className="content">
          {filtered.length === 0 ? (
            <div className="empty">
              <p>No posts match the current filters. Try widening the date range or clearing filters.</p>
              <button className="btn" onClick={() => { setPreset('all'); setPillar('All'); setStatus('All') }}>
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {view === 'overview' && (
                <Overview posts={filtered} prevPosts={prevFiltered} granularity={granularity} />
              )}
              {view === 'analytics' && <Analytics posts={filtered} granularity={granularity} />}
              {view === 'content' && <ContentPerformance posts={filtered} periodLabel={periodLabel} />}
              {view === 'weekly' && <Weekly posts={filtered} />}
              {view === 'monthly' && <Monthly posts={filtered} />}
              {view === 'ai' && <AiRecommendations posts={filtered} periodLabel={periodLabel} />}
            </>
          )}

          <footer style={{ marginTop: 40, paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {data.meta.platform} · {data.meta.account} · {allPosts.length} posts in dataset · sample data
            </span>
            <div style={{ flex: 1 }} />
            <a className="muted" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }} href="https://www.threads.net" target="_blank" rel="noopener noreferrer">
              Open Threads <IconExternal width={13} height={13} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  )
}

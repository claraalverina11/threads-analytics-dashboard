import { useMemo, useState, useSyncExternalStore } from 'react'
import './styles/app.css'
import Sidebar from './components/Sidebar'
import { IconMenu, IconDownload, IconExternal, IconPlus, IconTable, IconUpload, IconTrash } from './components/Icons'
import Overview from './views/Overview'
import Analytics from './views/Analytics'
import ContentPerformance from './views/ContentPerformance'
import PeriodInsights from './views/PeriodInsights'
import AiRecommendations from './views/AiRecommendations'
import LogPostModal from './components/LogPostModal'
import ImportModal from './components/ImportModal'
import {
  subscribe,
  getSnapshot,
  getMeta,
  addPost,
  updatePost,
  deletePost,
  addMany,
  replaceAll,
  clearAll,
} from './lib/postsStore'
import {
  DATE_MODES,
  WEEK_OPTIONS,
  resolveRange,
  previousRange,
  applyFilters,
  monthsInData,
  monthKeyLabel,
} from './lib/filters'
import { PILLARS, STATUSES } from './lib/constants'
import { computeKpis } from './lib/analytics'
import { exportSummaryCsv, exportPostsCsv } from './lib/export'
import { formatDateLong } from './lib/format'

const VIEW_META = {
  overview: { title: 'Overview', sub: 'Account-wide performance at a glance' },
  analytics: { title: 'Analytics', sub: 'Trends, pillars, and content-type deep dive' },
  content: { title: 'Content Performance', sub: 'Every post, sortable and searchable' },
  insights: { title: 'Insights', sub: 'Auto-summarized period-over-period changes' },
  ai: { title: 'AI Recommendations', sub: 'Actionable guidance from your data' },
}

// Views that support the weekly/monthly Group by toggle.
const GROUPED_VIEWS = new Set(['overview', 'analytics', 'insights'])

export default function App() {
  // The posts store is the source of truth (localStorage-backed).
  const allPosts = useSyncExternalStore(subscribe, getSnapshot)
  // meta is cheap to derive and depends on the current posts snapshot.
  const meta = getMeta()

  const [view, setView] = useState('overview')
  const [navOpen, setNavOpen] = useState(false)

  // Log Post modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  // Import modal state
  const [importOpen, setImportOpen] = useState(false)

  // Global filters. The date filter is data-based (never anchored to today):
  //   mode: all | month | week | custom
  const [dateMode, setDateMode] = useState('all')
  const [monthSel, setMonthSel] = useState('') // 'YYYY-MM'
  const [weekSel, setWeekSel] = useState(1) // 1..4
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [pillar, setPillar] = useState('All')
  const [status, setStatus] = useState('All')
  const [granularity, setGranularity] = useState('week')

  // Months available in the data; default the month selector to the latest.
  const months = useMemo(() => monthsInData(allPosts), [allPosts])
  const activeMonth = monthSel && months.includes(monthSel) ? monthSel : months[months.length - 1] || ''

  const dateFilter = useMemo(
    () => ({ mode: dateMode, month: activeMonth, week: weekSel, custom }),
    [dateMode, activeMonth, weekSel, custom],
  )
  const range = useMemo(() => resolveRange(dateFilter, allPosts), [dateFilter, allPosts])
  const prevRange = useMemo(() => previousRange(range), [range])

  // Under "All time" we keep undated posts visible; a specific window filters them.
  const dateFilterActive = dateMode !== 'all'
  const filtered = useMemo(
    () => applyFilters(allPosts, { range, pillar, status, dateFilterActive }),
    [allPosts, range, pillar, status, dateFilterActive],
  )
  const prevFiltered = useMemo(
    () => applyFilters(allPosts, { range: prevRange, pillar, status, dateFilterActive }),
    [allPosts, prevRange, pillar, status, dateFilterActive],
  )

  // Filter option lists — always show the canonical pillars/statuses so the
  // dropdowns are usable even before anything is logged.
  const pillars = useMemo(() => ['All', ...PILLARS], [])
  const statuses = useMemo(() => ['All', ...STATUSES], [])

  const periodLabel = `${formatDateLong(range.start)} – ${formatDateLong(range.end)}`
  const hasPosts = allPosts.length > 0

  function handleExport() {
    const kpis = computeKpis(filtered, prevFiltered)
    exportSummaryCsv(kpis, periodLabel)
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(post) {
    setEditing(post)
    setModalOpen(true)
  }
  function handleSave(values) {
    if (editing) updatePost(editing.id, values)
    else addPost(values)
    setModalOpen(false)
    setEditing(null)
  }
  function handleDelete(post) {
    if (window.confirm(`Delete this post?\n\n“${post.content.slice(0, 80)}”`)) deletePost(post.id)
  }
  function handleImport(posts, mode) {
    if (mode === 'replace') replaceAll(posts)
    else addMany(posts)
    setImportOpen(false)
  }
  function handleClearAll() {
    if (
      window.confirm(
        `Clear all ${allPosts.length} ${allPosts.length === 1 ? 'post' : 'posts'}? This removes everything saved in this browser and cannot be undone.`,
      )
    ) {
      clearAll()
    }
  }

  function navigate(id) {
    setView(id)
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const vmeta = VIEW_META[view]

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}`}>
      <div className="backdrop" onClick={() => setNavOpen(false)} />
      <Sidebar active={view} onNavigate={navigate} account={meta.account} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setNavOpen((o) => !o)} aria-label="Toggle navigation">
            <IconMenu width={20} height={20} />
          </button>
          <div className="topbar__title">
            <h1>{vmeta.title}</h1>
            <p>{vmeta.sub}</p>
          </div>
          <div className="topbar__spacer" />
          {hasPosts && (
            <span className="period-pill" title="Currently selected reporting period">
              {periodLabel}
            </span>
          )}
          <button className="btn" onClick={() => setImportOpen(true)}>
            <IconUpload /> Import
          </button>
          <button className="btn btn--primary" onClick={openCreate}>
            <IconPlus /> Log post
          </button>
        </header>

        {hasPosts && (
          <div className="filterbar">
            <div className="filter">
              <span className="filter__label">Date filter</span>
              <select
                className="select"
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value)}
                aria-label="Date filter mode"
              >
                {DATE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {(dateMode === 'month' || dateMode === 'week') && (
              <div className="filter">
                <span className="filter__label">Month</span>
                <select
                  className="select"
                  value={activeMonth}
                  onChange={(e) => setMonthSel(e.target.value)}
                  aria-label="Month"
                  disabled={months.length === 0}
                >
                  {months.length === 0 ? (
                    <option>No data</option>
                  ) : (
                    months.map((ym) => (
                      <option key={ym} value={ym}>
                        {monthKeyLabel(ym)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {dateMode === 'week' && (
              <div className="filter">
                <span className="filter__label">Week</span>
                <select
                  className="select"
                  value={weekSel}
                  onChange={(e) => setWeekSel(Number(e.target.value))}
                  aria-label="Week of month"
                >
                  {WEEK_OPTIONS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label} ({w.from}–{w.to === 31 ? 'end' : w.to})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dateMode === 'custom' && (
              <>
                <div className="filter">
                  <span className="filter__label">From</span>
                  <input
                    type="date"
                    className="field"
                    value={custom.start}
                    onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                    aria-label="Custom start date"
                  />
                </div>
                <div className="filter">
                  <span className="filter__label">To</span>
                  <input
                    type="date"
                    className="field"
                    value={custom.end}
                    onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                    aria-label="Custom end date"
                  />
                </div>
              </>
            )}

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

            {GROUPED_VIEWS.has(view) && (
              <div className="filter">
                <span className="filter__label">Group by</span>
                <div className="segmented" role="group" aria-label="Group by period">
                  <button className={granularity === 'week' ? 'is-active' : ''} onClick={() => setGranularity('week')}>
                    Weekly
                  </button>
                  <button className={granularity === 'month' ? 'is-active' : ''} onClick={() => setGranularity('month')}>
                    Monthly
                  </button>
                </div>
              </div>
            )}

            <div className="filter" style={{ justifyContent: 'flex-end' }}>
              <span className="filter__label" aria-hidden>
                &nbsp;
              </span>
              <button className="btn" onClick={handleExport}>
                <IconDownload /> Export report
              </button>
            </div>
          </div>
        )}

        <main className="content">
          {!hasPosts ? (
            <div className="empty-state">
              <span className="es-icon" aria-hidden>
                <IconTable width={30} height={30} />
              </span>
              <h2>No posts logged yet</h2>
              <p>
                Start building your dashboard by logging your Threads posts one by one, or bulk-import a whole week by
                pasting from your spreadsheet. Your KPIs, charts, insights, and AI recommendations update automatically.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn btn--primary" onClick={openCreate}>
                  <IconPlus /> Log a post
                </button>
                <button className="btn" onClick={() => setImportOpen(true)}>
                  <IconUpload /> Import from spreadsheet
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <p>No posts match the current filters. Try widening the date range or clearing filters.</p>
              <button
                className="btn"
                onClick={() => {
                  setDateMode('all')
                  setPillar('All')
                  setStatus('All')
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {view === 'overview' && <Overview posts={filtered} prevPosts={prevFiltered} granularity={granularity} />}
              {view === 'analytics' && <Analytics posts={filtered} granularity={granularity} />}
              {view === 'content' && (
                <ContentPerformance posts={filtered} periodLabel={periodLabel} onEdit={openEdit} onDelete={handleDelete} />
              )}
              {view === 'insights' && <PeriodInsights posts={filtered} granularity={granularity} />}
              {view === 'ai' && <AiRecommendations posts={filtered} periodLabel={periodLabel} />}
            </>
          )}

          <footer
            style={{
              marginTop: 40,
              paddingTop: 18,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span className="muted" style={{ fontSize: 12 }}>
              {meta.platform} · {meta.account} · {allPosts.length} {allPosts.length === 1 ? 'post' : 'posts'} logged ·
              saved to this browser
            </span>
            <div style={{ flex: 1 }} />
            {hasPosts && (
              <>
                <button
                  className="muted"
                  onClick={() => exportPostsCsv(allPosts)}
                  style={{
                    fontSize: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'var(--ink-400)',
                  }}
                >
                  <IconDownload width={13} height={13} /> Export all posts (CSV)
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    fontSize: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'var(--neg)',
                    fontWeight: 550,
                  }}
                >
                  <IconTrash width={13} height={13} /> Clear all data
                </button>
              </>
            )}
            <a
              className="muted"
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              href="https://www.threads.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Threads <IconExternal width={13} height={13} />
            </a>
          </footer>
        </main>
      </div>

      <LogPostModal
        open={modalOpen}
        initial={editing}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />

      <ImportModal
        open={importOpen}
        hasExisting={hasPosts}
        onImport={handleImport}
        onClose={() => setImportOpen(false)}
      />
    </div>
  )
}

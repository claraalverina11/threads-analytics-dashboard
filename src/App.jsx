import { useMemo, useState, useSyncExternalStore } from 'react'
import './styles/app.css'
import Sidebar from './components/Sidebar'
import { IconMenu, IconDownload, IconExternal, IconPlus, IconTable, IconUpload } from './components/Icons'
import Overview from './views/Overview'
import Analytics from './views/Analytics'
import ContentPerformance from './views/ContentPerformance'
import Weekly from './views/Weekly'
import Monthly from './views/Monthly'
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
} from './lib/postsStore'
import {
  DATE_PRESETS,
  resolveRange,
  previousRange,
  applyFilters,
} from './lib/filters'
import { PILLARS, STATUSES } from './lib/constants'
import { computeKpis } from './lib/analytics'
import { parsePostsText } from './data/dataSource'
import { WEEK1_SEP_CSV } from './data/week1Sep'
import { exportSummaryCsv, exportPostsCsv } from './lib/export'
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

  // Global filters
  const [preset, setPreset] = useState('all')
  const [pillar, setPillar] = useState('All')
  const [status, setStatus] = useState('All')
  const [granularity, setGranularity] = useState('week')

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
  function loadWeek1Sample() {
    const posts = parsePostsText(WEEK1_SEP_CSV)
    replaceAll(posts)
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
              <button
                className="muted"
                onClick={loadWeek1Sample}
                style={{
                  marginTop: 4,
                  fontSize: 12.5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--brand-500)',
                  fontWeight: 600,
                }}
              >
                or load the Week 1 September sample (156 posts) →
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <p>No posts match the current filters. Try widening the date range or clearing filters.</p>
              <button
                className="btn"
                onClick={() => {
                  setPreset('all')
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
              {view === 'weekly' && <Weekly posts={filtered} />}
              {view === 'monthly' && <Monthly posts={filtered} />}
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

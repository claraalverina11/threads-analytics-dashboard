import { useMemo, useState } from 'react'
import { formatCompact, formatNumber, formatPercent, formatDate } from '../lib/format'
import { withDerived, performanceFlags } from '../lib/analytics'
import { PillarBadge, StatusBadge } from './ui'
import { IconExternal, IconTrophy, IconAlert, IconEdit, IconTrash } from './Icons'

const COLUMNS = [
  { key: 'date', label: 'Date', num: false, sortable: true },
  { key: 'pillar', label: 'Pillar', num: false, sortable: true },
  { key: 'status', label: 'Status', num: false, sortable: true },
  { key: 'views', label: 'Views', num: true, sortable: true },
  { key: 'likes', label: 'Likes', num: true, sortable: true },
  { key: 'comments', label: 'Comments', num: true, sortable: true },
  { key: 'reposts', label: 'Reposts', num: true, sortable: true },
  { key: 'shares', label: 'Shares', num: true, sortable: true },
  { key: 'engagementRate', label: 'Eng. Rate', num: true, sortable: true },
  { key: 'link', label: '', num: true, sortable: false },
]

export default function ContentTable({ posts, initialSort = 'views', pageSize = 12, onEdit, onDelete }) {
  const showActions = Boolean(onEdit || onDelete)
  const [sortKey, setSortKey] = useState(initialSort)
  const [sortDir, setSortDir] = useState('desc')
  const [limit, setLimit] = useState(pageSize)

  const flags = useMemo(() => performanceFlags(posts), [posts])
  const derived = useMemo(() => withDerived(posts), [posts])

  const sorted = useMemo(() => {
    const arr = [...derived]
    arr.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = String(bv).toLowerCase()
        return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : av > bv ? -1 : av < bv ? 1 : 0
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return arr
  }, [derived, sortKey, sortDir])

  const visible = sorted.slice(0, limit)

  function toggleSort(key) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'pillar' || key === 'status' || key === 'date' ? 'asc' : 'desc')
    }
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key || 'link'}
                  className={`${c.num ? 'num' : ''} ${c.sortable ? 'sortable' : ''}`}
                  onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                  aria-sort={
                    c.sortable && sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {c.label}
                  {c.sortable && sortKey === c.key && (
                    <span className="arrow" aria-hidden>
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
              {showActions && <th className="num col-actions" aria-label="Actions">Edit</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const flag = flags.get(p.id)
              return (
                <tr key={p.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.date)}</td>
                  <td>
                    <div className="cell-title" title={p.content}>
                      <PillarBadge pillar={p.pillar} />
                      {flag === 'top' && (
                        <span className="flag flag--top" title="Top performer">
                          <IconTrophy /> Top
                        </span>
                      )}
                      {flag === 'low' && (
                        <span className="flag flag--low" title="Underperforming">
                          <IconAlert /> Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="num">{formatCompact(p.views)}</td>
                  <td className="num">{formatCompact(p.likes)}</td>
                  <td className="num">{formatNumber(p.comments)}</td>
                  <td className="num">{formatNumber(p.reposts)}</td>
                  <td className="num">{formatNumber(p.shares)}</td>
                  <td className="num">{p.status === 'Published' ? formatPercent(p.engagementRate) : '—'}</td>
                  <td className="num">
                    {p.link ? (
                      <a
                        className="linkout"
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open on Threads"
                        aria-label="Open original post on Threads"
                      >
                        <IconExternal />
                      </a>
                    ) : null}
                  </td>
                  {showActions && (
                    <td className="num col-actions">
                      <div className="row-actions">
                        {onEdit && (
                          <button className="row-btn" title="Edit post" aria-label="Edit post" onClick={() => onEdit(p)}>
                            <IconEdit />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="row-btn danger"
                            title="Delete post"
                            aria-label="Delete post"
                            onClick={() => onDelete(p)}
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + (showActions ? 1 : 0)} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-400)' }}>
                  No posts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > limit && (
        <div style={{ padding: '14px 4px 2px', textAlign: 'center' }}>
          <button className="btn" onClick={() => setLimit((l) => l + pageSize)}>
            Show more ({sorted.length - limit} remaining)
          </button>
        </div>
      )}
    </>
  )
}

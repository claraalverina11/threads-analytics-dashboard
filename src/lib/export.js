// CSV export utilities for the current filtered dataset and reports.
import { withDerived } from './analytics'

function toCsvValue(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function download(filename, text, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportPostsCsv(posts, filename = 'threads-content-export.csv') {
  const rows = withDerived(posts)
  const headers = [
    'id',
    'date',
    'pillar',
    'contentType',
    'content',
    'status',
    'link',
    'views',
    'likes',
    'comments',
    'reposts',
    'shares',
    'engagements',
    'engagementRate',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => (h === 'engagementRate' ? r[h].toFixed(2) : toCsvValue(r[h])))
        .join(','),
    )
  }
  download(filename, lines.join('\n'))
}

/** Export a KPI summary report as CSV. */
export function exportSummaryCsv(kpis, periodLabel, filename = 'threads-summary-report.csv') {
  const lines = [`Threads Analytics Summary,${periodLabel}`, '', 'Metric,Value,Change vs previous']
  for (const c of kpis.cards) {
    const value =
      c.format === 'percent' ? `${c.value.toFixed(2)}%` : Math.round(c.value)
    const delta = c.delta == null ? '' : `${c.delta > 0 ? '+' : ''}${c.delta.toFixed(1)}%`
    lines.push([toCsvValue(c.label), value, delta].join(','))
  }
  download(filename, lines.join('\n'))
}

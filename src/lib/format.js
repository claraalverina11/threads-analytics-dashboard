// Formatting helpers used across the dashboard.

export function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function formatPercent(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}

/** Signed percent for deltas, e.g. +12.4% / -3.1% */
export function formatDelta(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

export function formatDate(iso, opts = { month: 'short', day: 'numeric' }) {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', opts)
}

export function formatDateLong(iso) {
  return formatDate(iso, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Percentage change from a -> b, guarding divide-by-zero. */
export function pctChange(prev, curr) {
  if (prev === 0 || prev == null) {
    if (curr === 0 || curr == null) return 0
    return 100 // treat growth from zero as +100% for display
  }
  return ((curr - prev) / prev) * 100
}

export function truncate(str, len = 64) {
  if (!str) return ''
  return str.length > len ? `${str.slice(0, len - 1)}…` : str
}

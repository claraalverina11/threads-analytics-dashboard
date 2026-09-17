// Global filtering: date range presets, pillar/status filters, and the
// derivation of the "previous period" comparison window.
import { toDate } from './dates'
import { differenceInCalendarDays, addDays, format } from 'date-fns'

// Date-filter modes. All windows are derived from the DATA, never from the
// current time.
export const DATE_MODES = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'By month' },
  { id: 'week', label: 'By week' },
  { id: 'custom', label: 'Custom range' },
]

// Weeks within a month are fixed calendar blocks so "Week 1–4" is predictable.
export const WEEK_OPTIONS = [
  { id: 1, label: 'Week 1', from: 1, to: 7 },
  { id: 2, label: 'Week 2', from: 8, to: 14 },
  { id: 3, label: 'Week 3', from: 15, to: 21 },
  { id: 4, label: 'Week 4', from: 22, to: 31 }, // clamped to month end
]

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

/** Days in a given month (1-based month). */
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/** Distinct 'YYYY-MM' months present in the data, sorted ascending. */
export function monthsInData(posts) {
  const set = new Set()
  for (const p of posts) {
    if (ISO_RE.test(p.date)) set.add(p.date.slice(0, 7))
  }
  return [...set].sort()
}

/** Human label for a 'YYYY-MM' key, e.g. 'September 2026'. */
export function monthKeyLabel(ym) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** ISO range covering an entire 'YYYY-MM' month. */
export function monthRangeOf(ym) {
  const [y, m] = ym.split('-').map(Number)
  const last = daysInMonth(y, m)
  return { start: `${ym}-01`, end: `${ym}-${String(last).padStart(2, '0')}` }
}

/** ISO range for week 1-4 within a 'YYYY-MM' month (last week clamped). */
export function weekRangeOf(ym, weekId) {
  const [y, m] = ym.split('-').map(Number)
  const wk = WEEK_OPTIONS.find((w) => w.id === weekId) || WEEK_OPTIONS[0]
  const last = daysInMonth(y, m)
  const from = Math.min(wk.from, last)
  const to = Math.min(wk.to, last)
  const pad = (n) => String(n).padStart(2, '0')
  return { start: `${ym}-${pad(from)}`, end: `${ym}-${pad(to)}` }
}

/** Determine the dataset's max date (anchor for presets). Ignores invalid dates. */
export function datasetMaxDate(posts) {
  let max = null
  for (const p of posts) {
    if (!ISO_RE.test(p.date)) continue
    if (!max || p.date > max) max = p.date
  }
  return max || format(new Date(), 'yyyy-MM-dd')
}

export function datasetMinDate(posts) {
  let min = null
  for (const p of posts) {
    if (!ISO_RE.test(p.date)) continue
    if (!min || p.date < min) min = p.date
  }
  return min || format(new Date(), 'yyyy-MM-dd')
}

/**
 * Resolve the active date window from a data-based filter selection.
 * `filter` = { mode: 'all'|'month'|'week'|'custom', month: 'YYYY-MM',
 *              week: 1..4, custom: { start, end } }.
 * Nothing here uses the current time — every window comes from the data
 * or the user's explicit choice. Falls back to the full data span.
 */
export function resolveRange(filter, posts) {
  const min = datasetMinDate(posts)
  const max = datasetMaxDate(posts)
  const full = { start: min, end: max }
  if (!filter || !filter.mode || filter.mode === 'all') return full

  if (filter.mode === 'custom') {
    const c = filter.custom
    if (!c?.start || !c?.end) return full
    return c.start <= c.end ? { start: c.start, end: c.end } : { start: c.end, end: c.start }
  }

  // Month / Week both need a month key; default to the latest month in data.
  const months = monthsInData(posts)
  const month = filter.month && months.includes(filter.month) ? filter.month : months[months.length - 1]
  if (!month) return full

  if (filter.mode === 'month') return monthRangeOf(month)
  if (filter.mode === 'week') return weekRangeOf(month, filter.week || 1)
  return full
}

/** The immediately-preceding window of equal length, for period comparison. */
export function previousRange(range) {
  const start = toDate(range.start)
  const end = toDate(range.end)
  const len = differenceInCalendarDays(end, start) + 1
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(len - 1))
  return { start: format(prevStart, 'yyyy-MM-dd'), end: format(prevEnd, 'yyyy-MM-dd') }
}

/**
 * Apply date range + pillar + status filters.
 * A post with an invalid/empty date is only range-filtered when a specific
 * (non "all") preset is active; under the default full-span view it is always
 * kept, so imported rows never silently vanish because of a date quirk.
 */
export function applyFilters(posts, { range, pillar, status, dateFilterActive = true }) {
  return posts.filter((p) => {
    const validDate = ISO_RE.test(p.date)
    if (range && validDate && (p.date < range.start || p.date > range.end)) return false
    if (range && !validDate && dateFilterActive) return false
    if (pillar && pillar !== 'All' && p.pillar !== pillar) return false
    if (status && status !== 'All' && p.status !== status) return false
    return true
  })
}

export function uniquePillars(posts) {
  return ['All', ...Array.from(new Set(posts.map((p) => p.pillar))).sort()]
}

export function uniqueStatuses(posts) {
  const order = ['Published', 'Scheduled', 'Draft']
  const found = Array.from(new Set(posts.map((p) => p.status)))
  return ['All', ...order.filter((s) => found.includes(s)), ...found.filter((s) => !order.includes(s))]
}

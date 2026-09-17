// Global filtering: date range presets, pillar/status filters, and the
// derivation of the "previous period" comparison window.
import { toDate, isoDaysAgo } from './dates'
import { differenceInCalendarDays, addDays, format } from 'date-fns'

export const DATE_PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '28d', label: 'Last 28 days', days: 28 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
]

/** Determine the dataset's max date (used as the anchor for presets). */
export function datasetMaxDate(posts) {
  let max = null
  for (const p of posts) {
    if (!max || p.date > max) max = p.date
  }
  return max || format(new Date(), 'yyyy-MM-dd')
}

export function datasetMinDate(posts) {
  let min = null
  for (const p of posts) {
    if (!min || p.date < min) min = p.date
  }
  return min || format(new Date(), 'yyyy-MM-dd')
}

/**
 * Compute [start,end] ISO strings for a preset.
 * The window is always anchored to the dataset itself (the latest post),
 * not to "today", so imported data from any month displays correctly.
 * The result is clamped to the dataset's actual min/max and guaranteed to
 * have start <= end.
 */
export function resolveRange(presetId, posts, custom) {
  if (presetId === 'custom' && custom?.start && custom?.end) {
    const start = custom.start <= custom.end ? custom.start : custom.end
    const end = custom.start <= custom.end ? custom.end : custom.start
    return { start, end }
  }
  const min = datasetMinDate(posts)
  const max = datasetMaxDate(posts) // anchor = latest post date
  const preset = DATE_PRESETS.find((p) => p.id === presetId) || DATE_PRESETS.find((p) => p.id === 'all')

  // "All time" (days == null): full span of the data.
  if (!preset || preset.days == null) {
    return { start: min, end: max }
  }

  // Rolling window ending at the latest post; never start before the data
  // begins, and never invert the range.
  let start = isoDaysAgo(max, preset.days - 1)
  if (start < min) start = min
  if (start > max) start = min // safety: never invert
  return { start, end: max }
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

/** Apply date range + pillar + status filters. */
export function applyFilters(posts, { range, pillar, status }) {
  return posts.filter((p) => {
    if (range && (p.date < range.start || p.date > range.end)) return false
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

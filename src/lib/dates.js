// Date helpers built on date-fns for week/month bucketing.
import {
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isWithinInterval,
  subDays,
} from 'date-fns'

// Weeks start on Monday to match most social reporting.
const WEEK_OPTS = { weekStartsOn: 1 }

export function toDate(iso) {
  const d = parseISO(`${iso}`)
  // Guard against invalid/empty dates so downstream format() never throws
  // (an Invalid Date passed to date-fns format() crashes the render).
  return Number.isNaN(d.getTime()) ? new Date() : d
}

export function weekKey(iso) {
  const d = startOfWeek(toDate(iso), WEEK_OPTS)
  return format(d, 'yyyy-MM-dd')
}

export function weekLabel(iso) {
  const start = startOfWeek(toDate(iso), WEEK_OPTS)
  return `Wk of ${format(start, 'MMM d')}`
}

export function weekRange(iso) {
  const d = toDate(iso)
  return { start: startOfWeek(d, WEEK_OPTS), end: endOfWeek(d, WEEK_OPTS) }
}

export function monthKey(iso) {
  return format(startOfMonth(toDate(iso)), 'yyyy-MM')
}

export function monthLabel(iso) {
  return format(toDate(iso), 'MMM yyyy')
}

export function monthRange(iso) {
  const d = toDate(iso)
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

export function within(iso, start, end) {
  const d = toDate(iso)
  return isWithinInterval(d, { start, end })
}

export function isoDaysAgo(fromIso, days) {
  return format(subDays(toDate(fromIso), days), 'yyyy-MM-dd')
}

export { format as formatFns }

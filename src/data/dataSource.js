/**
 * Data source abstraction.
 * ------------------------------------------------------------------
 * The dashboard reads all posts through `loadPosts()`. Today it returns
 * bundled sample data, but the shape below is the ONLY contract the rest
 * of the app depends on. To go live, replace the body of `loadPosts()`
 * with a CSV import or an API/database call that returns the same shape.
 *
 * A post record:
 *   {
 *     id: string,              // stable unique id
 *     date: string,            // ISO 'YYYY-MM-DD' (publish or scheduled date)
 *     pillar: string,          // content pillar / category
 *     contentType: string,     // Text | Image | Carousel | Video | Poll | Link
 *     content: string,         // the post copy / title
 *     status: string,          // Published | Scheduled | Draft
 *     link: string,            // URL to the original Threads post
 *     views: number,
 *     likes: number,
 *     comments: number,
 *     reposts: number,
 *     shares: number,
 *   }
 *
 * See `parseCsv` and `normalizePost` for how spreadsheet rows map in.
 */
export const REQUIRED_FIELDS = [
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
]

const NUMERIC_FIELDS = ['views', 'likes', 'comments', 'reposts', 'shares']

/**
 * Parse a date from several common formats into ISO 'YYYY-MM-DD':
 *   - 2026-09-01            (already ISO)
 *   - 01/09/2026, 1/9/2026  (DD/MM/YYYY — day first, matches the sheet)
 *   - 01-09-2026            (DD-MM-YYYY)
 * Ambiguous DD/MM vs MM/DD is resolved as DAY-FIRST, since the source
 * spreadsheet uses DD/MM/YYYY. Falls back to the raw string if unrecognized.
 */
const MONTHS = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10', october: '10',
  nov: '11', november: '11', dec: '12', december: '12',
}

function isValidIso(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1970 && y <= 2999
}

/**
 * Parse a date from many common formats into ISO 'YYYY-MM-DD':
 *   - 2026-09-01 / 2026/09/01        (ISO, year first)
 *   - 01/09/2026, 1/9/2026           (DD/MM/YYYY — day first, matches the sheet)
 *   - 01-09-2026, 01.09.2026         (DD-MM-YYYY)
 *   - "August 1, 2026", "1 Aug 2026", "Aug 1 2026"  (month names)
 * Day-first is assumed for all-numeric slash/dash dates (the source sheet
 * uses DD/MM/YYYY). Returns '' when nothing valid can be extracted, so
 * callers/filters can treat it as "undated" rather than corrupting ranges.
 */
export function parseDate(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''

  // ISO / year-first: 2026-09-01 or 2026/09/01
  const isoM = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoM) {
    const out = `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`
    return isValidIso(out) ? out : ''
  }

  // All-numeric day-first: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (2- or 4-digit year)
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (dmy) {
    let [, d, m, y] = dmy
    if (y.length === 2) y = `20${y}`
    const out = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return isValidIso(out) ? out : ''
  }

  // Month-name formats: "August 1, 2026", "1 August 2026", "Aug 1 2026"
  const lower = s.toLowerCase()
  // day + month + year   (1 Aug 2026)
  let mn = lower.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})/)
  if (mn && MONTHS[mn[2]]) {
    const out = `${mn[3]}-${MONTHS[mn[2]]}-${mn[1].padStart(2, '0')}`
    return isValidIso(out) ? out : ''
  }
  // month + day + year   (August 1, 2026  /  Aug 1 2026)
  mn = lower.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/)
  if (mn && MONTHS[mn[1]]) {
    const out = `${mn[3]}-${MONTHS[mn[1]]}-${mn[2].padStart(2, '0')}`
    return isValidIso(out) ? out : ''
  }

  // Last resort: let the JS engine try, else give up (empty = undated).
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    const out = `${y}-${m}-${d}`
    return isValidIso(out) ? out : ''
  }
  return ''
}

/** Normalize a status label; treat "Posted" as "Published". */
export function normalizeStatus(value) {
  const s = String(value ?? '').trim()
  if (!s) return 'Published'
  const low = s.toLowerCase()
  if (low.startsWith('post') || low.startsWith('publish') || low === 'live' || low === 'done')
    return 'Published'
  if (low.startsWith('schedul') || low.startsWith('plan') || low === 'upcoming') return 'Scheduled'
  if (low.startsWith('draft') || low === 'wip' || low === 'idea') return 'Draft'
  // Preserve unknown statuses as title-cased.
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Coerce and normalize a raw record into the canonical post shape. */
export function normalizePost(raw, index = 0) {
  const num = (v) => {
    const t = String(v ?? '').replace(/[, ]/g, '').trim()
    if (t === '') return 0
    const n = Number(t)
    return Number.isFinite(n) ? n : 0
  }
  const post = {
    id: raw.id != null && raw.id !== '' ? String(raw.id) : `row-${index}`,
    date: parseDate(raw.date),
    pillar: String(raw.pillar ?? 'Uncategorized').trim() || 'Uncategorized',
    contentType: String(raw.contentType ?? raw.type ?? 'Text').trim() || 'Text',
    content: String(raw.content ?? '').trim(),
    status: normalizeStatus(raw.status),
    link: String(raw.link ?? '').trim(),
  }
  for (const f of NUMERIC_FIELDS) post[f] = num(raw[f])
  return post
}

/**
 * Primary entry point. Returns a Promise so an API-backed implementation
 * can drop in without touching callers.
 */
export async function loadPosts() {
  // --- Sample implementation (lazy-loaded so it isn't bundled unless used) --
  const sample = (await import('./sampleData.json')).default
  const posts = sample.posts.map((p, i) => normalizePost(p, i))
  return { meta: sample.meta, posts }

  // --- Example CSV implementation (swap in later) ----------------
  // const text = await fetch('/data/threads-export.csv').then((r) => r.text())
  // const posts = parseCsv(text).map(normalizePost)
  // return { meta: { platform: 'Threads', source: 'csv' }, posts }

  // --- Example API implementation --------------------------------
  // const res = await fetch('/api/threads/posts')
  // const { posts } = await res.json()
  // return { meta: { platform: 'Threads', source: 'api' }, posts: posts.map(normalizePost) }
}

// Map a raw header cell to a canonical field key.
const HEADER_ALIASES = {
  type: 'contentType',
  'content type': 'contentType',
  contenttype: 'contentType',
  url: 'link',
  links: 'link',
  view: 'views',
  like: 'likes',
  comment: 'comments',
  repost: 'reposts',
  share: 'shares',
}
function headerKey(h) {
  const k = h.trim().toLowerCase()
  return HEADER_ALIASES[k] || k
}

const CANONICAL = new Set([
  'date',
  'pillar',
  'content',
  'status',
  'link',
  'contentType',
  'views',
  'likes',
  'comments',
  'reposts',
  'shares',
])

/**
 * Tokenize delimited text into rows of cells. Handles quoted fields
 * (with embedded delimiters, newlines, and doubled quotes). The delimiter
 * is auto-detected per call (tab if present, else comma).
 */
function tokenize(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Robust CSV/TSV parser tuned for spreadsheet exports and pastes.
 * - Auto-detects tab vs comma delimiter.
 * - Skips any leading title/blank rows before the real header.
 * - Locates the header row by looking for the canonical column names.
 * - Ignores extra columns like a leading blank column or a "No" index column.
 * Returns an array of raw record objects (pass each through normalizePost).
 */
export function parseCsv(text) {
  if (!text || !text.trim()) return []
  const delimiter = text.includes('\t') ? '\t' : ','
  const rows = tokenize(text, delimiter).filter((r) => r.some((v) => String(v).trim() !== ''))
  if (!rows.length) return []

  // Find the header row: the first row that contains at least 3 canonical fields.
  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const keys = rows[i].map(headerKey)
    const hits = keys.filter((k) => CANONICAL.has(k)).length
    if (hits >= 3) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) return []

  const header = rows[headerIdx].map(headerKey)
  return rows.slice(headerIdx + 1).map((cells) => {
    const obj = {}
    header.forEach((key, idx) => {
      if (CANONICAL.has(key)) obj[key] = cells[idx]
    })
    return obj
  })
  // Note: unrecognized columns (leading blank, "no") are dropped because they
  // are not in CANONICAL, so the index column is safely ignored.
}

/** Convenience: parse text and return normalized posts ready for the store. */
export function parsePostsText(text) {
  return parseCsv(text)
    .map((r, i) => normalizePost(r, i))
    .filter((p) => p.content || p.link) // drop empty rows
}

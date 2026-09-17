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
export function parseDate(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  // Already ISO (YYYY-MM-DD…)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // DD/MM/YYYY or DD-MM-YYYY (day first)
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (dmy) {
    let [, d, m, y] = dmy
    if (y.length === 2) y = `20${y}`
    const dd = String(d).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }
  return s.slice(0, 10)
}

/** Normalize a status label; treat "Posted" as "Published". */
export function normalizeStatus(value) {
  const s = String(value ?? '').trim()
  if (!s) return 'Published'
  const low = s.toLowerCase()
  if (low === 'posted' || low === 'published' || low === 'live') return 'Published'
  if (low === 'scheduled' || low === 'schedule') return 'Scheduled'
  if (low === 'draft' || low === 'drafting') return 'Draft'
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

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

/** Coerce and normalize a raw record into the canonical post shape. */
export function normalizePost(raw, index = 0) {
  const num = (v) => {
    const n = Number(String(v ?? '').replace(/[, ]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  const post = {
    id: raw.id != null && raw.id !== '' ? String(raw.id) : `row-${index}`,
    date: String(raw.date ?? '').slice(0, 10),
    pillar: String(raw.pillar ?? 'Uncategorized').trim(),
    contentType: String(raw.contentType ?? raw.type ?? 'Text').trim(),
    content: String(raw.content ?? '').trim(),
    status: String(raw.status ?? 'Published').trim(),
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

/**
 * Minimal CSV parser (handles quoted fields and commas within quotes).
 * Header names are matched case-insensitively to the canonical fields.
 * Provided so a spreadsheet export can be wired up with no extra deps.
 */
export function parseCsv(text) {
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
    else if (c === ',') {
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
  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''))
  if (!nonEmpty.length) return []
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase())
  const keyFor = (h) => {
    const map = {
      type: 'contentType',
      'content type': 'contentType',
      contenttype: 'contentType',
      url: 'link',
    }
    return map[h] || h
  }
  return nonEmpty.slice(1).map((cells) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[keyFor(h)] = cells[idx]
    })
    return obj
  })
}

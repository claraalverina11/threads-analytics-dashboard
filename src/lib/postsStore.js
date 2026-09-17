/**
 * Posts store — shared source of truth for the dashboard.
 * ------------------------------------------------------------------
 * Primary storage is Supabase (a shared cloud database) so data logged by one
 * person is visible to everyone in real time. localStorage is kept as an
 * instant-render cache and offline fallback.
 *
 * The store exposes a synchronous pub/sub API (subscribe / getSnapshot) so
 * React can consume it via useSyncExternalStore without any async churn in the
 * views. Loading and realtime updates happen in the background and simply
 * push new snapshots through emit().
 */
import { normalizePost } from '../data/dataSource'
import { supabase, hasSupabase, POSTS_TABLE } from './supabase'

const STORAGE_KEY = 'threads-analytics.posts.v1'
const META = { account: '@padelfellas.id', platform: 'Threads', source: hasSupabase ? 'supabase' : 'local' }

let posts = loadLocal()
let status = hasSupabase ? 'loading' : 'ready' // loading | ready | error
let lastError = null
const listeners = new Set()

// ---- Local cache -----------------------------------------------

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => p && typeof p === 'object').map((p, i) => normalizePost(p, i))
  } catch {
    return []
  }
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    /* storage may be unavailable (private mode / quota) */
  }
}

function emit() {
  for (const fn of listeners) fn()
}

function setPosts(next) {
  posts = sortByDate(next)
  persistLocal()
  emit()
}

function sortByDate(list) {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function makeId() {
  return `M-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ---- Supabase mapping ------------------------------------------
// DB columns are snake_case; the app uses camelCase (contentType). Map both ways.

function toRow(p) {
  return {
    id: p.id,
    date: p.date || null,
    pillar: p.pillar,
    content_type: p.contentType,
    content: p.content,
    status: p.status,
    link: p.link,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    reposts: p.reposts,
    shares: p.shares,
  }
}

function fromRow(r, i = 0) {
  return normalizePost(
    {
      id: r.id,
      date: r.date,
      pillar: r.pillar,
      contentType: r.content_type,
      content: r.content,
      status: r.status,
      link: r.link,
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      reposts: r.reposts,
      shares: r.shares,
    },
    i,
  )
}

// ---- Remote sync -----------------------------------------------

async function fetchFromSupabase() {
  const { data, error } = await supabase.from(POSTS_TABLE).select('*')
  if (error) throw error
  return (data || []).map((r, i) => fromRow(r, i))
}

/** Load remote data and subscribe to realtime changes. Called once at startup. */
export async function initRemote() {
  if (!hasSupabase) return
  try {
    const remote = await fetchFromSupabase()
    setPosts(remote)
    status = 'ready'
    lastError = null
    emit()
  } catch (e) {
    status = 'error'
    lastError = e?.message || String(e)
    emit()
    return
  }

  // Realtime: any insert/update/delete refreshes the dataset so every open
  // dashboard reflects changes live.
  try {
    supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: POSTS_TABLE }, async () => {
        try {
          setPosts(await fetchFromSupabase())
        } catch {
          /* transient; ignore */
        }
      })
      .subscribe()
  } catch {
    /* realtime optional — polling not required for correctness */
  }
}

// ---- Public API -------------------------------------------------

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSnapshot() {
  return posts
}

export function getStatus() {
  return status
}

export function getError() {
  return lastError
}

export function getMeta() {
  return { ...META, generatedAt: new Date().toISOString(), postCount: posts.length }
}

export function addPost(raw) {
  const post = normalizePost({ ...raw, id: raw.id || makeId() }, posts.length)
  setPosts([post, ...posts])
  if (hasSupabase) {
    supabase
      .from(POSTS_TABLE)
      .upsert(toRow(post))
      .then(({ error }) => error && console.error('Supabase insert failed:', error.message))
  }
  return post
}

export function updatePost(id, raw) {
  let updated = null
  setPosts(
    posts.map((p) => {
      if (p.id !== id) return p
      updated = normalizePost({ ...p, ...raw, id }, 0)
      return updated
    }),
  )
  if (hasSupabase && updated) {
    supabase
      .from(POSTS_TABLE)
      .update(toRow(updated))
      .eq('id', id)
      .then(({ error }) => error && console.error('Supabase update failed:', error.message))
  }
}

export function deletePost(id) {
  setPosts(posts.filter((p) => p.id !== id))
  if (hasSupabase) {
    supabase
      .from(POSTS_TABLE)
      .delete()
      .eq('id', id)
      .then(({ error }) => error && console.error('Supabase delete failed:', error.message))
  }
}

/** Replace the entire dataset (CSV import / bulk paste, replace mode). */
export function replaceAll(rawList) {
  // normalizePost already assigns a unique id to any id-less row.
  const next = rawList.map((r, i) => normalizePost(r, i))
  // Guarantee uniqueness even if the source provided colliding ids.
  ensureUniqueIds(next)
  setPosts(next)
  if (hasSupabase) {
    ;(async () => {
      try {
        // Delete everything, then upsert the new set. Upsert (not insert) so a
        // repeated id can never abort the whole batch with a 409.
        const del = await supabase.from(POSTS_TABLE).delete().neq('id', '')
        if (del.error) throw del.error
        if (next.length) {
          const ins = await supabase.from(POSTS_TABLE).upsert(next.map(toRow))
          if (ins.error) throw ins.error
        }
      } catch (e) {
        console.error('Supabase replaceAll failed:', e?.message || e)
      }
    })()
  }
}

/** Append many posts at once with fresh ids (bulk import, append mode). */
export function addMany(rawList) {
  const added = rawList.map((r, i) => normalizePost(r, i))
  ensureUniqueIds(added, posts)
  setPosts([...added, ...posts])
  if (hasSupabase && added.length) {
    supabase
      .from(POSTS_TABLE)
      .upsert(added.map(toRow))
      .then(({ error }) => error && console.error('Supabase bulk insert failed:', error.message))
  }
  return added.length
}

/** Force every post in `list` to have an id unique within list + `existing`. */
function ensureUniqueIds(list, existing = []) {
  const seen = new Set(existing.map((p) => p.id))
  for (const p of list) {
    if (!p.id || seen.has(p.id)) p.id = makeId()
    seen.add(p.id)
  }
}

export function clearAll() {
  setPosts([])
  if (hasSupabase) {
    supabase
      .from(POSTS_TABLE)
      .delete()
      .neq('id', '')
      .then(({ error }) => error && console.error('Supabase clear failed:', error.message))
  }
}

export function count() {
  return posts.length
}

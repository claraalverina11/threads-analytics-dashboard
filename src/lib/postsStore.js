/**
 * Posts store — the source of truth for the dashboard.
 * ------------------------------------------------------------------
 * Manually-logged posts are persisted to localStorage so they survive
 * refreshes. This REPLACES the bundled sample data: the dashboard shows
 * exactly what has been logged here.
 *
 * The store keeps the canonical post shape (see normalizePost) and exposes
 * a tiny pub/sub API so React can subscribe via useSyncExternalStore.
 */
import { normalizePost } from '../data/dataSource'

const STORAGE_KEY = 'threads-analytics.posts.v1'
const META = { account: '@your.account', platform: 'Threads', source: 'manual' }

let posts = load()
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((p, i) => normalizePost(p, i))
  } catch {
    return []
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // storage may be unavailable (private mode / quota) — keep in-memory.
  }
}

function emit() {
  for (const fn of listeners) fn()
}

function sortByDate(list) {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function makeId() {
  return `M-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ---- Public API -------------------------------------------------

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Returns a stable-reference snapshot; recreated only when data changes. */
export function getSnapshot() {
  return posts
}

export function getMeta() {
  return { ...META, generatedAt: new Date().toISOString(), postCount: posts.length }
}

export function addPost(raw) {
  const post = normalizePost({ ...raw, id: raw.id || makeId() }, posts.length)
  posts = sortByDate([post, ...posts])
  persist()
  emit()
  return post
}

export function updatePost(id, raw) {
  posts = sortByDate(
    posts.map((p) => (p.id === id ? normalizePost({ ...p, ...raw, id }, 0) : p)),
  )
  persist()
  emit()
}

export function deletePost(id) {
  posts = posts.filter((p) => p.id !== id)
  persist()
  emit()
}

/** Replace the entire dataset (used by CSV import / bulk paste later). */
export function replaceAll(rawList) {
  posts = sortByDate(rawList.map((r, i) => normalizePost(r, i)))
  persist()
  emit()
}

export function clearAll() {
  posts = []
  persist()
  emit()
}

export function count() {
  return posts.length
}

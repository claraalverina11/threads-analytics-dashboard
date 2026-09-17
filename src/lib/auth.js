/**
 * Lightweight client-side access gate.
 * ------------------------------------------------------------------
 * NOTE: This is a convenience gate for a static site, NOT real security.
 * The password lives in the shipped JS, so anyone technical can read it.
 * It only keeps casual viewers out. For real protection you'd need a
 * backend / auth provider.
 */
const AUTH_KEY = 'threads-analytics.auth.v1'
const ACCESS_PASSWORD = 'fellas123'

export function isAuthed() {
  try {
    return localStorage.getItem(AUTH_KEY) === 'ok'
  } catch {
    return false
  }
}

/** Returns true if the password matched (and persists the session). */
export function attemptLogin(password) {
  if (password === ACCESS_PASSWORD) {
    try {
      localStorage.setItem(AUTH_KEY, 'ok')
    } catch {
      /* ignore storage errors — still authed for this session */
    }
    return true
  }
  return false
}

export function logout() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
}

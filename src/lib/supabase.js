/**
 * Supabase client — shared, real-time data source.
 * ------------------------------------------------------------------
 * The publishable (anon) key is designed to be shipped in client code; access
 * is governed by Row Level Security policies on the database, not by hiding
 * the key. If the project isn't configured, `supabase` is null and the app
 * falls back to browser-local storage.
 */
import { createClient } from '@supabase/supabase-js'

// Allow overriding via Vite env vars, else use the project defaults.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://rzrfzmxxiwzjkfrrambp.supabase.co'
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_MNNYYG06J48pMGXLJsMqiw_stTLzQIV'

export const POSTS_TABLE = 'posts'

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      })
    : null

export const hasSupabase = Boolean(supabase)

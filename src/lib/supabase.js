import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const storage = {
  getItem: (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key, value) => {
    const remember = sessionStorage.getItem('wmove_remember') !== 'false'
    if (remember) localStorage.setItem(key, value)
    else sessionStorage.setItem(key, value)
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage, persistSession: true },
})

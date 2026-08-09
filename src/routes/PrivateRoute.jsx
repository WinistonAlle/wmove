import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Lê a sessão do cache do Supabase no localStorage de forma síncrona.
// Isso elimina o flash de tela preta entre navegações pois o estado
// inicial já é conhecido antes de qualquer re-render.
function readCachedSession() {
  try {
    const key = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (!key) return null
    const raw = localStorage.getItem(key)
    const data = raw ? JSON.parse(raw) : null
    return data?.access_token ? data : null
  } catch {
    return null
  }
}

export default function PrivateRoute({ children }) {
  const [session, setSession] = useState(() => readCachedSession())

  useEffect(() => {
    // Confirma/atualiza com o estado real do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // session null = não logado, qualquer objeto = logado
  // Nunca retorna undefined (graças ao readCachedSession),
  // então nunca há o flash de tela preta
  if (session === undefined) return null

  return session ? children : <Navigate to="/login" replace />
}

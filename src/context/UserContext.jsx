import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [{ data: profile }, { data: company }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('companies')
        .select('id, name, cnpj, phone, cep, address, address_num, complement, city, uf, plan, trial_ends_at')
        .eq('owner_id', user.id)
        .single(),
    ])
    setUserData({ user, profile, company })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <UserContext.Provider value={{ userData, loading, refresh: load }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface AuthUser {
  email: string | null
  userName: string | null
  wcgUserId: number | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser(supabaseUserId: string, email: string | null) {
    const { data: profile } = await supabase
      .from('usr_user_profiles')
      .select('wcg_user_id, user_name')
      .eq('supabase_user_id', supabaseUserId)
      .single()

    setUser({
      email,
      userName: profile?.user_name ?? null,
      wcgUserId: profile?.wcg_user_id ?? null,
    })
  }

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUser(session.user.id, session.user.email ?? null).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser(session.user.id, session.user.email ?? null).finally(() => setLoading(false))
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    sessionStorage.removeItem('wcg_user_id')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
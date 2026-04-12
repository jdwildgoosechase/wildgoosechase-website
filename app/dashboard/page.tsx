'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import NavBar from '../components/NavBar'
import DashboardContent from '../components/DashboardContent'

export default function DashboardPage() {
  const router = useRouter()

  const [checking,  setChecking]  = useState(true)
  const [wcgUserId, setWcgUserId] = useState<number | null>(null)
  const [userName,  setUserName]  = useState<string | null>(null)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data: profile } = await supabase
        .from('usr_user_profiles')
        .select('wcg_user_id, user_name')
        .eq('supabase_user_id', session.user.id)
        .single()

      if (!profile) {
        router.push('/signin')
        return
      }

      setWcgUserId(profile.wcg_user_id)
      setUserName(profile.user_name ?? null)
      setChecking(false)
    }
    checkSession()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a2e1a' }}>
        <p className="text-green-300 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2e1a' }}>
      <div style={{ backgroundColor: '#0f1f0f' }}>
        <NavBar transparent={true} />
      </div>
      <DashboardContent
        wcgUserId={wcgUserId!}
        userName={userName}
        isOwner={true}
      />
    </div>
  )
}
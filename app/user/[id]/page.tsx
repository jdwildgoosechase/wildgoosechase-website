'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import NavBar from '../../components/NavBar'
import DashboardContent from '../../components/DashboardContent'

export default function PublicProfilePage() {
  const params    = useParams()
  const profileId = Number(params.id)

  const [checking,   setChecking]   = useState(true)
  const [isPublic,   setIsPublic]   = useState(false)
  const [userName,   setUserName]   = useState<string | null>(null)
  const [isOwner,    setIsOwner]    = useState(false)
  const [notFound,   setNotFound]   = useState(false)

  useEffect(() => {
    async function load() {
      if (!profileId || isNaN(profileId)) {
        setNotFound(true)
        setChecking(false)
        return
      }

      // Load the profile
      const { data: profile } = await supabase
        .rpc('wcg_web_get_profile', { p_user_id: profileId })

      if (!profile?.[0]) {
        setNotFound(true)
        setChecking(false)
        return
      }

      setIsPublic(profile[0].is_public)
      setUserName(profile[0].user_name ?? null)

      // Check if the current session user is the owner
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: sessionProfile } = await supabase
          .from('usr_user_profiles')
          .select('wcg_user_id')
          .eq('supabase_user_id', session.user.id)
          .single()
        if (sessionProfile?.wcg_user_id === profileId) {
          setIsOwner(true)
        }
      }

      setChecking(false)
    }
    load()
  }, [profileId])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a2e1a' }}>
        <p className="text-green-300 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2e1a' }}>
        <div style={{ backgroundColor: '#0f1f0f' }}>
          <NavBar transparent={true} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🦢</div>
            <p className="text-white text-xl" style={{ fontFamily: 'Georgia, serif' }}>Profile not found</p>
            <p className="text-green-400 text-sm mt-2">This user does not exist.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isPublic && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2e1a' }}>
        <div style={{ backgroundColor: '#0f1f0f' }}>
          <NavBar transparent={true} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-white text-xl" style={{ fontFamily: 'Georgia, serif' }}>This profile is private</p>
            <p className="text-green-400 text-sm mt-2">The owner has not made their profile public.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2e1a' }}>
      <div style={{ backgroundColor: '#0f1f0f' }}>
        <NavBar transparent={true} />
      </div>
      <DashboardContent
        wcgUserId={profileId}
        userName={userName}
        isOwner={isOwner}
      />
    </div>
  )
}
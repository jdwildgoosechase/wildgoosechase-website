'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Map from '../components/Map'

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_sightings: number
  total_species: number
  total_countries: number
  total_trips: number
  total_hotspots: number
  years_active: number
}

interface Sighting {
  sighting_id: number
  sighting_date: string
  common_name: string
  scientific_name: string
  country_name: string
  province_name: string
  num_animals: number
}

interface MapPoint {
  latitude: number
  longitude: number
  sighting_count: number
}

type Tab = 'overview' | 'trips' | 'hotspots' | 'species' | 'travels' | 'gallery'

// ── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '🗺️'  },
  { id: 'trips',     label: 'Trips',     icon: '🧳'  },
  { id: 'hotspots',  label: 'Hotspots',  icon: '📍'  },
  { id: 'species',   label: 'Species',   icon: '🐦'  },
  { id: 'travels',   label: 'Travels',   icon: '✈️'  },
  { id: 'gallery',   label: 'Gallery',   icon: '📷'  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [checking,   setChecking]   = useState(true)
  const [userEmail,  setUserEmail]  = useState<string | null>(null)
  const [wcgUserId,  setWcgUserId]  = useState<number | null>(null)
  const [userName,   setUserName]   = useState<string | null>(null)
  const [activeTab,  setActiveTab]  = useState<Tab>('overview')

  const [stats,      setStats]      = useState<Stats | null>(null)
  const [sightings,  setSightings]  = useState<Sighting[]>([])
  const [mapPoints,  setMapPoints]  = useState<MapPoint[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      setUserEmail(session.user.email ?? null)

      // Look up wcg_user_id
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

  // ── Load data once we have wcg_user_id ────────────────────────────────────
  useEffect(() => {
    if (!wcgUserId) return

    async function loadData() {
      setDataLoading(true)

      const [statsRes, sightingsRes, mapRes] = await Promise.all([
        supabase.rpc('wcg_web_get_dashboard_stats',           { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_recent_sightings',{ p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_map_points',      { p_user_id: wcgUserId }),
      ])

      if (statsRes.data?.[0])  setStats(statsRes.data[0])
      if (sightingsRes.data)   setSightings(sightingsRes.data)

      // Remap 'count' → 'sighting_count' for the Map component
      if (mapRes.data) {
        setMapPoints(
          mapRes.data.map((p: { latitude: number; longitude: number; count: number }) => ({
            latitude:       p.latitude,
            longitude:      p.longitude,
            sighting_count: p.count,
          }))
        )
      }

      setDataLoading(false)
    }

    loadData()
  }, [wcgUserId])

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut()
    sessionStorage.removeItem('wcg_user_id')
    router.push('/')
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a2e1a' }}>
        <p className="text-green-300 text-sm">Loading…</p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2e1a' }}>

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#0f1f0f' }}>
        <Link href="/" style={{ fontFamily: 'Georgia, serif' }} className="text-white text-xl font-bold tracking-wide">
          🦢 Wildgoosechase
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-green-300">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
          <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          <span className="text-green-500 text-xs">{userName ?? userEmail}</span>
          <button
            onClick={handleSignOut}
            className="bg-green-800 hover:bg-green-700 px-4 py-2 rounded-full text-sm font-semibold transition-colors text-white"
          >
            Sign Out
          </button>
        </nav>
      </div>

      {/* ── Dashboard title ── */}
      <div className="px-6 pt-8 pb-4">
        <h1
          className="text-white text-3xl md:text-4xl"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          My Dashboard
        </h1>
        <p className="text-green-400 text-sm mt-1">Your personal wildlife sighting overview</p>
      </div>

      {/* ── Stats strip ── */}
      <div className="px-6 pb-6">
        {dataLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ backgroundColor: '#2a3f2a' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Sightings',  value: stats?.total_sightings,  icon: '👁️'  },
              { label: 'Species',    value: stats?.total_species,     icon: '🐦'  },
              { label: 'Countries',  value: stats?.total_countries,   icon: '🌍'  },
              { label: 'Trips',      value: stats?.total_trips,       icon: '🧳'  },
              { label: 'Hotspots',   value: stats?.total_hotspots,    icon: '📍'  },
              { label: 'Years',      value: stats?.years_active,      icon: '📅'  },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: '#2a3f2a' }}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-white text-xl font-bold">{stat.value ?? '—'}</div>
                <div className="text-green-400 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pb-0">
        <div className="flex gap-1 border-b border-green-900">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-800 text-white'
                  : 'text-green-400 hover:text-white hover:bg-green-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 px-6 py-6">

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">

            {/* Map */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#2a3f2a' }}>
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                  All Sightings Map
                </h2>
              </div>
              {dataLoading ? (
                <div className="w-full animate-pulse" style={{ height: '500px', backgroundColor: '#1a2e1a' }} />
              ) : (
                <Map points={mapPoints} />
              )}
            </div>

            {/* Recent sightings */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#2a3f2a' }}>
              <h2 className="text-white font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Recent Sightings
              </h2>
              {dataLoading ? (
                <p className="text-green-400 text-sm">Loading…</p>
              ) : sightings.length === 0 ? (
                <p className="text-green-400 text-sm">No sightings found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sightings.map(s => (
                    <div
                      key={s.sighting_id}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ backgroundColor: '#1a2e1a' }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{s.common_name}</p>
                        <p className="text-green-500 text-xs italic">{s.scientific_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-300 text-xs">{s.sighting_date}</p>
                        <p className="text-green-500 text-xs">
                          {[s.province_name, s.country_name].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Placeholder tabs */}
        {activeTab !== 'overview' && (
          <div className="flex items-center justify-center h-64 rounded-2xl" style={{ backgroundColor: '#2a3f2a' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">
                {TABS.find(t => t.id === activeTab)?.icon}
              </div>
              <p className="text-white font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                {TABS.find(t => t.id === activeTab)?.label} coming soon
              </p>
              <p className="text-green-400 text-sm mt-1">This section is being built</p>
            </div>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <footer className="text-green-600 text-center text-xs py-4" style={{ backgroundColor: '#0f1f0f' }}>
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
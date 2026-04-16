'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Map from './Map'
import ImportTab from './ImportTab'
import GalleryTab from './GalleryTab'

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
  thumbnail_url: string | null
}

interface Lifer {
  sighting_id: number
  sighting_date: string
  common_name: string
  scientific_name: string
  country_name: string
  province_name: string
  thumbnail_url: string | null
}

interface OnThisDay {
  sighting_id: number
  sighting_date: string
  sighting_year: number
  common_name: string
  scientific_name: string
  country_name: string
  province_name: string
  thumbnail_url: string | null
}

interface MapPoint {
  latitude: number
  longitude: number
  sighting_count: number
}

type Tab = 'overview' | 'trips' | 'hotspots' | 'species' | 'travels' | 'gallery' | 'import' | 'settings'

interface DashboardContentProps {
  wcgUserId: number
  userName:  string | null
  isOwner:   boolean
}

// ── Tab config ───────────────────────────────────────────────────────────────

const ALL_TABS: { id: Tab; label: string; icon: string; ownerOnly: boolean }[] = [
  { id: 'overview',  label: 'Overview',  icon: '🗺️', ownerOnly: false },
  { id: 'trips',     label: 'Trips',     icon: '🧳', ownerOnly: false },
  { id: 'hotspots',  label: 'Hotspots',  icon: '📍', ownerOnly: false },
  { id: 'species',   label: 'Species',   icon: '🐦', ownerOnly: false },
  { id: 'travels',   label: 'Travels',   icon: '✈️', ownerOnly: false },
  { id: 'gallery',   label: 'Gallery',   icon: '📷', ownerOnly: false },
  { id: 'import',    label: 'Import',    icon: '📥', ownerOnly: true  },
  { id: 'settings',  label: 'Settings',  icon: '⚙️', ownerOnly: true  },
]

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting(name: string | null): string {
  const hour  = new Date().getHours()
  const first = name?.split(' ')[0] ?? 'there'
  if (hour < 12) return `Good morning, ${first} 👋`
  if (hour < 17) return `Good afternoon, ${first} 👋`
  return `Good evening, ${first} 👋`
}

// ── Thumbnail helper ──────────────────────────────────────────────────────────

function Thumb({ url, alt, emoji }: { url: string | null; alt: string; emoji: string }) {
  return url ? (
    <img src={url} alt={alt} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
  ) : (
    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#1a2e1a' }}>
      {emoji}
    </div>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ wcgUserId }: { wcgUserId: number }) {
  const [isPublic,  setIsPublic]  = useState<boolean | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    supabase.rpc('wcg_web_get_profile', { p_user_id: wcgUserId })
      .then(({ data }) => {
        if (data?.[0]) setIsPublic(data[0].is_public)
      })
  }, [wcgUserId])

  async function togglePublic() {
    if (isPublic === null) return
    setSaving(true)
    setSaved(false)
    const newValue = !isPublic
    await supabase.rpc('wcg_web_update_profile_visibility', {
      p_user_id:   wcgUserId,
      p_is_public: newValue,
    })
    setIsPublic(newValue)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/user/${wcgUserId}`

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Public profile toggle */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#2a3f2a' }}>
        <h2 className="text-white font-semibold text-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Public Profile
        </h2>
        <p className="text-green-400 text-sm mb-6">
          When enabled anyone can view your sighting stats, map and species list at your public profile URL.
          Your import and settings tabs are never visible to the public.
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">
              {isPublic === null ? 'Loading…' : isPublic ? '🌍 Profile is public' : '🔒 Profile is private'}
            </p>
            <p className="text-green-500 text-xs mt-0.5">
              {isPublic ? 'Anyone with the link can view your profile' : 'Only you can see your dashboard'}
            </p>
          </div>
          <button
            onClick={togglePublic}
            disabled={saving || isPublic === null}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              isPublic ? 'bg-green-600' : 'bg-green-900'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
              isPublic ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {saved && <p className="text-green-400 text-xs mt-3">✅ Saved</p>}

        {/* Public URL */}
        {isPublic && (
          <div className="mt-4 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: '#1a2e1a' }}>
            <p className="text-green-300 text-xs flex-1 truncate">{profileUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(profileUrl)}
              className="text-xs text-green-400 hover:text-white transition-colors flex-shrink-0"
            >
              Copy link
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardContent({ wcgUserId, userName, isOwner }: DashboardContentProps) {
  const [activeTab,   setActiveTab]   = useState<Tab>('overview')
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [sightings,   setSightings]   = useState<Sighting[]>([])
  const [mapPoints,   setMapPoints]   = useState<MapPoint[]>([])
  const [lifer,       setLifer]       = useState<Lifer | null>(null)
  const [onThisDay,   setOnThisDay]   = useState<OnThisDay | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const TABS = ALL_TABS.filter(t => !t.ownerOnly || isOwner)

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setDataLoading(true)

      const [statsRes, sightingsRes, mapRes, liferRes, onThisDayRes] = await Promise.all([
        supabase.rpc('wcg_web_get_dashboard_stats',            { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_recent_sightings', { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_map_points',       { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_latest_lifer',     { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_dashboard_on_this_day',      { p_user_id: wcgUserId }),
      ])

      if (statsRes.data?.[0])      setStats(statsRes.data[0])
      if (sightingsRes.data)       setSightings(sightingsRes.data)
      if (liferRes.data?.[0])      setLifer(liferRes.data[0])
      if (onThisDayRes.data?.[0])  setOnThisDay(onThisDayRes.data[0])

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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1">

      {/* ── Greeting + stats ── */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-white text-3xl md:text-4xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          {isOwner ? getGreeting(userName) : `${userName ?? 'Wildlife'} Sightings 🦢`}
        </h1>

        {dataLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse border border-green-700" style={{ backgroundColor: '#1a3a1a' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Sightings', value: stats?.total_sightings, icon: '👁️' },
              { label: 'Species',   value: stats?.total_species,   icon: '🐦' },
              { label: 'Countries', value: stats?.total_countries, icon: '🌍' },
              { label: 'Trips',     value: stats?.total_trips,     icon: '🧳' },
              { label: 'Hotspots',  value: stats?.total_hotspots,  icon: '📍' },
              { label: 'Years',     value: stats?.years_active,    icon: '📅' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4 text-center border border-green-700" style={{ backgroundColor: '#1a3a1a' }}>
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
        <div className="flex gap-1 border-b border-green-700">
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
      <div className="flex-1 px-6 py-6" style={{ backgroundColor: '#b8d4b8' }}>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="flex gap-4" style={{ height: '820px' }}>

            {/* Left — Map */}
            <div className="w-1/2 flex flex-col rounded-2xl overflow-hidden" style={{ backgroundColor: '#2a3f2a' }}>
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>All Sightings Map</h2>
              </div>
              <div className="flex-1">
                {dataLoading ? (
                  <div className="w-full h-full animate-pulse" style={{ backgroundColor: '#1a2e1a' }} />
                ) : (
                  <Map points={mapPoints} theme="light" height={780} />
                )}
              </div>
            </div>

            {/* Right — lifer + on this day + recent sightings */}
            <div className="w-1/2 flex flex-col gap-3">

              {!dataLoading && (lifer || onThisDay) && (
                <div className="flex gap-3 flex-shrink-0">
                  {lifer && (
                    <div className="flex-1 rounded-2xl p-3 flex items-center gap-3 border border-yellow-600" style={{ backgroundColor: '#2a3a1a' }}>
                      <Thumb url={lifer.thumbnail_url} alt={lifer.common_name} emoji="🎊" />
                      <div className="min-w-0">
                        <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-0.5">🎊 Latest Lifer</p>
                        <p className="text-white text-sm font-medium truncate">{lifer.common_name}</p>
                        <p className="text-green-400 text-xs italic truncate">{lifer.scientific_name}</p>
                        <p className="text-green-500 text-xs mt-0.5 truncate">{lifer.sighting_date} · {[lifer.province_name, lifer.country_name].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {onThisDay && (
                    <div className="flex-1 rounded-2xl p-3 flex items-center gap-3 border border-blue-700" style={{ backgroundColor: '#1a2a3a' }}>
                      <Thumb url={onThisDay.thumbnail_url} alt={onThisDay.common_name} emoji="📅" />
                      <div className="min-w-0">
                        <p className="text-blue-400 text.xs font-semibold uppercase tracking-wide mb-0.5">📅 Lifer On This Day</p>
                        <p className="text-white text-sm font-medium truncate">{onThisDay.common_name}</p>
                        <p className="text-green-400 text-xs italic truncate">{onThisDay.scientific_name}</p>
                        <p className="text-green-500 text-xs mt-0.5 truncate">{onThisDay.sighting_year} · {[onThisDay.province_name, onThisDay.country_name].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent sightings */}
              <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ backgroundColor: '#2a3f2a' }}>
                <div className="px-4 pt-4 pb-2 flex-shrink-0">
                  <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Recent Sightings</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {dataLoading ? (
                    <p className="text-green-400 text-sm">Loading…</p>
                  ) : sightings.length === 0 ? (
                    <p className="text-green-400 text-sm">No sightings found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sightings.map(s => (
                        <div key={s.sighting_id} className="flex items-center gap-3 rounded-lg px-3 py-3" style={{ backgroundColor: '#1a2e1a' }}>
                          <Thumb url={s.thumbnail_url} alt={s.common_name} emoji="🐾" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{s.common_name}</p>
                            <p className="text-green-500 text-xs italic truncate">{s.scientific_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-green-300 text-xs">{s.sighting_date}</p>
                            <p className="text-green-500 text-xs">{[s.province_name, s.country_name].filter(Boolean).join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Import — owner only */}
        {activeTab === 'import' && isOwner && (
          <ImportTab wcgUserId={wcgUserId} />
        )}

        {/* Settings — owner only */}
        {activeTab === 'settings' && isOwner && (
          <SettingsTab wcgUserId={wcgUserId} />
        )}

        {/* Gallery tab */}
        {activeTab === 'gallery' && (
          <GalleryTab wcgUserId={wcgUserId} />
        )}

        {/* Placeholder tabs */}
        {activeTab !== 'overview' && activeTab !== 'import' && activeTab !== 'settings' && activeTab !== 'gallery' && (
          <div className="flex items-center justify-center h-64 rounded-2xl" style={{ backgroundColor: '#2a3f2a' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">{TABS.find(t => t.id === activeTab)?.icon}</div>
              <p className="text-white font-medium" style={{ fontFamily: 'Georgia, serif' }}>{TABS.find(t => t.id === activeTab)?.label} coming soon</p>
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
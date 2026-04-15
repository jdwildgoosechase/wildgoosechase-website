'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import Map from '../../components/Map'
import NavBar from '../../components/NavBar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Trip {
  trip_id:             number
  trip_name:           string
  trip_description:    string | null
  trip_start_date:     string
  trip_start_time:     string | null
  trip_end_date:       string | null
  trip_end_time:       string | null
  user_id:             number
  user_name:           string | null
  profile_picture_url: string | null
}

interface Sighting {
  sighting_id:      number
  sighting_date:    string
  sighting_time:    string | null
  common_name:      string
  scientific_name:  string
  family_name:      string | null
  animal_type_name: string | null
  latitude:         number | null
  longitude:        number | null
  num_animals:      number
  heard_only:       number
  comments:         string | null
  thumbnail_url:    string | null
}

interface MapPoint {
  latitude:       number
  longitude:      number
  sighting_count: number
}

interface SpeciesSummary {
  common_name:      string
  scientific_name:  string
  animal_type_name: string | null
  thumbnail_url:    string | null
  count:            number
  first_date:       string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function tripDuration(start: string, end: string | null): string {
  if (!end) return 'Ongoing'
  const s = new Date(start)
  const e = new Date(end)
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return `${days} day${days !== 1 ? 's' : ''}`
}

function groupByType(sightings: Sighting[]): Record<string, SpeciesSummary[]> {
  const speciesMap: Record<string, SpeciesSummary & { dates: string[] }> = {}

  for (const s of sightings) {
    const key = s.common_name
    if (!speciesMap[key]) {
      speciesMap[key] = {
        common_name:      s.common_name,
        scientific_name:  s.scientific_name,
        animal_type_name: s.animal_type_name,
        thumbnail_url:    s.thumbnail_url,
        count:            0,
        first_date:       s.sighting_date,
        dates:            [],
      }
    }
    speciesMap[key].count++
    speciesMap[key].dates.push(s.sighting_date)
  }

  // Sort each species by earliest date
  const speciesList = Object.values(speciesMap).map(s => ({
    ...s,
    first_date: s.dates.sort()[0],
  }))

  // Group by animal type
  const grouped: Record<string, SpeciesSummary[]> = {}
  for (const s of speciesList) {
    const type = s.animal_type_name ?? 'Other'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(s)
  }

  // Sort species within each type alphabetically
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) => a.common_name.localeCompare(b.common_name))
  }

  return grouped
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripPage() {
  const params = useParams()
  const token  = params.token as string

  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [trip,       setTrip]       = useState<Trip | null>(null)
  const [sightings,  setSightings]  = useState<Sighting[]>([])
  const [mapPoints,  setMapPoints]  = useState<MapPoint[]>([])
  const [activeTab,  setActiveTab]  = useState<'map' | 'species'>('map')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const isActive = trip?.trip_end_date === null

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return

    // Load trip
    const { data: tripData } = await supabase
      .rpc('wcg_web_get_trip_by_token', { p_token: token })

    if (!tripData?.[0]) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const tripRow = tripData[0]
    setTrip(tripRow)

    // Load sightings
    const { data: sightingData } = await supabase
      .rpc('wcg_web_get_trip_sightings', { p_trip_id: tripRow.trip_id })

    const rows: Sighting[] = sightingData ?? []
    setSightings(rows)

    // Build map points — cluster by rounded coords
    const pointMap: Record<string, MapPoint> = {}
    for (const s of rows) {
      if (s.latitude && s.longitude) {
        const key = `${s.latitude.toFixed(3)},${s.longitude.toFixed(3)}`
        if (!pointMap[key]) {
          pointMap[key] = { latitude: s.latitude, longitude: s.longitude, sighting_count: 0 }
        }
        pointMap[key].sighting_count++
      }
    }
    setMapPoints(Object.values(pointMap))
    setLastRefresh(new Date())
    setLoading(false)
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Auto-refresh every 60 seconds if trip is active ───────────────────────
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => loadData(), 60000)
    return () => clearInterval(interval)
  }, [isActive, loadData])

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!loading && notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>
        <div className="relative w-full h-64">
          <img src="/hero.jpg" alt="hero" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" style={{ pointerEvents: 'none' }} />
          <div className="absolute inset-0 flex flex-col">
            <NavBar transparent={true} />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl text-green-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Trip not found
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              This trip could not be found or the link may have expired. Check the URL and try again.
            </p>
            <Link href="/" className="inline-block bg-green-800 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors">
              Back to Wildgoosechase
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#d4e8d4' }}>
        <p className="text-green-800 text-sm">Loading trip…</p>
      </div>
    )
  }

  const grouped     = groupByType(sightings)
  const totalSpecies = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
  const totalSightings = sightings.length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Hero ── */}
      <div className="relative w-full h-64 flex-shrink-0">
        <img src="/hero.jpg" alt="Wildlife hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" style={{ pointerEvents: 'none' }} />
        <div className="absolute inset-0 flex flex-col">
          <NavBar transparent={true} />
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-2">
            <h1 className="text-white text-3xl md:text-4xl drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
              {trip?.trip_name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {trip?.user_name && (
                <span className="text-green-200 text-sm">by {trip.user_name}</span>
              )}
              <span className="text-green-300 text-xs">
                {formatDate(trip?.trip_start_date ?? null)}
                {trip?.trip_end_date ? ` — ${formatDate(trip.trip_end_date)}` : ' — Present'}
              </span>
              {isActive ? (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                  🟢 Live
                </span>
              ) : (
                <span className="bg-stone-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Trip ended
                </span>
              )}
            </div>
            {trip?.trip_description && (
              <p className="text-green-200 text-sm max-w-xl mt-1">{trip.trip_description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3 max-w-2xl mx-auto w-full">
        {[
          { label: 'Species',  value: totalSpecies,                                    icon: '🐦' },
          { label: 'Sightings', value: totalSightings,                                 icon: '👁️' },
          { label: 'Duration', value: tripDuration(trip?.trip_start_date ?? '', trip?.trip_end_date ?? null), icon: '📅', text: true },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 text-center bg-white shadow-sm border border-green-200">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-green-900 text-xl font-bold" style={{ fontFamily: stat.text ? 'Georgia, serif' : undefined }}>
              {stat.value}
            </div>
            <div className="text-green-600 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Auto-refresh note ── */}
      {isActive && (
        <p className="text-center text-green-600 text-xs pb-2">
          🔄 Live — updates every 60 seconds · Last updated {lastRefresh.toLocaleTimeString()}
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="px-4 max-w-5xl mx-auto w-full">
        <div className="flex gap-1 border-b border-green-300 mb-4">
          {([
            { id: 'map',     label: '🗺️ Map' },
            { id: 'species', label: '🐦 Species List' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-800 text-white'
                  : 'text-green-700 hover:bg-green-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Map tab */}
        {activeTab === 'map' && (
          <div className="rounded-2xl overflow-hidden shadow-sm mb-6">
            {mapPoints.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-2xl">
                <p className="text-stone-400 text-sm">No GPS sightings recorded yet</p>
              </div>
            ) : (
              <Map points={mapPoints} theme="light" height={500} />
            )}
          </div>
        )}

        {/* Species list tab */}
        {activeTab === 'species' && (
          <div className="flex flex-col gap-4 mb-6">
            {Object.keys(grouped).length === 0 ? (
              <div className="flex items-center justify-center h-32 bg-white rounded-2xl shadow-sm">
                <p className="text-stone-400 text-sm">No sightings recorded yet</p>
              </div>
            ) : (
              Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, species]) => (
                  <div key={type} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-green-100 flex items-center justify-between">
                      <h3 className="text-green-900 font-semibold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                        {type}
                      </h3>
                      <span className="text-green-600 text-xs">{species.length} species</span>
                    </div>
                    <div className="divide-y divide-green-50">
                      {species.map(s => (
                        <div key={s.common_name} className="flex items-center gap-3 px-4 py-3">
                          {s.thumbnail_url ? (
                            <img src={s.thumbnail_url} alt={s.common_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg flex-shrink-0">🐾</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-stone-800 text-sm font-medium truncate">{s.common_name}</p>
                            <p className="text-stone-400 text-xs italic truncate">{s.scientific_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-green-700 text-xs font-medium">{s.count}x</p>
                            <p className="text-stone-400 text-xs">{formatDate(s.first_date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-6 mt-auto">
        <p className="mb-1">🦢 Recorded with <Link href="/" className="underline hover:text-white">Wildgoosechase</Link></p>
        <p className="text-green-500">© {new Date().getFullYear()} Wildgoosechase · All rights reserved</p>
      </footer>

    </div>
  )
}
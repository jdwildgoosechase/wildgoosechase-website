'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import PhotoUploadModal from './PhotoUploadModal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Photo {
  photo_id:       string
  file_path:      string
  thumbnail_path: string | null
  common_name:    string | null
  scientific_name: string | null
  sighting_date:  string | null
  country_name:   string | null
  province_name:  string | null
  hotspot_name:   string | null
  trip_name:      string | null
  comment:        string | null
}

interface Trip {
  trip_id:   number
  trip_name: string
}

interface Hotspot {
  hotspot_id:   number
  hotspot_name: string
}

interface GalleryTabProps {
  wcgUserId: number
}

const PAGE_SIZE = 50

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext }: {
  photo:    Photo
  onClose:  () => void
  onPrev:   () => void
  onNext:   () => void
  hasPrev:  boolean
  hasNext:  boolean
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   onPrev()
      if (e.key === 'ArrowRight')  onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  const location = [photo.hotspot_name, photo.province_name, photo.country_name].filter(Boolean).join(', ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white text-3xl hover:text-green-300 transition-colors z-10"
        onClick={onClose}
      >
        ×
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-4 text-white text-4xl hover:text-green-300 transition-colors z-10 px-4 py-8"
          onClick={e => { e.stopPropagation(); onPrev() }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-4 text-white text-4xl hover:text-green-300 transition-colors z-10 px-4 py-8"
          onClick={e => { e.stopPropagation(); onNext() }}
        >
          ›
        </button>
      )}

      {/* Image */}
      <div
        className="flex flex-col items-center max-w-4xl max-h-screen px-16"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.file_path}
          alt={photo.common_name ?? ''}
          className="max-h-[75vh] max-w-full rounded-xl object-contain"
        />
        <div className="mt-4 text-center">
          <p className="text-white text-lg font-medium" style={{ fontFamily: 'Georgia, serif' }}>
            {photo.common_name ?? 'Unknown species'}
          </p>
          {photo.scientific_name && (
            <p className="text-green-400 text-sm italic">{photo.scientific_name}</p>
          )}
          <p className="text-green-500 text-sm mt-1">
            {[photo.sighting_date, location].filter(Boolean).join(' · ')}
          </p>
          {photo.trip_name && (
            <p className="text-green-600 text-xs mt-0.5">🧳 {photo.trip_name}</p>
          )}
          {photo.comment && (
            <p className="text-stone-400 text-xs mt-1 max-w-md">{photo.comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GalleryTab({ wcgUserId }: GalleryTabProps) {
  const [photos,      setPhotos]      = useState<Photo[]>([])
  const [trips,       setTrips]       = useState<Trip[]>([])
  const [hotspots,    setHotspots]    = useState<Hotspot[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [offset,      setOffset]      = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Filters
  const [speciesFilter,  setSpeciesFilter]  = useState('')
  const [tripFilter,     setTripFilter]     = useState<number | null>(null)
  const [hotspotFilter,  setHotspotFilter]  = useState<number | null>(null)
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [speciesInput,   setSpeciesInput]   = useState('')
  const [showUpload,     setShowUpload]     = useState(false)

  // ── Load filter options ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadFilters() {
      const [tripsRes, hotspotsRes] = await Promise.all([
        supabase.rpc('wcg_web_get_user_trips',    { p_user_id: wcgUserId }),
        supabase.rpc('wcg_web_get_user_hotspots', { p_user_id: wcgUserId }),
      ])
      if (tripsRes.data)    setTrips(tripsRes.data)
      if (hotspotsRes.data) setHotspots(hotspotsRes.data)
    }
    loadFilters()
  }, [wcgUserId])

  // ── Load photos ───────────────────────────────────────────────────────────
  const loadPhotos = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const { data } = await supabase.rpc('wcg_web_get_dashboard_gallery', {
      p_user_id:      wcgUserId,
      p_species_name: speciesFilter || null,
      p_trip_id:      tripFilter,
      p_hotspot_id:   hotspotFilter,
      p_date_from:    dateFrom || null,
      p_date_to:      dateTo   || null,
      p_limit:        PAGE_SIZE,
      p_offset:       currentOffset,
    })

    if (data) {
      if (reset) {
        setPhotos(data)
      } else {
        setPhotos(prev => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
      setOffset(currentOffset + data.length)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [wcgUserId, speciesFilter, tripFilter, hotspotFilter, dateFrom, dateTo, offset])

  // Initial load
  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    loadPhotos(true)
  }, [wcgUserId, speciesFilter, tripFilter, hotspotFilter, dateFrom, dateTo])

  // ── Apply species filter with debounce ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setSpeciesFilter(speciesInput), 400)
    return () => clearTimeout(timer)
  }, [speciesInput])

  // ── Reset filters ─────────────────────────────────────────────────────────
  function resetFilters() {
    setSpeciesInput('')
    setSpeciesFilter('')
    setTripFilter(null)
    setHotspotFilter(null)
    setDateFrom('')
    setDateTo('')
  }

  const hasFilters = speciesFilter || tripFilter || hotspotFilter || dateFrom || dateTo

  // ── Masonry columns ───────────────────────────────────────────────────────
  // Split photos into 3 columns for masonry layout
  const columns: Photo[][] = [[], [], []]
  photos.forEach((photo, i) => columns[i % 3].push(photo))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <Lightbox
          photo={photos[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => i !== null && i > 0 ? i - 1 : i)}
          onNext={() => setLightboxIdx(i => i !== null && i < photos.length - 1 ? i + 1 : i)}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < photos.length - 1}
        />
      )}

      {/* ── Filters ── */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#2a3f2a' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>My Photos</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors"
          >
            📷 Upload Photos
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">

          {/* Species search */}
          <div>
            <label className="block text-green-400 text-xs mb-1">Species</label>
            <input
              type="text"
              value={speciesInput}
              onChange={e => setSpeciesInput(e.target.value)}
              placeholder="Search species…"
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              style={{ backgroundColor: '#1a2e1a' }}
            />
          </div>

          {/* Trip filter */}
          <div>
            <label className="block text-green-400 text-xs mb-1">Trip</label>
            <select
              value={tripFilter ?? ''}
              onChange={e => setTripFilter(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              style={{ backgroundColor: '#1a2e1a' }}
            >
              <option value="">All trips</option>
              {trips.map(t => (
                <option key={t.trip_id} value={t.trip_id}>{t.trip_name}</option>
              ))}
            </select>
          </div>

          {/* Hotspot filter */}
          <div>
            <label className="block text-green-400 text-xs mb-1">Hotspot</label>
            <select
              value={hotspotFilter ?? ''}
              onChange={e => setHotspotFilter(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              style={{ backgroundColor: '#1a2e1a' }}
            >
              <option value="">All hotspots</option>
              {hotspots.map(h => (
                <option key={h.hotspot_id} value={h.hotspot_id}>{h.hotspot_name}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-green-400 text-xs mb-1">Date range</label>
            <div className="flex gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-lg px-2 py-2 text-xs text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                style={{ backgroundColor: '#1a2e1a' }}
              />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-lg px-2 py-2 text-xs text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                style={{ backgroundColor: '#1a2e1a' }}
              />
            </div>
          </div>

        </div>

        {/* Filter summary */}
        <div className="flex items-center justify-between">
          <p className="text-green-400 text-xs">
            {loading ? 'Loading…' : `${photos.length}${hasMore ? '+' : ''} photos`}
            {hasFilters && ' (filtered)'}
          </p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-green-400 hover:text-white transition-colors"
            >
              Clear filters ×
            </button>
          )}
        </div>
      </div>

      {/* ── Photo grid ── */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{ backgroundColor: '#2a3f2a', height: `${150 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl flex items-center justify-center h-48" style={{ backgroundColor: '#2a3f2a' }}>
          <div className="text-center">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-white text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              {hasFilters ? 'No photos match your filters' : 'No photos yet'}
            </p>
            <p className="text-green-400 text-xs mt-1">
              {hasFilters ? 'Try adjusting your filters' : 'Photos added via the app will appear here'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Masonry grid — 3 columns */}
          <div className="grid grid-cols-3 gap-3 items-start">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-3">
                {col.map(photo => {
                  const globalIdx = photos.indexOf(photo)
                  const imgSrc = photo.thumbnail_path || photo.file_path
                  return (
                    <div
                      key={photo.photo_id}
                      className="rounded-xl overflow-hidden cursor-pointer group relative"
                      style={{ backgroundColor: '#2a3f2a' }}
                      onClick={() => setLightboxIdx(globalIdx)}
                    >
                      <img
                        src={imgSrc}
                        alt={photo.common_name ?? ''}
                        className="w-full object-cover group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onError={e => {
                          // Fall back to full size if thumbnail fails
                          const img = e.target as HTMLImageElement
                          if (img.src !== photo.file_path) img.src = photo.file_path
                        }}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                        <div className="w-full px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                          <p className="text-white text-xs font-medium truncate">{photo.common_name ?? 'Unknown'}</p>
                          <p className="text-green-400 text-xs truncate">{photo.sighting_date}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => loadPhotos(false)}
                disabled={loadingMore}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more photos'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload modal */}
      {showUpload && (
        <PhotoUploadModal
          wcgUserId={wcgUserId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            setOffset(0)
            loadPhotos(true)
          }}
        />
      )}

    </div>
  )
}
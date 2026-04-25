'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Photo {
  id:             number
  entry_id:       number
  sort_order:     number
  is_cover:       boolean
  caption:        string | null
  file_path:      string
  thumbnail_path: string | null
  common_name:    string | null
  sighting_date:  string | null
  hotspot_name:   string | null
  province_name:  string | null
  country_name:   string | null
}

interface Day {
  entry_id:        number
  day_number:      number
  entry_date:      string
  title:           string | null
  excerpt:         string | null
  body_text:       string | null
  trip_id:         number | null
  trip_name:       string | null
  trip_start_date: string | null
  trip_end_date:   string | null
}

interface TripDiaryViewerProps {
  days:          Day[]
  photosByEntry: Record<number, Photo[]>
  username_slug: string
  user_name:     string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildPhotoCaption(photo: Photo): string {
  if (photo.caption) return photo.caption
  const parts: string[] = []
  if (photo.common_name)   parts.push(photo.common_name)
  if (photo.sighting_date) parts.push(formatDate(photo.sighting_date))
  const location = photo.hotspot_name ?? photo.province_name ?? photo.country_name
  if (location) parts.push(location)
  return parts.join(' · ')
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  currentIdx,
  onClose,
  onPrev,
  onNext,
}: {
  photos:     Photo[]
  currentIdx: number
  onClose:    () => void
  onPrev:     () => void
  onNext:     () => void
}) {
  const photo   = photos[currentIdx]
  const caption = buildPhotoCaption(photo)

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
      {currentIdx > 0 && (
        <button
          className="absolute left-4 text-white text-5xl hover:text-green-300 transition-colors z-10 px-4 py-8"
          onClick={e => { e.stopPropagation(); onPrev() }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {currentIdx < photos.length - 1 && (
        <button
          className="absolute right-4 text-white text-5xl hover:text-green-300 transition-colors z-10 px-4 py-8"
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
          alt={caption}
          className="max-h-[78vh] max-w-full rounded-xl object-contain"
        />
        {caption && (
          <div className="mt-4 text-center">
            <p className="text-white text-sm">{caption}</p>
          </div>
        )}
        <p className="text-green-600 text-xs mt-2">
          {currentIdx + 1} of {photos.length}
        </p>
      </div>
    </div>
  )
}

// ── Nav buttons ───────────────────────────────────────────────────────────────

function DayNavButtons({
  days,
  currentDay,
  setCurrentDay,
}: {
  days:          Day[]
  currentDay:    number
  setCurrentDay: (fn: (d: number) => number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentDay(d => Math.max(0, d - 1))}
        disabled={currentDay === 0}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white text-green-700 border border-green-300 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Prev day
      </button>
      <div className="flex gap-1.5">
        {days.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentDay(() => idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentDay ? 'bg-green-700' : 'bg-green-300 hover:bg-green-500'
            }`}
          />
        ))}
      </div>
      <button
        onClick={() => setCurrentDay(d => Math.min(days.length - 1, d + 1))}
        disabled={currentDay === days.length - 1}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white text-green-700 border border-green-300 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next day →
      </button>
      <span className="text-green-600 text-xs">
        Day {days[currentDay].day_number} of {days.length}
      </span>
    </div>
  )
}

// ── Photo column ──────────────────────────────────────────────────────────────

function PhotoColumn({
  photos,
  onPhotoClick,
}: {
  photos:       Photo[]
  onPhotoClick: (photo: Photo) => void
}) {
  if (photos.length === 0) return <div style={{ width: '280px' }} className="flex-shrink-0" />

  return (
    <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: '280px' }}>
      {photos.map(photo => {
        const caption = buildPhotoCaption(photo)
        return (
          <div key={photo.id}>
            <div
              className="rounded-2xl overflow-hidden bg-green-100 w-full cursor-pointer hover:opacity-90 transition-opacity"
              style={{ aspectRatio: '4/3' }}
              onClick={() => onPhotoClick(photo)}
            >
              <img
                src={photo.thumbnail_path ?? photo.file_path}
                alt={caption}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            {caption && (
              <p className="text-stone-500 text-xs mt-1.5 text-center px-1 line-clamp-2">
                {caption}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Day content ───────────────────────────────────────────────────────────────

function DayContent({
  day,
  photos,
  onPhotoClick,
}: {
  day:          Day
  photos:       Photo[]
  onPhotoClick: (photo: Photo) => void
}) {
  const dayLabel = `Day ${day.day_number} · ${formatDate(day.entry_date)}`

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-white text-sm font-bold">
          {day.day_number}
        </div>
        <h2 className="text-green-900 text-xl" style={{ fontFamily: 'Georgia, serif' }}>
          {dayLabel}
        </h2>
        <div className="flex-1 h-px bg-green-300" />
      </div>

      <div className="flex gap-24 items-start">

        <div className="flex-1 min-w-0">
          {day.body_text ? (
            <article className="bg-white rounded-2xl p-6 shadow-sm prose prose-green max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {day.body_text}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-stone-400 text-sm italic">No entry for this day yet.</p>
            </div>
          )}
        </div>

        <PhotoColumn photos={photos} onPhotoClick={onPhotoClick} />

      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TripDiaryViewer({
  days,
  photosByEntry,
}: TripDiaryViewerProps) {
  const [viewMode,      setViewMode]      = useState<'single' | 'all'>('single')
  const [currentDay,    setCurrentDay]    = useState(0)
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[] | null>(null)
  const [lightboxIdx,   setLightboxIdx]   = useState(0)

  function openLightbox(photos: Photo[], photo: Photo) {
    const idx = photos.findIndex(p => p.id === photo.id)
    setLightboxPhotos(photos)
    setLightboxIdx(idx >= 0 ? idx : 0)
  }

  function closeLightbox() {
    setLightboxPhotos(null)
    setLightboxIdx(0)
  }

  return (
    <div>

      {/* ── Lightbox ── */}
      {lightboxPhotos && (
        <Lightbox
          photos={lightboxPhotos}
          currentIdx={lightboxIdx}
          onClose={closeLightbox}
          onPrev={() => setLightboxIdx(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIdx(i => Math.min(lightboxPhotos.length - 1, i + 1))}
        />
      )}

      {/* ── View toggle ── */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => { setViewMode('single'); setCurrentDay(0) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'single'
              ? 'bg-green-800 text-white'
              : 'bg-white text-green-700 hover:bg-green-50 border border-green-300'
          }`}
        >
          One day at a time
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'all'
              ? 'bg-green-800 text-white'
              : 'bg-white text-green-700 hover:bg-green-50 border border-green-300'
          }`}
        >
          All days
        </button>
      </div>

      {/* ── Single day view ── */}
      {viewMode === 'single' && (
        <div>
          <div className="mb-6 mt-2">
            <DayNavButtons
              days={days}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
            />
          </div>

          <DayContent
            day={days[currentDay]}
            photos={photosByEntry[days[currentDay].entry_id] ?? []}
            onPhotoClick={photo =>
              openLightbox(photosByEntry[days[currentDay].entry_id] ?? [], photo)
            }
          />

          <div className="mt-6 pt-4 border-t border-green-200">
            <DayNavButtons
              days={days}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
            />
          </div>
        </div>
      )}

      {/* ── All days view ── */}
      {viewMode === 'all' && (
        <div>
          {days.map((day, idx) => (
            <div key={day.entry_id} className="mb-10">
              <DayContent
                day={day}
                photos={photosByEntry[day.entry_id] ?? []}
                onPhotoClick={photo =>
                  openLightbox(photosByEntry[day.entry_id] ?? [], photo)
                }
              />
              {idx < days.length - 1 && (
                <div className="border-b border-green-200 mt-8" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
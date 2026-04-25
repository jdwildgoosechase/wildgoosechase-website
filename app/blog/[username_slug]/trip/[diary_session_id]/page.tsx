import { supabase } from '../../../../../lib/supabase'
import NavBar from '../../../../components/NavBar'
import Map from '../../../../components/Map'
import CollapsibleSection from '../../../../components/CollapsibleSection'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const revalidate = 60

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateRange(start: string, end: string | null): string {
  if (!end) return formatDate(start)
  const s = new Date(start)
  const e = new Date(end)
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${formatDate(end)}`
  }
  return `${formatDate(start)} – ${formatDate(end)}`
}

function buildPhotoCaption(photo: any): string {
  if (photo.caption) return photo.caption
  const parts: string[] = []
  if (photo.common_name)   parts.push(photo.common_name)
  if (photo.sighting_date) parts.push(formatDate(photo.sighting_date))
  const location = photo.hotspot_name ?? photo.province_name ?? photo.country_name
  if (location) parts.push(location)
  return parts.join(' · ')
}

export default async function TripDiaryPage({
  params,
}: {
  params: Promise<{ username_slug: string; diary_session_id: string }>
}) {
  const { username_slug, diary_session_id } = await params

  const { data: profileData } = await supabase
    .from('usr_user_profiles')
    .select('wcg_user_id, user_name, username_slug')
    .eq('username_slug', username_slug)
    .single()

  if (!profileData) notFound()

  const { data: daysData } = await supabase
    .rpc('wcg_web_get_trip_diary', {
      p_user_id:          profileData.wcg_user_id,
      p_diary_session_id: diary_session_id,
    })

  const days = (daysData as any[]) ?? []
  if (days.length === 0) notFound()

  const day1     = days[0]
  const tripName = day1.title ?? day1.trip_name ?? 'Trip Diary'
  const tripId   = day1.trip_id

  const entryIds = days.map((d: any) => d.entry_id)

  const [photosRes, speciesRes, mapRes] = await Promise.all([
    supabase.rpc('wcg_web_get_trip_diary_photos', { p_entry_ids: entryIds }),
    tripId
      ? supabase.rpc('wcg_web_get_blog_trip_species', { p_trip_id: tripId })
      : Promise.resolve({ data: [] }),
    tripId
      ? supabase.rpc('wcg_web_get_blog_trip_map', { p_trip_id: tripId })
      : Promise.resolve({ data: [] }),
  ])

  const allPhotos     = (photosRes.data  as any[]) ?? []
  const tripSpecies   = (speciesRes.data as any[]) ?? []
  const tripMapPoints = (mapRes.data     as any[]) ?? []

  // Group photos by entry_id
  const photosByEntry: Record<number, any[]> = {}
  allPhotos.forEach((photo: any) => {
    if (!photosByEntry[photo.entry_id]) photosByEntry[photo.entry_id] = []
    photosByEntry[photo.entry_id].push(photo)
  })

  const coverPhoto = allPhotos.find((p: any) => p.is_cover && p.entry_id === day1.entry_id)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Nav ── */}
      <div style={{ backgroundColor: '#0f1f0f' }}>
        <NavBar transparent={false} />
      </div>

      {/* ── Cover hero ── */}
      {coverPhoto?.file_path ? (
        <div className="relative w-full h-80 md:h-96 overflow-hidden">
          <img
            src={coverPhoto.file_path}
            alt={tripName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 pointer-events-none">
            {day1.trip_start_date && (
              <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
                {formatDateRange(day1.trip_start_date, day1.trip_end_date)}
                {' · '}
                {days.length} {days.length === 1 ? 'day' : 'days'}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl drop-shadow-lg max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
              {tripName}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-green-900 py-16 px-6 text-center">
          {day1.trip_start_date && (
            <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
              {formatDateRange(day1.trip_start_date, day1.trip_end_date)}
              {' · '}
              {days.length} {days.length === 1 ? 'day' : 'days'}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl text-white max-w-3xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            {tripName}
          </h1>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Back link */}
        <Link
          href={`/blog/${username_slug}`}
          className="text-green-700 text-sm hover:text-green-900 transition-colors mb-6 inline-block"
        >
          ← Back to {profileData.user_name}'s diary
        </Link>

        {/* Day 1 excerpt teaser */}
        {day1.excerpt && (
          <div className="border-l-4 border-green-600 pl-4 mb-8">
            <p className="text-stone-600 text-base italic leading-relaxed">
              {day1.excerpt}
            </p>
          </div>
        )}

        {/* ── Day by day timeline ── */}
        {days.map((day: any, idx: number) => {
          const dayPhotos    = photosByEntry[day.entry_id] ?? []
          const nonCoverDay  = dayPhotos.filter((p: any) => !p.is_cover)
          const dayLabel     = idx === 0
            ? null
            : `Day ${day.day_number} · ${formatDate(day.entry_date)}`

          return (
            <div key={day.entry_id} className="mb-10">

              {/* Day header */}
              {dayLabel && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-white text-sm font-bold">
                    {day.day_number}
                  </div>
                  <h2 className="text-green-900 text-xl" style={{ fontFamily: 'Georgia, serif' }}>
                    {dayLabel}
                  </h2>
                  <div className="flex-1 h-px bg-green-300" />
                </div>
              )}

              {/* ── Two column layout per day ── */}
              <div className="flex gap-6 items-start">

                {/* Left — narrative */}
                <div className="flex-1 min-w-0">
                  {day.body_text && (
                    <article className="bg-white rounded-2xl p-6 shadow-sm prose prose-green max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {day.body_text}
                      </ReactMarkdown>
                    </article>
                  )}
                </div>

                {/* Right — photos for this day */}
                {nonCoverDay.length > 0 && (
                  <div className="w-56 flex-shrink-0 flex flex-col gap-3">
                    {nonCoverDay.map((photo: any) => {
                      const caption = buildPhotoCaption(photo)
                      return (
                        <div key={photo.id}>
                          <div className="rounded-xl overflow-hidden aspect-square bg-green-100">
                            <img
                              src={photo.thumbnail_path ?? photo.file_path}
                              alt={caption}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {caption && (
                            <p className="text-stone-500 text-xs mt-1 text-center px-1">{caption}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>

              {/* Day divider */}
              {idx < days.length - 1 && (
                <div className="border-b border-green-200 mt-8" />
              )}

            </div>
          )
        })}

        {/* ── Prev / Next navigation ── */}
        <div className="flex items-center justify-between gap-4 mb-8 pt-4 border-t border-green-300">
          <div className="flex-1" />
          <div className="flex-1" />
        </div>

        {/* ── Species list — collapsible ── */}
        {tripSpecies.length > 0 && (
          <CollapsibleSection title={`🐦 Species Recorded (${tripSpecies.length})`}>
            <div className="grid grid-cols-2 divide-x divide-stone-100">
              {tripSpecies.map((species: any, i: number) => (
                <div
                  key={species.common_name}
                  className={`flex items-center justify-between px-4 py-2 ${
                    Math.floor(i / 2) % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                  }`}
                >
                  <div>
                    <p className="text-stone-800 text-sm font-medium">{species.common_name}</p>
                    <p className="text-stone-400 text-xs italic">{species.scientific_name}</p>
                  </div>
                  <span className="text-green-600 text-xs font-semibold ml-2 flex-shrink-0">
                    ×{species.sighting_count}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Map — collapsible ── */}
        {tripMapPoints.length > 0 && (
          <CollapsibleSection title="🗺️ Sighting Locations">
            <div className="p-4">
              <Map points={tripMapPoints} theme="light" height={350} />
            </div>
          </CollapsibleSection>
        )}

      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4 mt-8">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
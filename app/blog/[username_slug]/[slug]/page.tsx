import { supabase } from '../../../../lib/supabase'
import NavBar from '../../../components/NavBar'
import Map from '../../../components/Map'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export const revalidate = 60

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogEntryPage({
  params,
}: {
  params: { username_slug: string; slug: string }
}) {
  const { username_slug, slug } = params

  // Load entry
  const { data: entryData } = await supabase
    .rpc('wcg_web_get_blog_entry', {
      p_username_slug: username_slug,
      p_slug:          slug,
    })

  const entry = entryData?.[0]
  if (!entry) notFound()

  // Load photos, adjacent entries, and optionally trip data in parallel
  const [photosRes, adjacentRes, tripSpeciesRes, tripMapRes] = await Promise.all([
    supabase.rpc('wcg_web_get_blog_entry_photos', { p_entry_id: entry.entry_id }),
    supabase.rpc('wcg_web_get_blog_adjacent', {
      p_user_id:    entry.user_id,
      p_entry_date: entry.entry_date,
      p_entry_id:   entry.entry_id,
    }),
    entry.trip_id
      ? supabase.rpc('wcg_web_get_blog_trip_species', { p_trip_id: entry.trip_id })
      : Promise.resolve({ data: [] }),
    entry.trip_id
      ? supabase.rpc('wcg_web_get_blog_trip_map', { p_trip_id: entry.trip_id })
      : Promise.resolve({ data: [] }),
  ])

  const photos        = (photosRes.data      as any[]) ?? []
  const adjacent      = adjacentRes.data?.[0] ?? {}
  const tripSpecies   = (tripSpeciesRes.data  as any[]) ?? []
  const tripMapPoints = (tripMapRes.data      as any[]) ?? []


  const nonCoverPhotos = photos.filter((p: any) => !p.is_cover)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Nav ── */}
      <div style={{ backgroundColor: '#0f1f0f' }}>
        <NavBar transparent={false} />
      </div>

      {/* ── Cover hero ── */}
      {entry.cover_url ? (
        <div className="relative w-full h-80 md:h-96 overflow-hidden">
          <img
            src={entry.cover_url}
            alt={entry.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 pointer-events-none">
            <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
              {formatDate(entry.entry_date)}
            </p>
            <h1
              className="text-3xl md:text-5xl drop-shadow-lg max-w-3xl"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {entry.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-green-900 py-16 px-6 text-center">
          <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
            {formatDate(entry.entry_date)}
          </p>
          <h1
            className="text-3xl md:text-5xl text-white max-w-3xl mx-auto"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {entry.title}
          </h1>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Back link */}
        <Link
          href={`/blog/${username_slug}`}
          className="text-green-700 text-sm hover:text-green-900 transition-colors mb-6 inline-block"
        >
          ← Back to {entry.user_name}'s diary
        </Link>

        {/* ── Body text ── */}
        {entry.body_text && (
          <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-8 prose prose-green max-w-none">
            <ReactMarkdown>{entry.body_text}</ReactMarkdown>
          </article>
        )}

        {/* ── Photo gallery ── */}
        {nonCoverPhotos.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-green-900 text-xl mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              📷 Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {nonCoverPhotos.map((photo: any) => {
                const caption = buildPhotoCaption(photo)
                return (
                  <div key={photo.id} className="flex flex-col">
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
          </div>
        )}

        {/* ── Trip species list ── */}
        {tripSpecies.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-green-900 text-xl mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              🐦 Species Recorded
            </h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-stone-100">
                {tripSpecies.map((species: any, i: number) => (
                  <div
                    key={species.common_name}
                    className={`flex items-center justify-between px-4 py-2 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-stone-50'
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
              <div className="px-4 py-2 border-t border-stone-100 bg-stone-50">
                <p className="text-stone-400 text-xs">{tripSpecies.length} species recorded</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Trip map ── */}
        {tripMapPoints.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-green-900 text-xl mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              🗺️ Sighting Locations
            </h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
              <Map points={tripMapPoints} theme="light" height={400} />
            </div>
          </div>
        )}

        {/* ── Prev / Next navigation ── */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-green-300">
          {adjacent.prev_slug ? (
            <Link
              href={`/blog/${username_slug}/${adjacent.prev_slug}`}
              className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <p className="text-green-500 text-xs mb-1">← Previous</p>
              <p
                className="text-green-900 text-sm font-medium group-hover:text-green-700 transition-colors line-clamp-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {adjacent.prev_title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {adjacent.next_slug ? (
            <Link
              href={`/blog/${username_slug}/${adjacent.next_slug}`}
              className="flex-1 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group text-right"
            >
              <p className="text-green-500 text-xs mb-1">Next →</p>
              <p
                className="text-green-900 text-sm font-medium group-hover:text-green-700 transition-colors line-clamp-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {adjacent.next_title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4 mt-8">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
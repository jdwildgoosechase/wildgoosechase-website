import { supabase } from '../../../lib/supabase'
import NavBar from '../../components/NavBar'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ username_slug: string }>
}) {
  const { username_slug } = await params

  // Load profile
  const { data: profileData } = await supabase
    .from('usr_user_profiles')
    .select('wcg_user_id, user_name, profile_picture_url, bio, blog_title, username_slug')
    .eq('username_slug', username_slug)
    .single()

  if (!profileData) notFound()

  // Load all entries (single + trip day 1s)
  const { data: entries } = await supabase
    .rpc('wcg_web_get_blog_entries', { p_user_id: profileData.wcg_user_id })

  const allEntries = (entries as any[]) ?? []
  const heroEntry  = allEntries[0] ?? null
  const gridEntries = allEntries.slice(1)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Nav ── */}
      <div style={{ backgroundColor: '#0f1f0f' }}>
        <NavBar transparent={false} />
      </div>

      {/* ── Profile header ── */}
      <div className="bg-green-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          {profileData.profile_picture_url ? (
            <img
              src={profileData.profile_picture_url}
              alt={profileData.user_name}
              className="w-20 h-20 rounded-full object-cover border-4 border-green-600 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center text-3xl flex-shrink-0">
              🦢
            </div>
          )}
          <div>
            <h1
              className="text-3xl md:text-4xl text-white mb-1"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {profileData.blog_title ?? `${profileData.user_name}'s Nature Diary`}
            </h1>
            {profileData.bio && (
              <p className="text-green-300 text-sm mt-2 max-w-xl">{profileData.bio}</p>
            )}
            <p className="text-green-500 text-xs mt-2">
              {allEntries.length} {allEntries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {allEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-green-800 text-lg" style={{ fontFamily: 'Georgia, serif' }}>No entries yet</p>
            <p className="text-green-600 text-sm mt-2">Check back soon</p>
          </div>
        ) : (
          <>
            {/* ── Hero entry ── */}
            {heroEntry && (
              <Link
                href={
                  heroEntry.view_mode === 'daily'
                    ? `/blog/${username_slug}/trip/${heroEntry.diary_session_id}`
                    : `/blog/${username_slug}/${heroEntry.slug}`
                }
                className="block mb-8 group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {heroEntry.cover_url ? (
                    <div className="w-full h-72 overflow-hidden relative">
                      <img
                        src={heroEntry.cover_thumb ?? heroEntry.cover_url}
                        alt={heroEntry.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {heroEntry.view_mode === 'daily' && (
                        <div className="absolute top-3 right-3 bg-green-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {heroEntry.day_count} {heroEntry.day_count === 1 ? 'day' : 'days'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-72 bg-green-800 flex items-center justify-center relative">
                      <span className="text-6xl">🌿</span>
                      {heroEntry.view_mode === 'daily' && (
                        <div className="absolute top-3 right-3 bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {heroEntry.day_count} {heroEntry.day_count === 1 ? 'day' : 'days'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-green-600 text-xs uppercase tracking-wide mb-2">
                      {heroEntry.view_mode === 'daily' && heroEntry.trip_start_date
                        ? formatDateRange(heroEntry.trip_start_date, heroEntry.trip_end_date)
                        : formatDate(heroEntry.entry_date)
                      }
                      {' · '}
                      {heroEntry.view_mode === 'daily' ? 'Trip Diary' : 'Latest Entry'}
                    </p>
                    <h2
                      className="text-green-900 text-2xl md:text-3xl mb-3 group-hover:text-green-700 transition-colors"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {heroEntry.title}
                    </h2>
                    {heroEntry.excerpt && (
                      <p className="text-stone-500 text-sm leading-relaxed line-clamp-3">
                        {heroEntry.excerpt}
                      </p>
                    )}
                    <p className="text-green-600 text-sm mt-4 font-medium group-hover:text-green-800 transition-colors">
                      {heroEntry.view_mode === 'daily' ? 'Read the diary →' : 'Read more →'}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* ── Grid entries ── */}
            {gridEntries.length > 0 && (
              <>
                <h2
                  className="text-green-900 text-xl mb-4"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Previous Entries
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gridEntries.map((entry: any) => (
                    <Link
                      key={entry.entry_id}
                      href={
                        entry.view_mode === 'daily'
                          ? `/blog/${username_slug}/trip/${entry.diary_session_id}`
                          : `/blog/${username_slug}/${entry.slug}`
                      }
                      className="block group"
                    >
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                        {entry.cover_url ? (
                          <div className="w-full h-40 overflow-hidden flex-shrink-0 relative">
                            <img
                              src={entry.cover_thumb ?? entry.cover_url}
                              alt={entry.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {entry.view_mode === 'daily' && (
                              <div className="absolute top-2 right-2 bg-green-800 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                {entry.day_count} {entry.day_count === 1 ? 'day' : 'days'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-40 bg-green-800 flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-4xl">🌿</span>
                            {entry.view_mode === 'daily' && (
                              <div className="absolute top-2 right-2 bg-green-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                {entry.day_count} {entry.day_count === 1 ? 'day' : 'days'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-1">
                          <p className="text-green-600 text-xs mb-1">
                            {entry.view_mode === 'daily' && entry.trip_start_date
                              ? formatDateRange(entry.trip_start_date, entry.trip_end_date)
                              : formatDate(entry.entry_date)
                            }
                          </p>
                          <h3
                            className="text-green-900 text-base font-semibold mb-2 group-hover:text-green-700 transition-colors line-clamp-2"
                            style={{ fontFamily: 'Georgia, serif' }}
                          >
                            {entry.title}
                          </h3>
                          {entry.excerpt && (
                            <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 flex-1">
                              {entry.excerpt}
                            </p>
                          )}
                          <p className="text-green-600 text-xs mt-3 font-medium group-hover:text-green-800 transition-colors">
                            {entry.view_mode === 'daily' ? 'Read the diary →' : 'Read more →'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4 mt-8">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
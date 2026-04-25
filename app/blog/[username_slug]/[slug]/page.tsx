import { supabase } from '../../../../lib/supabase'
import NavBar from '../../../components/NavBar'
import CollapsibleSection from '../../../components/CollapsibleSection'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const revalidate = 60

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

export default async function BlogEntryPage({
  params,
}: {
  params: Promise<{ username_slug: string; slug: string }>
}) {
  const { username_slug, slug } = await params

  const { data: profileData } = await supabase
    .from('usr_user_profiles')
    .select('wcg_user_id, user_name, username_slug')
    .eq('username_slug', username_slug)
    .single()

  if (!profileData) notFound()

  const { data: entryData } = await supabase
    .from('fld_diary_entries')
    .select('*')
    .eq('user_id', profileData.wcg_user_id)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_public', true)
    .single()

  if (!entryData) notFound()

  const { data: photosData } = await supabase
    .rpc('wcg_web_get_blog_entry_photos', { p_entry_id: entryData.entry_id })

  const photos         = (photosData as any[]) ?? []
  const coverPhoto     = photos.find((p: any) => p.is_cover)
  const nonCoverPhotos = photos.filter((p: any) => !p.is_cover)

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
            alt={entryData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 pointer-events-none">
            <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
              {formatDate(entryData.entry_date)}
            </p>
            <h1 className="text-3xl md:text-5xl drop-shadow-lg max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
              {entryData.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-green-900 py-16 px-6 text-center">
          <p className="text-green-300 text-sm mb-2 uppercase tracking-wide">
            {formatDate(entryData.entry_date)}
          </p>
          <h1 className="text-3xl md:text-5xl text-white max-w-3xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            {entryData.title}
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

        {/* ── Two column layout ── */}
        <div className="flex gap-6 items-start">

          {/* ── Left — narrative ── */}
          <div className="flex-1 min-w-0">

            {/* Excerpt teaser */}
            {entryData.excerpt && (
              <div className="border-l-4 border-green-600 pl-4 mb-6">
                <p className="text-stone-600 text-base italic leading-relaxed">
                  {entryData.excerpt}
                </p>
              </div>
            )}

            {/* Body text */}
            {entryData.body_text && (
              <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6 prose prose-green max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {entryData.body_text}
                </ReactMarkdown>
              </article>
            )}

          </div>

          {/* ── Right — photos ── */}
          {nonCoverPhotos.length > 0 && (
            <div className="w-72 flex-shrink-0 grid grid-cols-2 gap-2 content-start">
              {nonCoverPhotos.map((photo: any) => {
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

      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4 mt-8">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
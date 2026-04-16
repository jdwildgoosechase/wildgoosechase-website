import { supabase } from '../lib/supabase'
import Map from './components/Map'
import PhotoGallery from './components/PhotoGallery'
import NavBar from './components/NavBar'

export const revalidate = 60

export default async function Home() {

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: statsData } = await supabase.rpc('wcg_web_get_stats')
  const stats        = statsData as any
  const totalSightings  = stats?.total_sightings  ?? 0
  const uniqueSpecies   = stats?.unique_species   ?? 0
  const uniqueCountries = stats?.unique_countries ?? 0
  const uniqueYears     = stats?.unique_years     ?? 0

  const { data: communityData } = await supabase.rpc('wcg_web_get_community_stats')
  const community     = communityData?.[0]
  const totalUsers    = community?.total_users    ?? 0
  const activeUsers7d = community?.active_users_7d ?? 0

  const { data: mapSightings } = await supabase.rpc('wcg_web_get_map_clusters')

  const { data: galleryPhotosRaw } = await supabase.rpc('wcg_web_get_gallery_photos')
  const galleryPhotos = galleryPhotosRaw
    ? [...galleryPhotosRaw].sort(() => Math.random() - 0.5)
    : []

  const { data: animalTypeStats } = await supabase.rpc('wcg_web_get_animal_type_stats')

  // ── Animal type emoji map ─────────────────────────────────────────────────

  const animalTypeEmoji: Record<string, string> = {
    'Bird':       '🐦', 'Birds':       '🐦',
    'Mammal':     '🦁', 'Mammals':     '🦁',
    'Reptile':    '🦎', 'Reptiles':    '🦎',
    'Amphibian':  '🐸', 'Amphibians':  '🐸',
    'Fish':       '🐟', 'Fishes':      '🐟',
    'Insect':     '🦋', 'Insects':     '🦋',
    'Spider':     '🕷️', 'Spiders':     '🕷️',
    'Plant':      '🌿', 'Plants':      '🌿',
  }

  // ── Page ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Hero ── */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Wildlife hero"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0">
          <NavBar transparent={true} />
        </div>

        {/* Hero text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 pointer-events-none">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
            Wildgoosechase
          </h1>
          <p className="text-xl text-green-200 drop-shadow max-w-xl">
            Tracking wildlife across the world — one sighting at a time 🌍
          </p>
        </div>

        {/* Stats strip */}
        <div className="absolute bottom-0 left-0 right-0 py-6 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
            {[
              { value: Number(totalSightings).toLocaleString(),  label: 'Total Sightings'   },
              { value: Number(uniqueSpecies).toLocaleString(),   label: 'Species Recorded'  },
              { value: Number(uniqueCountries).toLocaleString(), label: 'Countries Visited' },
              { value: Number(uniqueYears).toLocaleString(),     label: 'Years of Data'     },
              { value: Number(totalUsers).toLocaleString(),      label: 'Registered Users'  },
              { value: Number(activeUsers7d).toLocaleString(),   label: 'Active This Week'  },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-green-300 text-xs mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Photo gallery ── */}
      <PhotoGallery photos={galleryPhotos || []} />

      {/* ── Divider ── */}
      <div className="h-2 bg-green-800 w-full" />

      {/* ── Animal type stats grid ── */}
      <div className="px-6 py-10" style={{ backgroundColor: '#d4e8d4' }}>
        <h2
          className="text-2xl text-green-900 mb-2 text-center"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Wildlife by Type
        </h2>
        <p className="text-green-700 text-sm text-center mb-6">
          A breakdown of all sightings recorded across the Wildgoosechase community
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {(animalTypeStats as any[])?.map((type: any) => (
            <div
              key={type.animal_type_id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">{animalTypeEmoji[type.animal_type_name] ?? '🐾'}</span>
                <h3
                  className="text-green-900 font-semibold text-lg"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {type.animal_type_name}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-green-800 text-xl font-bold">{Number(type.total_sightings).toLocaleString()}</p>
                  <p className="text-stone-400 text-xs mt-0.5">Sightings</p>
                </div>
                <div>
                  <p className="text-green-800 text-xl font-bold">{Number(type.total_species).toLocaleString()}</p>
                  <p className="text-stone-400 text-xs mt-0.5">Species</p>
                </div>
                <div>
                  <p className="text-green-800 text-xl font-bold">{Number(type.total_countries).toLocaleString()}</p>
                  <p className="text-stone-400 text-xs mt-0.5">Countries</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-2 bg-green-800 w-full" />

      {/* ── Two column layout ── */}
      <div className="px-3 py-6 flex gap-4">

        {/* Left — Conservation & Resources */}
        <div className="w-1/3 flex-shrink-0 flex flex-col gap-4 bg-white rounded-2xl border border-stone-200 p-4">
          <h2 className="text-lg font-bold text-stone-700">🌍 Conservation & Resources</h2>
          {[
            { name: 'BirdLife South Africa', desc: 'Protecting birds and their habitats',       url: 'https://www.birdlife.org.za',    emoji: '🐦' },
            { name: 'SABAP2',                desc: 'South African Bird Atlas Project',          url: 'http://sabap2.adu.org.za',       emoji: '🗺️' },
            { name: 'iNaturalist',           desc: 'Record and identify wildlife worldwide',    url: 'https://www.inaturalist.org',    emoji: '🔬' },
            { name: 'eBird',                 desc: 'Global bird sighting database by Cornell',  url: 'https://ebird.org',              emoji: '📋' },
            { name: 'WWF South Africa',      desc: 'Wildlife and conservation news',            url: 'https://www.wwf.org.za',         emoji: '🐾' },
          ].map(org => (
            <a
              key={org.name}
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-50 rounded-xl border border-stone-200 p-4 hover:border-green-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                  {org.emoji}
                </div>
                <div>
                  <div className="font-semibold text-stone-800 text-sm group-hover:text-green-700 transition-colors">{org.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{org.desc}</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Right — Map */}
        <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-4">
          <h2 className="text-lg font-bold text-stone-700 mb-3">🗺️ Sighting Locations</h2>
          <Map points={mapSightings || []} theme="light" height={750} />
        </div>

      </div>

      {/* ── Call to action ── */}
      <div className="bg-green-800 text-white py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🦢</div>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Start tracking your own wildlife encounters
          </h2>
          <p className="text-green-200 text-lg mb-8 leading-relaxed">
            Wildgoosechase is a free Android app for recording and exploring your wildlife sightings.
            Build your life list, track your trips, and map every encounter with the wild.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="#"
              className="bg-white text-green-800 font-bold px-8 py-3 rounded-full hover:bg-green-100 transition-colors"
            >
              📱 Download for Android
            </a>
            <a
              href="#"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-green-800 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center py-6 text-sm">
        <p>🦢 Wildgoosechase — Personal Wildlife Tracker</p>
        <p className="mt-1 text-green-400">Built with Next.js & Supabase</p>
      </footer>

    </main>
  )
}
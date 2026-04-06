import { supabase } from '../lib/supabase'
import Map from './components/Map'
import PhotoGallery from './components/PhotoGallery'

export default async function Home() {

  // Fetch all stats in one call
  const { data: statsData } = await supabase
    .rpc('wcg_web_get_stats')

  const stats = statsData as any
  const totalSightings = stats?.total_sightings ?? 0
  const uniqueSpecies = stats?.unique_species ?? 0
  const uniqueCountries = stats?.unique_countries ?? 0
  const uniqueYears = stats?.unique_years ?? 0

  // Fetch clustered map points
  const { data: mapSightings } = await supabase
    .rpc('wcg_web_get_map_clusters')

  // Fetch gallery photos
  const { data: galleryPhotosRaw } = await supabase
    .rpc('wcg_web_get_gallery_photos')

  // Shuffle on the server so client and server match
  const galleryPhotos = galleryPhotosRaw 
    ? [...galleryPhotosRaw].sort(() => Math.random() - 0.5)
    : []

  // Fetch recent sightings via RPC
  const { data: recentSightings } = await supabase
    .rpc('wcg_web_get_recent_sightings')

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d4e8d4' }}>

  
{/* Hero with image */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Wildlife hero"
          className="w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Header overlaid on image */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦢</span>
            <span className="text-2xl font-bold tracking-wide text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Wildgoosechase
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
            <a href="#" className="hover:text-green-300 transition-colors">Species</a>
            <a href="#" className="hover:text-green-300 transition-colors">Trips</a>
            <a href="#" className="hover:text-green-300 transition-colors">Travels</a>
            <a href="#" className="hover:text-green-300 transition-colors">Gallery</a>
            <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full text-sm font-semibold transition-colors text-white">
              Sign In
            </button>
          </nav>
        </div>

        {/* Hero text overlaid on image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
            Wildgoosechase
          </h1>
          <p className="text-xl text-green-200 drop-shadow max-w-xl">
            Tracking wildlife across the world — one sighting at a time 🌍
          </p>
        </div>

        {/* Stats overlaid at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 py-6 px-6">          
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{Number(totalSightings).toLocaleString()}</div>
              <div className="text-green-300 text-xs mt-1 uppercase tracking-wide">Total Sightings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{Number(uniqueSpecies).toLocaleString()}</div>
              <div className="text-green-300 text-xs mt-1 uppercase tracking-wide">Species Recorded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{Number(uniqueCountries)}</div>
              <div className="text-green-300 text-xs mt-1 uppercase tracking-wide">Countries Visited</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{Number(uniqueYears)}</div>
              <div className="text-green-300 text-xs mt-1 uppercase tracking-wide">Years of Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo gallery */}
      <PhotoGallery photos={galleryPhotos || []} />

      {/* Divider */}
      <div className="h-2 bg-green-800 w-full" />

 {/* Two column layout */}
      <div className="px-3 py-6 flex gap-4">

        {/* Left column — Links & Organisations (1/3) */}
        <div className="w-1/3 flex-shrink-0 flex flex-col gap-4 bg-white rounded-2xl border border-stone-200 p-4">

          <h2 className="text-lg font-bold text-stone-700">🌍 Conservation & Resources</h2>

{/* Organisation cards */}
          {[
            { name: "BirdLife South Africa", desc: "Protecting birds and their habitats", url: "https://www.birdlife.org.za", emoji: "🐦" },
            { name: "SABAP2", desc: "South African Bird Atlas Project", url: "http://sabap2.adu.org.za", emoji: "🗺️" },
            { name: "iNaturalist", desc: "Record and identify wildlife worldwide", url: "https://www.inaturalist.org", emoji: "🔬" },
            { name: "eBird", desc: "Global bird sighting database by Cornell", url: "https://ebird.org", emoji: "📋" },
            { name: "WWF South Africa", desc: "Wildlife and conservation news", url: "https://www.wwf.org.za", emoji: "🐾" },
          ].map((org) => (
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

        {/* Right column — Map, Animal of Day, Recent Sightings (2/3) */}
        <div className="flex-1 flex flex-col gap-6 bg-white rounded-2xl border border-stone-200 p-4">

          {/* Map */}
          <div>
            <h2 className="text-lg font-bold text-stone-700 mb-3">🗺️ Sighting Locations</h2>
            <Map points={mapSightings || []} />
          </div>

          {/* Animal of the Day — placeholder for now */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4">
            <span className="text-4xl">🦅</span>
            <div>
              <div className="text-xs text-green-600 uppercase tracking-wide font-semibold">Animal of the Day</div>
              <div className="font-bold text-stone-800">Coming soon</div>
              <div className="text-sm text-stone-400">A new species featured every day</div>
            </div>
          </div>

          {/* Recent sightings */}
          <div>
            <h2 className="text-lg font-bold text-stone-700 mb-3">🔭 Recent Sightings</h2>
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              {recentSightings?.map((s: any, i: number) => (
                <div key={s.sighting_id} className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
                  <div>
                    <div className="font-semibold text-stone-800">{s.common_name}</div>
                    <div className="text-sm text-stone-400 italic">{s.scientific_name}</div>
                  </div>
                  <div className="text-right text-sm text-stone-500">
                    <div>{s.sighting_date}</div>
                    <div>{s.province_name}{s.country_name ? `, ${s.country_name}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 text-center py-6 text-sm mt-8">
        <p>🦢 Wildgoosechase — Personal Wildlife Tracker</p>
        <p className="mt-1 text-green-400">Built with Next.js & Supabase</p>
      </footer>

    </main>
  )
}
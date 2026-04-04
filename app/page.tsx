import { supabase } from '../lib/supabase'
import Map from './components/Map'

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

  // Fetch recent sightings via RPC
  const { data: recentSightings } = await supabase
    .rpc('wcg_web_get_recent_sightings')

  return (
    <main className="min-h-screen bg-stone-50">

      {/* Header */}
      <header className="bg-green-800 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦢</span>
          <span className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Wildgoosechase
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#" className="hover:text-green-300 transition-colors">Species</a>
          <a href="#" className="hover:text-green-300 transition-colors">Trips</a>
          <a href="#" className="hover:text-green-300 transition-colors">Travels</a>
          <a href="#" className="hover:text-green-300 transition-colors">Gallery</a>
          <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full text-sm font-semibold transition-colors">
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero strip */}
      <div className="bg-green-700 text-white py-3 px-6 text-center text-sm tracking-widest uppercase font-medium">
        Tracking wildlife across the world — one sighting at a time 🌍
      </div>

      {/* Stats strip */}
      <section className="bg-white border-b border-stone-200 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <div className="text-4xl font-bold text-green-700">{Number(totalSightings).toLocaleString()}</div>
            <div className="text-stone-500 text-sm mt-1 uppercase tracking-wide">Total Sightings</div>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-green-700">{Number(uniqueSpecies).toLocaleString()}</div>
            <div className="text-stone-500 text-sm mt-1 uppercase tracking-wide">Species Recorded</div>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-green-700">{Number(uniqueCountries)}</div>
            <div className="text-stone-500 text-sm mt-1 uppercase tracking-wide">Countries Visited</div>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-green-700">{Number(uniqueYears)}</div>
            <div className="text-stone-500 text-sm mt-1 uppercase tracking-wide">Years of Data</div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-stone-700 mb-4">🗺️ Sighting Locations</h2>
        <Map points={mapSightings || []} />
      </section>

      {/* Recent sightings */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-stone-700 mb-4">🔭 Recent Sightings</h2>
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
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 text-center py-6 text-sm mt-8">
        <p>🦢 Wildgoosechase — Personal Wildlife Tracker</p>
        <p className="mt-1 text-green-400">Built with Next.js & Supabase</p>
      </footer>

    </main>
  )
}
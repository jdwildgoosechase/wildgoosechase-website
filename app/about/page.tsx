import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#d4e8d4' }}>

     {/* Hero */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src="/about-hero.jpg"
          alt="About Wildgoosechase"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Header overlaid on image */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🦢</span>
            <span className="text-2xl font-bold tracking-wide text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Wildgoosechase
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
            <Link href="/about" className="hover:text-green-300 transition-colors">About</Link>
            <Link href="/gallery" className="hover:text-green-300 transition-colors">Gallery</Link>
            <Link href="/help" className="hover:text-green-300 transition-colors">Help</Link>
            <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full text-sm font-semibold transition-colors text-white">
              Sign In
            </button>
          </nav>
        </div>

        {/* Hero text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <h1 className="text-4xl font-bold mb-3 drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
            About Wildgoosechase
          </h1>
          <p className="text-green-200 text-lg max-w-2xl drop-shadow leading-relaxed">
            A personal wildlife tracking app built for adventurers, nature lovers, and casual wildlife enthusiasts alike.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">

        {/* What is it */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            🌿 What is Wildgoosechase?
          </h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            Wildgoosechase is a free Android app for recording and exploring your wildlife sightings. Whether you spot a bird on your morning walk, a reptile on a game drive, or a mammal on a hiking trail — Wildgoosechase helps you capture the moment and build a personal record of your encounters with the wild.
          </p>
          <p className="text-stone-600 leading-relaxed">
            It's not just for serious birders or scientists. It's for anyone who loves nature and wants to remember what they've seen, where they saw it, and when.
          </p>
        </div>

        {/* What can you do */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            📋 What can you do with it?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { emoji: "📍", title: "Record sightings", desc: "Log every wildlife encounter with GPS location, date, time and photos" },
              { emoji: "🗺️", title: "Map your sightings", desc: "See every sighting plotted on an interactive map" },
              { emoji: "✈️", title: "Track your trips", desc: "Group sightings into trips and build a record of every adventure" },
              { emoji: "📋", title: "Build checklists", desc: "Create field checklists for each session in the wild" },
              { emoji: "📸", title: "Add photos", desc: "Attach your own wildlife photos to every sighting" },
              { emoji: "🌍", title: "Track your travels", desc: "See which countries and regions you have recorded wildlife in" },
              { emoji: "🔭", title: "Build your life list", desc: "Keep a running list of every species you have ever recorded" },
              { emoji: "📌", title: "Save hotspots", desc: "Mark your favourite wildlife locations with custom boundaries" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-green-50">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <div className="font-semibold text-stone-800 text-sm">{item.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            🦅 Our Philosophy
          </h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            Wildlife tracking tools have traditionally been built for scientists and serious hobbyists — full of jargon, complex workflows, and intimidating data entry. Wildgoosechase is different.
          </p>
          <p className="text-stone-600 leading-relaxed mb-4">
            We believe that everyone who spends time in nature deserves a simple, beautiful way to record what they see. You don't need to know the Latin name of every bird to enjoy keeping track of your wildlife encounters. You just need curiosity and a love of the outdoors.
          </p>
          <p className="text-stone-600 leading-relaxed">
            Wildgoosechase is built to be approachable and fun — while still being powerful enough for the serious naturalist who wants detailed records, trip statistics, and atlas integration.
          </p>
        </div>

        {/* Download CTA */}
        <div className="bg-green-800 rounded-2xl p-8 text-white text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Ready to start tracking?
          </h2>
          <p className="text-green-200 mb-6">
            Download Wildgoosechase for free on Android and start building your wildlife record today.
          </p>
          <a
            href="#"
            className="inline-block bg-white text-green-800 font-bold px-8 py-3 rounded-full hover:bg-green-100 transition-colors"
          >
            📱 Download for Android
          </a>
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
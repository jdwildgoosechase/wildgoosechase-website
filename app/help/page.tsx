import NavBar from '../components/NavBar'
import Link from 'next/link'

// ── Screenshot placeholder ────────────────────────────────────────────────────

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full rounded-xl flex items-center justify-center text-sm my-4"
      style={{ backgroundColor: '#e8f0e8', border: '2px dashed #6abf69', height: '200px', color: '#4a7c59' }}
    >
      📸 Screenshot: {label}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl text-green-900 mt-10 mb-3 pb-2 border-b border-green-200"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-lg text-green-800 mt-6 mb-2 font-semibold"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {children}
    </h3>
  )
}

// ── Callout box ───────────────────────────────────────────────────────────────

function Callout({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 my-4 flex gap-3" style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <p className="text-green-900 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Hero ── */}
      <div className="relative w-full h-64 flex-shrink-0">
        <img
          src="/hero.jpg"
          alt="Wildlife hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" style={{ pointerEvents: 'none' }} />
        <div className="absolute inset-0 flex flex-col">
          <NavBar transparent={true} />
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <h1 className="text-white text-4xl md:text-5xl drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                Help & Guide
              </h1>
              <p className="text-green-200 text-sm mt-2 drop-shadow">
                Everything you need to know about Wildgoosechase
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">

        {/* ── Quick links ── */}
        <div className="rounded-2xl p-6 mb-8 bg-white shadow-sm">
          <h2 className="text-green-900 font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Jump to a section
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Website',        href: '#website',        emoji: '🌐' },
              { label: 'Dashboard',      href: '#dashboard',      emoji: '📊' },
              { label: 'Importing Data', href: '#importing',      emoji: '📥' },
              { label: 'Public Profile', href: '#public-profile', emoji: '🌍' },
              { label: 'Android App',    href: '#app',            emoji: '📱' },
              { label: 'Sightings',      href: '#sightings',      emoji: '🔭' },
              { label: 'Trips',          href: '#trips',          emoji: '🧳' },
              { label: 'Syncing',        href: '#syncing',        emoji: '🔄' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-800 hover:bg-green-50 transition-colors border border-green-200"
              >
                <span>{link.emoji}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            WEBSITE SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="website">
          <div className="flex items-center gap-3 mt-8 mb-2">
            <span className="text-3xl">🌐</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>The Website</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            The Wildgoosechase website is a companion to the Android app. It gives you a rich visual view of all your wildlife sighting data — maps, stats, species lists and more. The website is read-only: all data entry is done through the app, and the website displays it.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>What is the homepage?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The homepage gives a public overview of the Wildgoosechase project. It shows headline stats (total sightings, species recorded, countries visited and years of data), an interactive map of all sighting locations, a sliding photo gallery, and a feed of recent sightings. Anyone can visit the homepage without logging in.
            </p>
            <ScreenshotPlaceholder label="Homepage with map and stats strip" />

            <SubHeading>Do I need to create an account on the website?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              No. Accounts are created exclusively through the Android app. Once you have an account in the app, you can sign in to the website using the same email address and password. The website and app share the same database — your data is always in sync.
            </p>

            <SubHeading>What can I do on the website that I cannot do in the app?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The website offers a larger screen experience with richer visualisations — interactive maps, charts, and detailed species views that are better suited to a desktop. You can also import historical sightings from eBird or CSV files via the website, which is not available in the app.
            </p>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            DASHBOARD SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="dashboard">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">📊</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Your Dashboard</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            The dashboard is your personal private view of all your sighting data. Sign in to access it.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>How do I sign in?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Click <strong>Sign In</strong> in the navigation bar at the top of any page. Enter the same email address and password you use in the Wildgoosechase Android app. If you have forgotten your password, use the <strong>Forgot your password?</strong> link on the sign in page to receive a reset email.
            </p>
            <ScreenshotPlaceholder label="Sign in page" />

            <SubHeading>What does the stats strip show?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The six cards at the top of your dashboard show your total sightings, unique species recorded, countries visited, number of trips, hotspots created, and years of data. These update automatically as you add new sightings in the app.
            </p>

            <SubHeading>What is the Latest Lifer card?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A lifer is the first time you have ever recorded a particular species. The Latest Lifer card shows the most recent species you saw for the first time — the species, date, and location of that first sighting.
            </p>

            <SubHeading>What is the Lifer On This Day card?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The Lifer On This Day card highlights a species you recorded for the very first time on today's date in a previous year. For example if you saw your first African Fish Eagle on this date in 2019, that sighting is celebrated on the card. It is a meaningful reminder of landmark sightings from your birding history. The card only appears if you have a lifer that falls on today's date in a previous year — if not, it simply does not show.
            </p>
            <ScreenshotPlaceholder label="Dashboard overview with lifer and on this day cards" />

            <SubHeading>What are the tabs on the dashboard?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The dashboard is organised into tabs. The <strong>Overview</strong> tab shows your map and recent sightings. The <strong>Trips</strong>, <strong>Hotspots</strong>, <strong>Species</strong>, <strong>Travels</strong> and <strong>Gallery</strong> tabs are being built out progressively and will show detailed views of each area of your data. The <strong>Import</strong> tab lets you import historical sightings. The <strong>Settings</strong> tab controls your profile visibility.
            </p>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            IMPORTING SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="importing">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">📥</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Importing Sightings</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            If you have historical sightings recorded in eBird or a spreadsheet, you can import them directly into Wildgoosechase via the website.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>How do I import from eBird?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              First export your data from eBird by going to <strong>ebird.org → My eBird → Download My Data</strong> and requesting a download. eBird will email you a link to download a zip file containing a file called <strong>MyEBirdData.csv</strong>. On your Wildgoosechase dashboard, go to the <strong>Import</strong> tab, select <strong>eBird Export</strong> format, and upload that CSV file. The importer will automatically map all columns and match species from your eBird list to the Wildgoosechase species database.
            </p>
            <ScreenshotPlaceholder label="Import tab — eBird format selected" />

            <SubHeading>How do I import from a generic CSV or spreadsheet?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              On the Import tab select <strong>Generic CSV</strong> format and upload your file. You will be shown a column mapping screen where you can tell the importer which column in your file corresponds to which field — species name, date, latitude, longitude and so on. The importer will try to auto-detect common column names. You can also specify the date format used in your file.
            </p>
            <ScreenshotPlaceholder label="Column mapping screen for generic CSV" />

            <SubHeading>How are species matched during import?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The importer matches species using both scientific name and common name. Exact matches are accepted automatically. For close but not exact matches (for example slightly different common names between regions) the importer shows you the top candidate matches and lets you confirm the correct one. Rows where no confident match is found are flagged for your review before importing.
            </p>

            <Callout emoji="⚠️">
              The maximum import size is 2,000 rows per file. For larger historical datasets, split your CSV by year in Excel or Google Sheets and import each year separately.
            </Callout>

            <SubHeading>Where do imported sightings appear?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Imported sightings are stored in your Wildgoosechase database alongside your app sightings and will appear in your stats, map and species lists immediately. The next time you open the Android app and sync, the imported sightings will download to your device automatically.
            </p>

            <SubHeading>Can I undo an import?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Not yet via the website interface. Imported sightings can be identified in the database because they have negative sighting IDs. If you need to remove an import, please contact support.
            </p>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PUBLIC PROFILE SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="public-profile">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">🌍</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Public Profile</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            You can optionally make your sighting data publicly visible so friends and fellow wildlife enthusiasts can follow your adventures.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>How do I make my profile public?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Sign in to your dashboard and go to the <strong>Settings</strong> tab. Toggle the <strong>Public Profile</strong> switch to on. Your profile URL will appear — you can copy and share this link with anyone.
            </p>
            <ScreenshotPlaceholder label="Settings tab with public profile toggle" />

            <SubHeading>What can people see on my public profile?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Visitors to your public profile can see your stats strip, sightings map, recent sightings, latest lifer, and all the dashboard tabs — the same view you see on your own dashboard. Your Import and Settings tabs are never visible to public visitors.
            </p>

            <SubHeading>Can I make my profile private again?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Yes — go back to the Settings tab and toggle Public Profile off. Your profile URL will immediately show a private message to anyone who visits it.
            </p>

            <Callout emoji="🔒">
              Your Import and Settings tabs are always private — they are only visible to you when you are signed in, regardless of your public profile setting.
            </Callout>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            APP SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="app">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">📱</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>The Android App</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            The Wildgoosechase Android app is the primary way to record sightings in the field. It works fully offline — your data is saved locally and synced to the server when you have a connection.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>How do I get the app?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Wildgoosechase is available for Android devices. Search for <strong>Wildgoosechase</strong> on the Google Play Store and install it for free. When you first open the app you will be prompted to create an account and select your region to download the relevant species list.
            </p>

            <Callout emoji="💡">
              Your account is created in the app — not on the website. Once your app account is set up you can use the same login details on the website.
            </Callout>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SIGHTINGS SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="sightings">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">🔭</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Recording Sightings</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            Sightings are the core of Wildgoosechase. Every wildlife encounter you record builds your personal database of observations over time.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>How do I add a sighting?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Tap the green <strong>Add Sighting</strong> button (the floating action button at the bottom right of the home screen). Search for the species by common or scientific name, confirm the GPS location has been captured, add any additional details such as count, gender, age or breeding status, and save. The sighting is saved instantly to your local device and will sync to the server when you next upload.
            </p>
            <ScreenshotPlaceholder label="Add Sighting screen in the app" />

            <SubHeading>What is a retrospective sighting?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A retrospective sighting is a historical sighting you are recording after the fact — for example from old field notes or a life list you kept before using the app. Tap <strong>Retro Sightings</strong> from the home menu to add these. You can manually enter the date and location rather than using the current GPS position.
            </p>

            <SubHeading>What is an uncertain sighting?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              If you are not sure of a species identification in the field, you can save the sighting as uncertain. It is stored separately and shown with a badge on the home screen. You can come back later, review your photos or notes, and resolve it to a confirmed species identification. Uncertain sightings do not count towards your life list until resolved.
            </p>

            <SubHeading>What does heard only mean?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              When recording a sighting you can mark it as <strong>heard only</strong> if you identified the species by its call but did not see it. This is particularly common for birds. You can configure in Settings whether heard-only sightings count towards your lifer list.
            </p>
            <ScreenshotPlaceholder label="Sighting detail view showing heard only option" />

            <SubHeading>What is a lifer?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A lifer is the very first time you have ever recorded a particular species. Wildgoosechase automatically tracks your lifers — the first sighting of each species in your database. When you record a species for the first time the app can display a lifer alert if that setting is enabled.
            </p>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            TRIPS SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="trips">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">🧳</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Trips, Checklists & Hotspots</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            Trips, checklists and hotspots help you organise your sightings by context — where you went, when you went, and what you saw there.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>What is a trip?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A trip is a named outing or holiday with a start and end date. For example <em>Kruger Park August 2024</em>. When a trip is active, all sightings you record are automatically linked to it. You can view the full species list, map and stats for any trip. Trips are started and ended from the <strong>My Trips</strong> section of the home menu.
            </p>
            <ScreenshotPlaceholder label="My Trips screen showing active trip" />

            <SubHeading>What is a checklist?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A checklist represents a single field session — for example a two hour morning walk. It has a start and end time and all sightings recorded during that session are linked to it. Checklists sit within trips and are similar in concept to an eBird checklist. They are managed from the <strong>My Checklists</strong> section.
            </p>

            <SubHeading>What is a hotspot?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              A hotspot is a named birding or wildlife location you define yourself by drawing a boundary polygon on a map — for example your local nature reserve or a dam you visit regularly. When you record a sighting inside a hotspot boundary it is automatically linked to that hotspot. You can view all species ever recorded at each hotspot. Hotspots are created and managed from <strong>My Hotspots</strong>.
            </p>
            <ScreenshotPlaceholder label="Hotspot detail page showing species list and map" />

            <SubHeading>What are pins?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              Pins are simple saved GPS locations — points of interest that do not need a full hotspot boundary. Use them to mark a specific tree where an owl roosts, a hide at a reserve, or any location you want to remember and return to. Tap the <strong>Save Location</strong> button on the home screen to drop a pin at your current position.
            </p>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SYNCING SECTION
        ════════════════════════════════════════════════════════ */}
        <div id="syncing">
          <div className="flex items-center gap-3 mt-12 mb-2">
            <span className="text-3xl">🔄</span>
            <h2 className="text-3xl text-green-900" style={{ fontFamily: 'Georgia, serif' }}>Syncing & Offline Use</h2>
          </div>
          <p className="text-green-700 text-sm mb-6 border-b border-green-300 pb-4">
            Wildgoosechase is designed to work fully offline in the field. Your data is always saved locally first and synced to the server when you choose.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <SubHeading>Do I need an internet connection to record sightings?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              No. All sightings are saved instantly to your device regardless of connectivity. You can record sightings deep in the bush with no signal and they will be safely stored on your phone until you sync.
            </p>

            <SubHeading>How do I upload my sightings to the server?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              The home screen shows an upload icon in the top bar with a red badge showing the number of unsynced items. Tap this icon to upload all pending sightings, trips, checklists and hotspots to the server. You can configure in Settings whether uploads are allowed on mobile data or WiFi only.
            </p>
            <ScreenshotPlaceholder label="Home screen showing upload badge" />

            <SubHeading>What happens if I reinstall the app?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              When you reinstall and log in, the app downloads all your sightings and data from the server back to your device. Make sure you have uploaded all pending sightings before uninstalling to avoid losing any locally stored data that has not yet been synced.
            </p>

            <Callout emoji="⚠️">
              Always upload your pending sightings before uninstalling or switching to a new device. Any sightings not yet uploaded to the server cannot be recovered.
            </Callout>

            <SubHeading>How do I install a region species list?</SubHeading>
            <p className="text-stone-600 text-sm leading-relaxed">
              When you first install the app you are prompted to select and download a regional species list — for example Southern Africa. This downloads all species names for your region to your device so you can search for species offline. If you travel to a new region you can download additional species lists from <strong>Settings → Install Region</strong>.
            </p>

          </div>
        </div>

        {/* ── Contact ── */}
        <div className="rounded-2xl p-6 mt-10 mb-4 text-center bg-white shadow-sm">
          <div className="text-4xl mb-3">🦢</div>
          <h2 className="text-green-900 text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>Still need help?</h2>
          <p className="text-stone-500 text-sm mb-4">
            If you cannot find the answer you are looking for, get in touch and we will do our best to help.
          </p>
            <a
            href="mailto:support@wildgoosechase.app"
            className="inline-block bg-green-800 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors"
          >
            Contact Support
          </a>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4 mt-4">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
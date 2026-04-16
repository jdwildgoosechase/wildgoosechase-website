'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

type Context = 'sighting' | 'hotspot' | 'trip' | 'checklist' | 'none'

interface Species {
  species_id:      number
  common_name:     string
  scientific_name: string
  sighting_count:  number
}

interface Sighting {
  sighting_id:     number
  sighting_date:   string
  sighting_time:   string | null
  common_name:     string
  scientific_name: string
  country_name:    string | null
  province_name:   string | null
  hotspot_name:    string | null
  trip_name:       string | null
  checklist_name:  string | null
  num_animals:     number
  comments:        string | null
  country_id:      number
  province_id:     number
  hotspot_id:      number
  trip_id:         number
  checklist_id:    number
  pentad_id:       string | null
  latitude:        number | null
  longitude:       number | null
}

interface Hotspot {
  hotspot_id:   number
  hotspot_name: string
}

interface Trip {
  trip_id:   number
  trip_name: string
}

interface Checklist {
  checklist_id:   number
  checklist_name: string
}

interface UploadFile {
  file:    File
  preview: string
  comment: string
  status:  'pending' | 'uploading' | 'done' | 'error'
  error:   string | null
}

interface PhotoUploadModalProps {
  wcgUserId: number
  onClose:   () => void
  onSuccess: () => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// ── Image resize helper ───────────────────────────────────────────────────────

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) { height = height * maxSize / width; width = maxSize }
      } else {
        if (height > maxSize) { width = width * maxSize / height; height = maxSize }
      }
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg', 0.85
      )
    }
    img.onerror = reject
    img.src = url
  })
}

function generateFileName(file: File): string {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return `${Date.now()}.${ext}`
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`text-xs ${i === current ? 'text-white' : i < current ? 'text-green-600' : 'text-green-800'}`}>
            {i < current ? '✓' : `${i + 1}.`} {label}
          </span>
          {i < steps.length - 1 && <span className="text-green-800 text-xs">›</span>}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PhotoUploadModal({ wcgUserId, onClose, onSuccess }: PhotoUploadModalProps) {

  // ── Step management ───────────────────────────────────────────────────────
  type Step = 'context' | 'species' | 'sighting' | 'link' | 'photos'
  const [step, setStep] = useState<Step>('context')
  const [context, setContext] = useState<Context | null>(null)

  // ── Species / sighting state ──────────────────────────────────────────────
  const [speciesQuery,    setSpeciesQuery]    = useState('')
  const [speciesList,     setSpeciesList]     = useState<Species[]>([])
  const [speciesLoading,  setSpeciesLoading]  = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null)
  const [sightings,       setSightings]       = useState<Sighting[]>([])
  const [sightingsLoading, setSightingsLoading] = useState(false)
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null)

  // ── Hotspot / trip / checklist state ──────────────────────────────────────
  const [hotspots,         setHotspots]         = useState<Hotspot[]>([])
  const [trips,            setTrips]            = useState<Trip[]>([])
  const [checklists,       setChecklists]       = useState<Checklist[]>([])
  const [selectedHotspot,  setSelectedHotspot]  = useState<Hotspot | null>(null)
  const [selectedTrip,     setSelectedTrip]     = useState<Trip | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [linkLoading,      setLinkLoading]      = useState(false)

  // ── Upload state ──────────────────────────────────────────────────────────
  const [files,         setFiles]         = useState<UploadFile[]>([])
  const [uploading,     setUploading]     = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load hotspots / trips / checklists when needed ────────────────────────
  useEffect(() => {
    if (context !== 'hotspot' && context !== 'trip' && context !== 'checklist') return
    setLinkLoading(true)

    async function loadLinkData() {
      if (context === 'hotspot') {
        const { data } = await supabase.rpc('wcg_web_get_user_hotspots', { p_user_id: wcgUserId })
        if (data) setHotspots(data)
      } else if (context === 'trip') {
        const { data } = await supabase.rpc('wcg_web_get_user_trips', { p_user_id: wcgUserId })
        if (data) setTrips(data)
      } else if (context === 'checklist') {
        const { data } = await supabase
          .from('fld_my_checklists')
          .select('checklist_id:server_id, checklist_name')
          .eq('user_id', wcgUserId)
          .order('checklist_start_date', { ascending: false })
          .limit(100)
        if (data) setChecklists(data as any)
      }
      setLinkLoading(false)
    }

    loadLinkData()
  }, [context, wcgUserId])

  // ── Species search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (speciesQuery.length < 2) { setSpeciesList([]); return }
    const timer = setTimeout(async () => {
      setSpeciesLoading(true)
      const { data } = await supabase.rpc('wcg_web_search_user_species', {
        p_user_id: wcgUserId,
        p_search:  speciesQuery,
      })
      if (data) setSpeciesList(data)
      setSpeciesLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [speciesQuery, wcgUserId])

  // ── Select species → load sightings ───────────────────────────────────────
  async function selectSpecies(species: Species) {
    setSelectedSpecies(species)
    setStep('sighting')
    setSightingsLoading(true)
    const { data } = await supabase.rpc('wcg_web_get_species_sightings', {
      p_user_id:    wcgUserId,
      p_species_id: species.species_id,
    })
    if (data) setSightings(data)
    setSightingsLoading(false)
  }

  // ── Context selection ─────────────────────────────────────────────────────
  function chooseContext(c: Context) {
    setContext(c)
    if (c === 'sighting') setStep('species')
    else if (c === 'none') setStep('photos')
    else setStep('link')
  }

  // ── File handling ─────────────────────────────────────────────────────────
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const newFiles: UploadFile[] = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      comment: '',
      status:  'pending',
      error:   null,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  function removeFile(idx: number) {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Build storage path based on context ──────────────────────────────────
  function buildPaths(fileName: string): { fullPath: string; thumbPath: string } {
    let folder = 'general'
    if (context === 'sighting' && selectedSighting) {
      folder = `sightings/${selectedSighting.sighting_id}`
    } else if (context === 'hotspot' && selectedHotspot) {
      folder = `hotspots/${selectedHotspot.hotspot_id}`
    } else if (context === 'trip' && selectedTrip) {
      folder = `trips/${selectedTrip.trip_id}`
    } else if (context === 'checklist' && selectedChecklist) {
      folder = `checklists/${selectedChecklist.checklist_id}`
    }
    return {
      fullPath:  `${folder}/${fileName}`,
      thumbPath: `${folder}/thumbs_${fileName}`,
    }
  }

  // ── Build insert payload based on context ─────────────────────────────────
  function buildInsertPayload(fullUrl: string, thumbUrl: string, comment: string) {
    const base = {
      p_user_id:         wcgUserId,
      p_file_path:       fullUrl,
      p_thumbnail_path:  thumbUrl,
      p_comment:         comment || null,
      p_sighting_id:     null as any,
      p_species_id:      null as any,
      p_common_name:     null as any,
      p_scientific_name: null as any,
      p_sighting_date:   null as any,
      p_country_id:      null as any,
      p_country_name:    null as any,
      p_province_id:     null as any,
      p_province_name:   null as any,
      p_hotspot_id:      null as any,
      p_hotspot_name:    null as any,
      p_trip_id:         null as any,
      p_trip_name:       null as any,
      p_checklist_id:    null as any,
      p_checklist_name:  null as any,
      p_pentad_id:       null as any,
    }

    if (context === 'sighting' && selectedSighting && selectedSpecies) {
      return {
        ...base,
        p_sighting_id:     selectedSighting.sighting_id,
        p_species_id:      selectedSpecies.species_id,
        p_common_name:     selectedSpecies.common_name,
        p_scientific_name: selectedSpecies.scientific_name,
        p_sighting_date:   selectedSighting.sighting_date,
        p_country_id:      selectedSighting.country_id,
        p_country_name:    selectedSighting.country_name,
        p_province_id:     selectedSighting.province_id,
        p_province_name:   selectedSighting.province_name,
        p_hotspot_id:      selectedSighting.hotspot_id,
        p_hotspot_name:    selectedSighting.hotspot_name,
        p_trip_id:         selectedSighting.trip_id,
        p_trip_name:       selectedSighting.trip_name,
        p_checklist_id:    selectedSighting.checklist_id,
        p_checklist_name:  selectedSighting.checklist_name,
        p_pentad_id:       selectedSighting.pentad_id,
      }
    }

    if (context === 'hotspot' && selectedHotspot) {
      return { ...base, p_hotspot_id: selectedHotspot.hotspot_id, p_hotspot_name: selectedHotspot.hotspot_name }
    }

    if (context === 'trip' && selectedTrip) {
      return { ...base, p_trip_id: selectedTrip.trip_id, p_trip_name: selectedTrip.trip_name }
    }

    if (context === 'checklist' && selectedChecklist) {
      return { ...base, p_checklist_id: selectedChecklist.checklist_id, p_checklist_name: selectedChecklist.checklist_name }
    }

    return base
  }

  // ── Run upload ────────────────────────────────────────────────────────────
  async function runUpload() {
    if (files.length === 0) return
    setUploading(true)
    let uploaded = 0

    for (let i = 0; i < files.length; i++) {
      const uf = files[i]
      if (uf.status === 'done') continue
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))

      try {
        const fileName = generateFileName(uf.file)
        const { fullPath, thumbPath } = buildPaths(fileName)

        const fullBlob  = await resizeImage(uf.file, 1600)
        const thumbBlob = await resizeImage(uf.file, 300)

        const { error: e1 } = await supabase.storage.from('photos').upload(fullPath, fullBlob, { contentType: 'image/jpeg', upsert: false })
        if (e1) throw new Error(e1.message)

        const { error: e2 } = await supabase.storage.from('thumbs').upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: false })
        if (e2) throw new Error(e2.message)

        const fullUrl  = `${SUPABASE_URL}/storage/v1/object/public/photos/${fullPath}`
        const thumbUrl = `${SUPABASE_URL}/storage/v1/object/public/thumbs/${thumbPath}`

        const payload = buildInsertPayload(fullUrl, thumbUrl, uf.comment)
        const { error: e3 } = await supabase.rpc('wcg_web_insert_photo', payload)
        if (e3) throw new Error(e3.message)

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
        uploaded++
        setUploadedCount(uploaded)

      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f))
      }
    }

    setUploading(false)
    if (uploaded > 0) setTimeout(() => { onSuccess(); onClose() }, 1000)
  }

  // ── Step labels ───────────────────────────────────────────────────────────
  function getSteps(): string[] {
    if (context === 'sighting') return ['Context', 'Species', 'Sighting', 'Photos']
    if (context === 'hotspot' || context === 'trip' || context === 'checklist') return ['Context', 'Link', 'Photos']
    return ['Context', 'Photos']
  }

  function getCurrentStepIndex(): number {
    const steps = getSteps()
    if (step === 'context') return 0
    if (step === 'species') return 1
    if (step === 'sighting') return 2
    if (step === 'link') return 1
    if (step === 'photos') return steps.length - 1
    return 0
  }

  // ── Context summary for photos step ──────────────────────────────────────
  function contextSummary() {
    if (context === 'sighting' && selectedSighting && selectedSpecies) {
      return (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#2a3f2a' }}>
          <div>
            <p className="text-white text-sm font-medium">{selectedSpecies.common_name}</p>
            <p className="text-green-400 text-xs">
              {selectedSighting.sighting_date} · {[selectedSighting.hotspot_name, selectedSighting.province_name, selectedSighting.country_name].filter(Boolean).join(', ')}
            </p>
          </div>
          <button onClick={() => setStep('sighting')} className="text-green-500 text-xs hover:text-white transition-colors">Change</button>
        </div>
      )
    }
    if (context === 'hotspot' && selectedHotspot) {
      return (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#2a3f2a' }}>
          <p className="text-white text-sm font-medium">📍 {selectedHotspot.hotspot_name}</p>
          <button onClick={() => setStep('link')} className="text-green-500 text-xs hover:text-white transition-colors">Change</button>
        </div>
      )
    }
    if (context === 'trip' && selectedTrip) {
      return (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#2a3f2a' }}>
          <p className="text-white text-sm font-medium">🧳 {selectedTrip.trip_name}</p>
          <button onClick={() => setStep('link')} className="text-green-500 text-xs hover:text-white transition-colors">Change</button>
        </div>
      )
    }
    if (context === 'checklist' && selectedChecklist) {
      return (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#2a3f2a' }}>
          <p className="text-white text-sm font-medium">📋 {selectedChecklist.checklist_name}</p>
          <button onClick={() => setStep('link')} className="text-green-500 text-xs hover:text-white transition-colors">Change</button>
        </div>
      )
    }
    return (
      <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#2a3f2a' }}>
        <p className="text-yellow-400 text-xs">⚠️ No link — photos will have no metadata attached.</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: '#1a2e1a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-900 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Upload Photos</h2>
            <StepIndicator steps={getSteps()} current={getCurrentStepIndex()} />
          </div>
          <button onClick={onClose} className="text-green-400 hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── Step: Context ── */}
          {step === 'context' && (
            <div>
              <p className="text-green-400 text-sm mb-4">What would you like to link your photos to?</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'sighting',  icon: '🔭', label: 'A sighting',   desc: 'Link to a specific species sighting — inherits all location and trip details automatically' },
                  { id: 'hotspot',   icon: '📍', label: 'A hotspot',    desc: 'Scenic or general photos of one of your birding locations' },
                  { id: 'trip',      icon: '🧳', label: 'A trip',       desc: 'Photos from a specific trip that are not tied to a particular sighting' },
                  { id: 'checklist', icon: '📋', label: 'A checklist',  desc: 'Photos from a specific field session' },
                  { id: 'none',      icon: '📷', label: 'No link',      desc: 'Upload a standalone photo without linking it to any record' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => chooseContext(opt.id as Context)}
                    className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors flex items-start gap-3"
                    style={{ backgroundColor: '#2a3f2a' }}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{opt.label}</p>
                      <p className="text-green-500 text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Species search ── */}
          {step === 'species' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep('context')} className="text-green-500 hover:text-white text-xs transition-colors">← Back</button>
                <p className="text-green-400 text-sm">Search for the species you photographed:</p>
              </div>
              <input
                type="text"
                value={speciesQuery}
                onChange={e => setSpeciesQuery(e.target.value)}
                placeholder="Type species name…"
                autoFocus
                className="w-full rounded-lg px-4 py-3 text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                style={{ backgroundColor: '#2a3f2a' }}
              />
              {speciesLoading && <p className="text-green-500 text-xs mt-2">Searching…</p>}
              {speciesList.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {speciesList.map(s => (
                    <button
                      key={s.species_id}
                      onClick={() => selectSpecies(s)}
                      className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors"
                      style={{ backgroundColor: '#2a3f2a' }}
                    >
                      <p className="text-white text-sm font-medium">{s.common_name}</p>
                      <p className="text-green-500 text-xs italic">{s.scientific_name} · {s.sighting_count} sightings</p>
                    </button>
                  ))}
                </div>
              )}
              {speciesQuery.length >= 2 && !speciesLoading && speciesList.length === 0 && (
                <p className="text-green-600 text-sm mt-3">No species found matching "{speciesQuery}"</p>
              )}
            </div>
          )}

          {/* ── Step: Select sighting ── */}
          {step === 'sighting' && selectedSpecies && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep('species')} className="text-green-500 hover:text-white text-xs transition-colors">← Back</button>
                <p className="text-white text-sm font-medium">{selectedSpecies.common_name}</p>
                <p className="text-green-500 text-xs italic">{selectedSpecies.scientific_name}</p>
              </div>
              <p className="text-green-400 text-sm mb-3">Select the sighting to link your photos to:</p>
              {sightingsLoading ? (
                <p className="text-green-500 text-sm">Loading sightings…</p>
              ) : sightings.length === 0 ? (
                <p className="text-green-500 text-sm">No sightings found for this species.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sightings.map(s => (
                    <button
                      key={s.sighting_id}
                      onClick={() => { setSelectedSighting(s); setStep('photos') }}
                      className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors"
                      style={{ backgroundColor: '#2a3f2a' }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-medium">{s.sighting_date}</p>
                        {s.num_animals > 1 && <p className="text-green-500 text-xs">{s.num_animals} individuals</p>}
                      </div>
                      <p className="text-green-400 text-xs mt-0.5">
                        {[s.hotspot_name, s.province_name, s.country_name].filter(Boolean).join(', ')}
                      </p>
                      {s.trip_name && <p className="text-green-600 text-xs mt-0.5">🧳 {s.trip_name}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step: Link (hotspot / trip / checklist) ── */}
          {step === 'link' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep('context')} className="text-green-500 hover:text-white text-xs transition-colors">← Back</button>
                <p className="text-green-400 text-sm">
                  {context === 'hotspot'   ? 'Select a hotspot:'   : ''}
                  {context === 'trip'      ? 'Select a trip:'      : ''}
                  {context === 'checklist' ? 'Select a checklist:' : ''}
                </p>
              </div>
              {linkLoading ? (
                <p className="text-green-500 text-sm">Loading…</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {context === 'hotspot' && hotspots.map(h => (
                    <button
                      key={h.hotspot_id}
                      onClick={() => { setSelectedHotspot(h); setStep('photos') }}
                      className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors"
                      style={{ backgroundColor: '#2a3f2a' }}
                    >
                      <p className="text-white text-sm font-medium">📍 {h.hotspot_name}</p>
                    </button>
                  ))}
                  {context === 'trip' && trips.map(t => (
                    <button
                      key={t.trip_id}
                      onClick={() => { setSelectedTrip(t); setStep('photos') }}
                      className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors"
                      style={{ backgroundColor: '#2a3f2a' }}
                    >
                      <p className="text-white text-sm font-medium">🧳 {t.trip_name}</p>
                    </button>
                  ))}
                  {context === 'checklist' && checklists.map(c => (
                    <button
                      key={c.checklist_id}
                      onClick={() => { setSelectedChecklist(c); setStep('photos') }}
                      className="text-left px-4 py-3 rounded-xl hover:bg-green-800 transition-colors"
                      style={{ backgroundColor: '#2a3f2a' }}
                    >
                      <p className="text-white text-sm font-medium">📋 {c.checklist_name}</p>
                    </button>
                  ))}
                  {context === 'hotspot'   && hotspots.length   === 0 && <p className="text-green-500 text-sm">No hotspots found.</p>}
                  {context === 'trip'      && trips.length      === 0 && <p className="text-green-500 text-sm">No trips found.</p>}
                  {context === 'checklist' && checklists.length === 0 && <p className="text-green-500 text-sm">No checklists found.</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Step: Photos ── */}
          {step === 'photos' && (
            <div>
              {/* Context summary */}
              {contextSummary()}

              {/* File picker */}
              <label
                className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-green-700 cursor-pointer hover:border-green-500 transition-colors mb-4"
                style={{ backgroundColor: '#2a3f2a' }}
              >
                <span className="text-2xl mb-1">📷</span>
                <span className="text-green-300 text-sm">Click to select photos</span>
                <span className="text-green-600 text-xs mt-0.5">JPG, PNG · Multiple allowed</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>

              {/* File list */}
              {files.length > 0 && (
                <div className="flex flex-col gap-3">
                  {files.map((uf, i) => (
                    <div key={i} className="flex gap-3 rounded-xl p-3" style={{ backgroundColor: '#2a3f2a' }}>
                      <img src={uf.preview} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate mb-1">{uf.file.name}</p>
                        <input
                          type="text"
                          value={uf.comment}
                          onChange={e => setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, comment: e.target.value } : f))}
                          placeholder="Optional comment…"
                          className="w-full rounded-lg px-3 py-1.5 text-xs text-white border border-green-700 focus:outline-none focus:ring-1 focus:ring-green-600"
                          style={{ backgroundColor: '#1a2e1a' }}
                        />
                        {uf.status === 'uploading' && <p className="text-green-400 text-xs mt-1">Uploading…</p>}
                        {uf.status === 'done'      && <p className="text-green-400 text-xs mt-1">✅ Uploaded</p>}
                        {uf.status === 'error'     && <p className="text-red-400 text-xs mt-1">❌ {uf.error}</p>}
                      </div>
                      {uf.status === 'pending' && (
                        <button onClick={() => removeFile(i)} className="text-green-700 hover:text-red-400 text-lg flex-shrink-0 transition-colors">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        {step === 'photos' && files.length > 0 && (
          <div className="px-6 py-4 border-t border-green-900 flex-shrink-0 flex items-center justify-between">
            <p className="text-green-400 text-sm">
              {uploading
                ? `Uploading ${uploadedCount} of ${files.length}…`
                : `${files.length} photo${files.length > 1 ? 's' : ''} selected`
              }
            </p>
            <button
              onClick={runUpload}
              disabled={uploading || files.every(f => f.status === 'done')}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : `Upload ${files.length} photo${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
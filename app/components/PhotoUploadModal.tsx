'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface UploadFile {
  file:      File
  preview:   string
  comment:   string
  status:    'pending' | 'uploading' | 'done' | 'error'
  error:     string | null
}

interface PhotoUploadModalProps {
  wcgUserId: number
  onClose:   () => void
  onSuccess: () => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateFileName(file: File): string {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const ts   = Date.now()
  return `${ts}.${ext}`
}

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
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas failed')), 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = url
  })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PhotoUploadModal({ wcgUserId, onClose, onSuccess }: PhotoUploadModalProps) {
  const [step,           setStep]           = useState<'species' | 'sighting' | 'photos'>('species')
  const [speciesQuery,   setSpeciesQuery]   = useState('')
  const [speciesList,    setSpeciesList]    = useState<Species[]>([])
  const [speciesLoading, setSpeciesLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null)
  const [sightings,      setSightings]      = useState<Sighting[]>([])
  const [sightingsLoading, setSightingsLoading] = useState(false)
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null)
  const [files,          setFiles]          = useState<UploadFile[]>([])
  const [uploading,      setUploading]      = useState(false)
  const [uploadedCount,  setUploadedCount]  = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Search species ────────────────────────────────────────────────────────
  useEffect(() => {
    if (speciesQuery.length < 2) {
      setSpeciesList([])
      return
    }
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

  // ── Load sightings for selected species ───────────────────────────────────
  async function selectSpecies(species: Species) {
    setSelectedSpecies(species)
    setStep('sighting')
    setSightingsLoading(true)
    const { data } = await supabase.rpc('wcg_web_get_species_sightings', {
      p_user_id:   wcgUserId,
      p_species_id: species.species_id,
    })
    if (data) setSightings(data)
    setSightingsLoading(false)
  }

  // ── Select sighting ───────────────────────────────────────────────────────
  function selectSighting(sighting: Sighting) {
    setSelectedSighting(sighting)
    setStep('photos')
  }

  // ── Handle file selection ─────────────────────────────────────────────────
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

  // ── Upload ────────────────────────────────────────────────────────────────
  async function runUpload() {
    if (!selectedSighting || files.length === 0) return
    setUploading(true)
    let uploaded = 0

    for (let i = 0; i < files.length; i++) {
      const uf = files[i]
      if (uf.status === 'done') continue

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))

      try {
        const fileName  = generateFileName(uf.file)
        const sightingId = selectedSighting.sighting_id
        const fullPath  = `sightings/${sightingId}/${fileName}`
        const thumbPath = `sightings/${sightingId}/thumbs_${fileName}`

        // Resize full image (max 1600px)
        const fullBlob  = await resizeImage(uf.file, 1600)
        // Resize thumbnail (max 300px)
        const thumbBlob = await resizeImage(uf.file, 300)

        // Upload full image
        const { error: fullError } = await supabase.storage
          .from('photos')
          .upload(fullPath, fullBlob, { contentType: 'image/jpeg', upsert: false })
        if (fullError) throw new Error(fullError.message)

        // Upload thumbnail
        const { error: thumbError } = await supabase.storage
          .from('thumbs')
          .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: false })
        if (thumbError) throw new Error(thumbError.message)

        // Build public URLs
        const fullUrl  = `${SUPABASE_URL}/storage/v1/object/public/photos/${fullPath}`
        const thumbUrl = `${SUPABASE_URL}/storage/v1/object/public/thumbs/${thumbPath}`

        // Insert into fld_photos
        const { error: insertError } = await supabase.rpc('wcg_web_insert_photo', {
          p_user_id:        wcgUserId,
          p_file_path:      fullUrl,
          p_thumbnail_path: thumbUrl,
          p_sighting_id:    selectedSighting.sighting_id,
          p_species_id:     selectedSpecies!.species_id,
          p_common_name:    selectedSpecies!.common_name,
          p_scientific_name: selectedSpecies!.scientific_name,
          p_sighting_date:  selectedSighting.sighting_date,
          p_country_id:     selectedSighting.country_id,
          p_country_name:   selectedSighting.country_name,
          p_province_id:    selectedSighting.province_id,
          p_province_name:  selectedSighting.province_name,
          p_hotspot_id:     selectedSighting.hotspot_id,
          p_hotspot_name:   selectedSighting.hotspot_name,
          p_trip_id:        selectedSighting.trip_id,
          p_trip_name:      selectedSighting.trip_name,
          p_checklist_id:   selectedSighting.checklist_id,
          p_checklist_name: selectedSighting.checklist_name,
          p_pentad_id:      selectedSighting.pentad_id,
          p_comment:        uf.comment || null,
        })
        if (insertError) throw new Error(insertError.message)

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
        uploaded++
        setUploadedCount(uploaded)

      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f))
      }
    }

    setUploading(false)
    if (uploaded > 0) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: '#1a2e1a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-900 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
              Upload Photos
            </h2>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${step === 'species' ? 'text-white' : 'text-green-600'}`}>1. Species</span>
              <span className="text-green-800 text-xs">›</span>
              <span className={`text-xs ${step === 'sighting' ? 'text-white' : step === 'photos' ? 'text-green-600' : 'text-green-800'}`}>2. Sighting</span>
              <span className="text-green-800 text-xs">›</span>
              <span className={`text-xs ${step === 'photos' ? 'text-white' : 'text-green-800'}`}>3. Photos</span>
            </div>
          </div>
          <button onClick={onClose} className="text-green-400 hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── Step 1: Species search ── */}
          {step === 'species' && (
            <div>
              <p className="text-green-400 text-sm mb-4">Search for the species you photographed:</p>
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
              <p className="text-green-700 text-xs mt-4">
                Can't find the species? You can skip this step and upload without linking to a sighting.
              </p>
              <button
                onClick={() => setStep('photos')}
                className="text-green-500 text-xs hover:text-green-300 transition-colors mt-1"
              >
                Skip → upload without linking
              </button>
            </div>
          )}

          {/* ── Step 2: Select sighting ── */}
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
                      onClick={() => selectSighting(s)}
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

          {/* ── Step 3: Upload photos ── */}
          {step === 'photos' && (
            <div>
              {/* Selected sighting summary */}
              {selectedSighting && (
                <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#2a3f2a' }}>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedSpecies?.common_name}</p>
                    <p className="text-green-400 text-xs">{selectedSighting.sighting_date} · {[selectedSighting.hotspot_name, selectedSighting.province_name, selectedSighting.country_name].filter(Boolean).join(', ')}</p>
                  </div>
                  <button onClick={() => setStep('sighting')} className="text-green-500 text-xs hover:text-white transition-colors">Change</button>
                </div>
              )}

              {!selectedSighting && (
                <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#2a3f2a' }}>
                  <p className="text-yellow-400 text-xs">⚠️ Uploading without linking to a sighting — photos will have no species or location metadata.</p>
                </div>
              )}

              {/* File picker */}
              <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-green-700 cursor-pointer hover:border-green-500 transition-colors mb-4" style={{ backgroundColor: '#2a3f2a' }}>
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
                ? `Uploading ${uploadedCount} of ${files.filter(f => f.status !== 'done').length + uploadedCount}…`
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
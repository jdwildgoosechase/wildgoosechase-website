'use client'

import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportRow {
  rowIndex:       number
  commonName:     string
  scientificName: string
  date:           string
  time:           string
  latitude:       number | null
  longitude:      number | null
  count:          number
  comments:       string
  speciesId:      number | null
  speciesMatch:   string | null
  matchType:      string | null
  matchScore:     number | null
  countryId:      number | null
  provinceId:     number | null
  status:         'pending' | 'matched' | 'review' | 'skipped' | 'imported' | 'error'
  errorMessage:   string | null
  candidates:     SpeciesCandidate[]
}

interface SpeciesCandidate {
  species_id:      number
  common_name:     string
  scientific_name: string
  match_score:     number
  match_type:      string
}

interface ColumnMapping {
  scientificName: string
  commonName:     string
  date:           string
  time:           string
  latitude:       string
  longitude:      string
  count:          string
  comments:       string
}

interface ImportTabProps {
  wcgUserId: number
}

// ── Date parsing ──────────────────────────────────────────────────────────────

function parseDate(raw: string, format: string): string {
  if (!raw) return raw
  const clean = raw.trim()

  if (format === 'YYYY/MM/DD' || format === 'YYYY-MM-DD') {
    return clean.replace(/\//g, '-')
  }
  if (format === 'DD/MM/YYYY') {
    const [d, m, y] = clean.split('/')
    return `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`
  }
  if (format === 'MM/DD/YYYY') {
    const [m, d, y] = clean.split('/')
    return `${y}-${m?.padStart(2,'0')}-${d?.padStart(2,'0')}`
  }
  if (format === 'DD MMM YYYY') {
    const months: Record<string,string> = {
      jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
      jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
    }
    const parts = clean.split(' ')
    if (parts.length >= 3) {
      const d = parts[0].padStart(2,'0')
      const m = months[parts[1].toLowerCase().slice(0,3)] ?? '01'
      const y = parts[2]
      return `${y}-${m}-${d}`
    }
  }
  // Fallback — return as is with slashes replaced
  return clean.replace(/\//g, '-')
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(l => parseCSVLine(l))
  return { headers, rows }
}

// ── Auto-detect column mapping ────────────────────────────────────────────────

function autoDetect(headers: string[]): ColumnMapping {
  const h = headers.map(x => x.toLowerCase().trim())

const find = (candidates: string[], exclude: string[] = []) => {
    const idx = candidates.reduce((found, c) =>
      found >= 0 ? found : h.findIndex(x =>
        x.includes(c) && !exclude.some(ex => x.includes(ex))
      ), -1)
    return idx >= 0 ? headers[idx] : ''
  }

  return {
    scientificName: find(['scientific name', 'scientific_name', 'scientificname', 'sci name', 'sci_name']),
    commonName:     find(['common name', 'common_name', 'commonname', 'species name', 'species']),
    date:           find(['date', 'sighting_date', 'observation date', 'obs date']),
    time:           find(['time', 'sighting_time', 'observation time', 'obs time']),
    latitude:       find(['latitude', 'lat']),
    longitude:      find(['longitude', 'long', 'lon', 'lng']),
    count:          find(['count', 'number', 'quantity', 'num_animals', 'observation count', 'how many'], ['country']),
    comments:       find(['comment', 'comments', 'notes', 'observation details', 'details']),
  }
}

// ── eBird parser ──────────────────────────────────────────────────────────────

function parseEbirdRows(headers: string[], rows: string[][]): ImportRow[] {
  // eBird column indices
  const idx = (name: string) => headers.indexOf(name)
  const comIdx  = idx('Common Name')
  const sciIdx  = idx('Scientific Name')
  const cntIdx  = idx('Count')
  const latIdx  = idx('Latitude')
  const lngIdx  = idx('Longitude')
  const datIdx  = idx('Date')
  const timIdx  = idx('Time')
  const comtIdx = idx('Observation Details')

  return rows.map((cols, i) => {
    const lat = parseFloat(cols[latIdx] ?? '')
    const lng = parseFloat(cols[lngIdx] ?? '')
    return {
      rowIndex:       i + 1,
      commonName:     cols[comIdx]  ?? '',
      scientificName: cols[sciIdx]  ?? '',
      date:           (cols[datIdx] ?? '').replace(/\//g, '-'),
      time:           cols[timIdx]  ?? '',
      latitude:       isNaN(lat) ? null : lat,
      longitude:      isNaN(lng) ? null : lng,
      count:          parseInt(cols[cntIdx] ?? '') || 1,
      comments:       cols[comtIdx] ?? '',
      speciesId: null, speciesMatch: null, matchType: null, matchScore: null,
      countryId: null, provinceId: null,
      status: 'pending', errorMessage: null, candidates: [],
    }
  })
}

// ── Generic parser using column mapping ──────────────────────────────────────

function parseGenericRows(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping,
  dateFormat: string
): ImportRow[] {
  const idx = (col: string) => col ? headers.indexOf(col) : -1
  const sciIdx  = idx(mapping.scientificName)
  const comIdx  = idx(mapping.commonName)
  const datIdx  = idx(mapping.date)
  const timIdx  = idx(mapping.time)
  const latIdx  = idx(mapping.latitude)
  const lngIdx  = idx(mapping.longitude)
  const cntIdx  = idx(mapping.count)
  const comtIdx = idx(mapping.comments)

  return rows.map((cols, i) => {
    const lat = latIdx >= 0 ? parseFloat(cols[latIdx] ?? '') : NaN
    const lng = lngIdx >= 0 ? parseFloat(cols[lngIdx] ?? '') : NaN
    const rawDate = datIdx >= 0 ? cols[datIdx] ?? '' : ''
    return {
      rowIndex:       i + 1,
      commonName:     comIdx  >= 0 ? cols[comIdx]  ?? '' : '',
      scientificName: sciIdx  >= 0 ? cols[sciIdx]  ?? '' : '',
      date:           parseDate(rawDate, dateFormat),
      time:           timIdx  >= 0 ? cols[timIdx]  ?? '' : '',
      latitude:       isNaN(lat) ? null : lat,
      longitude:      isNaN(lng) ? null : lng,
      count:          cntIdx  >= 0 ? parseInt(cols[cntIdx] ?? '') || 1 : 1,
      comments:       comtIdx >= 0 ? cols[comtIdx] ?? '' : '',
      speciesId: null, speciesMatch: null, matchType: null, matchScore: null,
      countryId: null, provinceId: null,
      status: 'pending', errorMessage: null, candidates: [],
    }
  })
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ImportRow['status'] }) {
  const config = {
    pending:  { label: '⏳', color: 'text-gray-400' },
    matched:  { label: '✅', color: 'text-green-400' },
    review:   { label: '⚠️', color: 'text-yellow-400' },
    skipped:  { label: '⏭️', color: 'text-gray-500' },
    imported: { label: '✅', color: 'text-green-300' },
    error:    { label: '❌', color: 'text-red-400' },
  }
  const { label, color } = config[status]
  return <span className={`text-sm ${color}`}>{label}</span>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportTab({ wcgUserId }: ImportTabProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [format,   setFormat]   = useState<'ebird' | 'generic'>('ebird')
  const [stage,    setStage]    = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload')
  const [parsing,  setParsing]  = useState(false)
  const [rows,     setRows]     = useState<ImportRow[]>([])
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errorCount,    setErrorCount]    = useState(0)

  // Generic CSV state
  const [csvHeaders,   setCsvHeaders]   = useState<string[]>([])
  const [csvRawRows,   setCsvRawRows]   = useState<string[][]>([])
  const [mapping,      setMapping]      = useState<ColumnMapping>({ scientificName: '', commonName: '', date: '', time: '', latitude: '', longitude: '', count: '', comments: '' })
  const [dateFormat,   setDateFormat]   = useState('YYYY-MM-DD')

  // ── File upload ─────────────────────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)

    const text = await file.text()
    const { headers, rows: rawRows } = parseCSV(text)

    if (headers.length === 0 || rawRows.length === 0) {
      alert('No data found in the CSV file. Please check the format.')
      setParsing(false)
      return
    }

    const ROW_LIMIT = 2000

    if (rawRows.length > ROW_LIMIT) {
      alert(`This file contains ${rawRows.length.toLocaleString()} rows which exceeds the maximum of ${ROW_LIMIT.toLocaleString()} rows per import.\n\nPlease split your file into smaller batches (e.g. one year at a time) and import each separately.`)
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    if (format === 'ebird') {
      // eBird — go straight to matching
      const parsed = parseEbirdRows(headers, rawRows)
      setRows(parsed)
      setStage('preview')
      const updated = await matchAllSpecies(parsed)
      setRows(updated)
      setParsing(false)
    } else {
      // Generic — show mapping screen first
      setCsvHeaders(headers)
      setCsvRawRows(rawRows)
      setMapping(autoDetect(headers))
      setStage('mapping')
      setParsing(false)
    }
  }

  // ── Apply mapping and proceed to preview ────────────────────────────────────
async function applyMapping() {
    if (!mapping.scientificName && !mapping.commonName) {
      alert('Please map at least one of Scientific Name or Common Name.')
      return
    }
    if (!mapping.date) {
      alert('Please map the Date column.')
      return
    }
    setParsing(true)
    const parsed = parseGenericRows(csvHeaders, csvRawRows, mapping, dateFormat)

    // Validate dates and coordinates — flag bad rows before matching
    const validated = parsed.map(row => {

      // Date validation
      const cleanDate = row.date?.split(' ')[0] // strip any time component e.g. "0000-00-00 00:00:00"
      if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return { ...row, status: 'review' as const, errorMessage: `Invalid date format: "${row.date}" — check date format selection` }
      }
      const [yyyy, mm, dd] = cleanDate.split('-').map(Number)
      if (yyyy < 1900 || yyyy > new Date().getFullYear()) {
        return { ...row, status: 'review' as const, errorMessage: `Date year out of range: "${cleanDate}" (must be 1900 to present)` }
      }
      if (mm < 1 || mm > 12) {
        return { ...row, status: 'review' as const, errorMessage: `Invalid month in date: "${cleanDate}"` }
      }
      if (dd < 1 || dd > 31) {
        return { ...row, status: 'review' as const, errorMessage: `Invalid day in date: "${cleanDate}"` }
      }

      // Check if coordinate columns were mapped but contain non-numeric values
      if (mapping.latitude) {
        const rawLat = csvRawRows[row.rowIndex - 1]?.[csvHeaders.indexOf(mapping.latitude)]
        if (rawLat && rawLat.trim() !== '' && row.latitude === null) {
          return { ...row, status: 'review' as const, errorMessage: `Latitude is not a valid number: "${rawLat}"` }
        }
      }
      if (mapping.longitude) {
        const rawLng = csvRawRows[row.rowIndex - 1]?.[csvHeaders.indexOf(mapping.longitude)]
        if (rawLng && rawLng.trim() !== '' && row.longitude === null) {
          return { ...row, status: 'review' as const, errorMessage: `Longitude is not a valid number: "${rawLng}"` }
        }
      }
      

      // Coordinate validation
      if (row.latitude !== null && row.longitude !== null) {
        if (row.latitude < -90  || row.latitude > 90) {
          return { ...row, status: 'review' as const, errorMessage: `Latitude out of range: ${row.latitude} (must be -90 to 90)` }
        }
        if (row.longitude < -180 || row.longitude > 180) {
          return { ...row, status: 'review' as const, errorMessage: `Longitude out of range: ${row.longitude} (must be -180 to 180)` }
        }
        // Warn if coordinates look swapped — latitude shouldn't be > 90
        // but also check if they look like they might be swapped (lng in lat field)
        if (Math.abs(row.latitude) > Math.abs(row.longitude) && Math.abs(row.latitude) > 45) {
          return { ...row, status: 'review' as const, errorMessage: `Coordinates may be swapped — latitude ${row.latitude}, longitude ${row.longitude}. Check column mapping.` }
        }
      }
      return row
    })

    setRows(validated)
    setStage('preview')
    const updated = await matchAllSpecies(validated)
    setRows(updated)
    setParsing(false)
  }

  // ── Species matching ────────────────────────────────────────────────────────
  async function matchAllSpecies(parsed: ImportRow[]): Promise<ImportRow[]> {
    const updated = [...parsed]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      try {
        const { data } = await supabase.rpc('wcg_web_match_species', {
          p_scientific_name: row.scientificName || null,
          p_common_name:     row.commonName     || null,
        })
        if (!data || data.length === 0) {
          updated[i] = { ...row, status: 'review', candidates: [], errorMessage: 'No species match found' }
        } else {
          const top = data[0]
          if (top.match_score >= 0.8) {
            updated[i] = { ...row, status: 'matched', speciesId: top.species_id, speciesMatch: top.common_name, matchType: top.match_type, matchScore: top.match_score, candidates: data }
          } else {
            updated[i] = { ...row, status: 'review', candidates: data, speciesId: null }
          }
        }
      } catch {
        updated[i] = { ...row, status: 'review', candidates: [], errorMessage: 'Matching failed' }
      }
      // Update rows progressively so user sees live feedback
      setRows([...updated])
    }
    return updated
  }

  // ── Location resolution ─────────────────────────────────────────────────────
async function resolveLocation(row: ImportRow): Promise<{ countryId: number; provinceId: number; regionId: number }> {
    if (row.latitude !== null && row.longitude !== null) {
      try {
        const [provinceRes, regionRes] = await Promise.all([
          supabase.rpc('wcg_web_get_province_from_coords', {
            p_latitude:  row.latitude,
            p_longitude: row.longitude,
          }),
          supabase.rpc('wcg_web_get_region_from_coords', {
            p_latitude:  row.latitude,
            p_longitude: row.longitude,
          }),
        ])
        return {
          countryId:  provinceRes.data?.[0]?.country_id  ?? -1,
          provinceId: provinceRes.data?.[0]?.province_id ?? -1,
          regionId:   regionRes.data?.[0]?.region_id     ?? -1,
        }
      } catch {}
    }
    return { countryId: -1, provinceId: -1, regionId: -1 }
  }

  // ── Manual species selection ────────────────────────────────────────────────
  function selectSpecies(rowIndex: number, candidate: SpeciesCandidate) {
    setRows(prev => prev.map(r =>
      r.rowIndex === rowIndex
        ? { ...r, speciesId: candidate.species_id, speciesMatch: candidate.common_name, matchType: 'manual', matchScore: 1, status: 'matched' }
        : r
    ))
  }

  function skipRow(rowIndex: number) {
    setRows(prev => prev.map(r => r.rowIndex === rowIndex ? { ...r, status: 'skipped' } : r))
  }

  // ── Run import ──────────────────────────────────────────────────────────────
  async function runImport() {
    setStage('importing')
    const toImport = rows.filter(r => r.status === 'matched')
    let imported = 0
    let errors   = 0

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i]
      setProgress(Math.round(((i + 1) / toImport.length) * 100))
      try {
const { countryId, provinceId, regionId } = await resolveLocation(row)
        const { error } = await supabase.rpc('wcg_web_import_sighting', {
          p_user_id:     wcgUserId,
          p_species_id:  row.speciesId,
          p_date:        row.date,
          p_time:        row.time || '06:00',
          p_latitude:    row.latitude,
          p_longitude:   row.longitude,
          p_country_id:  countryId,
          p_province_id: provinceId,
          p_region_id:   regionId,
          p_num_animals: row.count,
          p_comments:    row.comments || null,
        })
        if (error) {
          errors++
          setRows(prev => prev.map(r => r.rowIndex === row.rowIndex ? { ...r, status: 'error', errorMessage: error.message } : r))
        } else {
          imported++
          setRows(prev => prev.map(r => r.rowIndex === row.rowIndex ? { ...r, status: 'imported' } : r))
        }
      } catch (err: any) {
        errors++
        setRows(prev => prev.map(r => r.rowIndex === row.rowIndex ? { ...r, status: 'error', errorMessage: err.message } : r))
      }
    }
    setImportedCount(imported)
    setErrorCount(errors)
    setStage('done')
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  function reset() {
    setRows([])
    setStage('upload')
    setProgress(0)
    setImportedCount(0)
    setErrorCount(0)
    setCsvHeaders([])
    setCsvRawRows([])
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const matchedCount = rows.filter(r => r.status === 'matched').length
  const reviewCount  = rows.filter(r => r.status === 'review').length
  const skippedCount = rows.filter(r => r.status === 'skipped').length

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Upload stage ── */}
      {stage === 'upload' && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#2a3f2a' }}>
          <h2 className="text-white font-semibold text-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Import Sightings
          </h2>
          <p className="text-green-400 text-sm mb-6">
            Import historical sightings from eBird or a generic CSV file. Imported sightings are stored with negative sighting IDs and will sync to your app automatically.
          </p>

          {/* Format selector */}
          <div className="flex gap-3 mb-6">
            {(['ebird', 'generic'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  format === f ? 'bg-green-700 text-white' : 'text-green-300 border border-green-700 hover:bg-green-900'
                }`}
              >
                {f === 'ebird' ? '🐦 eBird Export' : '📄 Generic CSV'}
              </button>
            ))}
          </div>

          {/* Format hint */}
          <div className="rounded-xl p-4 mb-6 text-sm text-green-300" style={{ backgroundColor: '#1a2e1a' }}>
            {format === 'ebird' ? (
              <>
                <p className="font-medium text-white mb-1">eBird format</p>
                <p>Export from <span className="text-green-400">ebird.org → My eBird → Download My Data</span> and upload the <span className="text-green-400">MyEBirdData.csv</span> file directly. No column mapping needed.</p>
                <p className="mt-1 text-yellow-400">Maximum 2,000 rows per import. For larger exports split by year in Excel before importing.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-white mb-1">Generic CSV format</p>
                <p>Upload any CSV file. You will be shown a column mapping screen where you can tell us which column contains which data. We will try to auto-detect common column names.</p>
                <p className="mt-1 text-yellow-400">Maximum 2,000 rows per import. For larger files split by year before importing.</p>
              </>
            )}
          </div>

          {/* File input */}
          {parsing ? (
            <div className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-green-700" style={{ backgroundColor: '#1a2e1a' }}>
              <div className="text-2xl mb-2 animate-spin">⚙️</div>
              <p className="text-green-300 text-sm">Reading file…</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-green-700 cursor-pointer hover:border-green-500 transition-colors" style={{ backgroundColor: '#1a2e1a' }}>
              <span className="text-3xl mb-2">📂</span>
              <span className="text-green-300 text-sm">Click to select CSV file</span>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      )}

      {/* ── Column mapping stage (generic only) ── */}
      {stage === 'mapping' && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#2a3f2a' }}>
          <h2 className="text-white font-semibold text-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Map Your Columns
          </h2>
          <p className="text-green-400 text-sm mb-4">
            We found {csvHeaders.length} columns in your file. Match them to our fields below. Auto-detected columns are pre-filled — check they look correct.
          </p>

          {/* Raw data preview */}
          <div className="rounded-xl p-3 mb-6 overflow-x-auto" style={{ backgroundColor: '#1a2e1a' }}>
            <p className="text-green-500 text-xs mb-2">First 3 rows of your file:</p>
            <table className="text-xs text-green-300 w-full">
              <thead>
                <tr>
                  {csvHeaders.map(h => (
                    <th key={h} className="text-left pr-4 pb-1 text-green-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRawRows.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="pr-4 pb-1 whitespace-nowrap">{cell || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Column mapping fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {([
              { key: 'scientificName', label: 'Scientific Name', required: false },
              { key: 'commonName',     label: 'Common Name',     required: false },
              { key: 'date',           label: 'Date',            required: true  },
              { key: 'time',           label: 'Time',            required: false },
              { key: 'latitude',       label: 'Latitude',        required: false },
              { key: 'longitude',      label: 'Longitude',       required: false },
              { key: 'count',          label: 'Count',           required: false },
              { key: 'comments',       label: 'Comments',        required: false },
            ] as { key: keyof ColumnMapping; label: string; required: boolean }[]).map(field => (
              <div key={field.key}>
                <label className="block text-xs text-green-400 mb-1">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <select
                  value={mapping[field.key]}
                  onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                  style={{ backgroundColor: '#1a2e1a' }}
                >
                  <option value="">— Not mapped —</option>
                  {csvHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Date format selector */}
          <div className="mb-6">
            <label className="block text-xs text-green-400 mb-1">Date format in your file <span className="text-red-400">*</span></label>
            <select
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value)}
              className="w-full md:w-64 rounded-lg px-3 py-2 text-sm text-white border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              style={{ backgroundColor: '#1a2e1a' }}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2025-09-13)</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD (e.g. 2025/09/13)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 13/09/2025)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/13/2025)</option>
              <option value="DD MMM YYYY">DD MMM YYYY (e.g. 13 Sep 2025)</option>
            </select>
          </div>

          {/* Lat/lng format note */}
          <div className="rounded-xl p-3 mb-6 text-xs text-green-400" style={{ backgroundColor: '#1a2e1a' }}>
            <span className="text-white font-medium">Coordinates:</span> Decimal degrees only are supported (e.g. -29.5974, 30.4352). Degrees/minutes/seconds format is not currently supported.
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm text-green-300 border border-green-700 hover:bg-green-900 transition-colors"
            >
              Start over
            </button>
            <button
              onClick={applyMapping}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Preview stage ── */}
      {stage === 'preview' && (
        <div className="flex flex-col gap-4">

          {/* Summary bar */}
          <div className="rounded-2xl p-4 flex flex-wrap items-center gap-6" style={{ backgroundColor: '#2a3f2a' }}>
            <div className="text-center">
              <p className="text-white text-xl font-bold">{rows.length}</p>
              <p className="text-green-400 text-xs">Total rows</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 text-xl font-bold">{matchedCount}</p>
              <p className="text-green-400 text-xs">Ready</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 text-xl font-bold">{reviewCount}</p>
              <p className="text-green-400 text-xs">Needs review</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xl font-bold">{skippedCount}</p>
              <p className="text-green-400 text-xs">Skipped</p>
            </div>
            {parsing && (
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-green-300 text-sm animate-pulse">⚙️ Matching species — please wait before selecting…</p>
                  <p className="text-green-500 text-xs">{rows.filter(r => r.status !== 'pending').length} of {rows.length} done</p>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: '#1a2e1a' }}>
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{ width: `${rows.length > 0 ? Math.round((rows.filter(r => r.status !== 'pending').length / rows.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={reset} className="px-4 py-2 rounded-lg text-sm text-green-300 border border-green-700 hover:bg-green-900 transition-colors">
                Start over
              </button>
              <button
                onClick={runImport}
                disabled={matchedCount === 0 || parsing}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {matchedCount} sightings
              </button>
            </div>
          </div>

          {/* Row list */}
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {rows.map(row => (
              <div key={row.rowIndex} className="rounded-xl px-4 py-3" style={{ backgroundColor: '#2a3f2a' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge status={row.status} />
                      <p className="text-white text-sm font-medium truncate">{row.commonName || row.scientificName}</p>
                    </div>
                    <p className="text-green-500 text-xs italic">{row.scientificName}</p>
                    <p className="text-green-400 text-xs mt-0.5">
                      {row.date} {row.time}
                      {row.latitude !== null && ` · ${row.latitude.toFixed(4)}, ${row.longitude?.toFixed(4)}`}
                    </p>
                    {row.status === 'matched' && (
                      <p className="text-green-300 text-xs mt-0.5">
                        Matched: <span className="text-white">{row.speciesMatch}</span>
                        <span className="text-green-600 ml-1">({row.matchType} · {Math.round((row.matchScore ?? 0) * 100)}%)</span>
                      </p>
                    )}
                    {row.errorMessage && (
                      <p className="text-red-400 text-xs mt-0.5">{row.errorMessage}</p>
                    )}
                  </div>

                  {/* Review controls */}
                  {row.status === 'review' && (
                    <div className="flex-shrink-0 flex flex-col gap-1 min-w-48">
                      {row.candidates.length > 0 ? (
                        <>
                          <p className="text-yellow-400 text-xs mb-1">
                            {parsing ? '⏳ Wait for matching to complete…' : 'Select correct species:'}
                          </p>
                          {row.candidates.map(c => (
                            <button
                              key={c.species_id}
                              onClick={() => !parsing && selectSpecies(row.rowIndex, c)}
                              disabled={parsing}
                              className="text-left px-3 py-1 rounded-lg text-xs text-green-200 hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ backgroundColor: '#1a2e1a' }}
                            >
                              {c.common_name} <span className="text-green-500 italic">{c.scientific_name}</span>
                              <span className="text-green-600 ml-1">{Math.round(c.match_score * 100)}%</span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <p className="text-yellow-400 text-xs">No candidates found</p>
                      )}
                      <button
                        onClick={() => skipRow(row.rowIndex)}
                        className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-red-400 transition-colors text-left mt-1"
                      >
                        Skip this row
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Importing stage ── */}
      {stage === 'importing' && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ backgroundColor: '#2a3f2a' }}>
          <div className="text-4xl">🦢</div>
          <p className="text-white font-medium" style={{ fontFamily: 'Georgia, serif' }}>Importing sightings…</p>
          <div className="w-full max-w-sm rounded-full h-3" style={{ backgroundColor: '#1a2e1a' }}>
            <div className="h-3 rounded-full bg-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-green-400 text-sm">{progress}% complete</p>
        </div>
      )}

      {/* ── Done stage ── */}
      {stage === 'done' && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center" style={{ backgroundColor: '#2a3f2a' }}>
          <div className="text-5xl">🎉</div>
          <h2 className="text-white text-2xl" style={{ fontFamily: 'Georgia, serif' }}>Import complete</h2>
          <p className="text-green-300 text-sm">
            <span className="text-white font-bold">{importedCount}</span> sightings imported successfully
            {errorCount > 0 && <span className="text-red-400 ml-2">· {errorCount} errors</span>}
          </p>
          <p className="text-green-500 text-xs">Imported sightings will appear in your app the next time you sync.</p>
          <button onClick={reset} className="mt-2 px-6 py-2 rounded-lg text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors">
            Import another file
          </button>
        </div>
      )}

    </div>
  )
}
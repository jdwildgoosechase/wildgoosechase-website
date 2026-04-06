'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface ClusterPoint {
  latitude: number
  longitude: number
  sighting_count: number
}

interface MapProps {
  points: ClusterPoint[]
}

export default function Map({ points }: MapProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!containerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    import('leaflet').then(L => {
      if (!containerRef.current) return
      delete (containerRef.current as any)._leaflet_id

      const map = L.default.map(containerRef.current, {
        worldCopyJump: false,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0,
        scrollWheelZoom: false,
        dragging: true,
      }).setView([0, 20], 2)

      mapRef.current = map

      let isDragging = false
      containerRef.current.addEventListener('mousedown', () => { isDragging = true })
      window.addEventListener('mouseup', () => { isDragging = false })

      containerRef.current.addEventListener('click', () => {
        map.scrollWheelZoom.enable()
      })

      containerRef.current.addEventListener('mouseleave', () => {
        if (!isDragging) {
          map.scrollWheelZoom.disable()
        }
      })

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO'
      }).addTo(map)

      const maxCount = Math.max(...points.map(p => p.sighting_count))

      points.forEach(point => {
        if (point.latitude && point.longitude) {
          const intensity = Math.sqrt(point.sighting_count / maxCount)
          const fillOpacity = 0.2 + (intensity * 0.75)

          const circle = L.default.circleMarker([point.latitude, point.longitude], {
            radius: 7,
            fillColor: '#388E3C',
            color: '#1B5E20',
            weight: 1,
            opacity: 0.9,
            fillOpacity
          }).addTo(map)

          circle.bindTooltip(
            `${point.sighting_count} sighting${point.sighting_count > 1 ? 's' : ''}`,
            { permanent: false, direction: 'top' }
          )
        }
      })

      setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }

  }, [points])

return (
      <div
        ref={containerRef}
        className="relative w-full rounded-xl shadow-sm border border-stone-200 overflow-hidden"
        style={{ height: '500px' }}
      >
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs z-[1000] pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#a5d6a7' }}
      >
        <span>🗺️</span>
        <span>Click to enable scroll zoom · Arrow keys to move</span>
      </div>
    </div>
  )
}
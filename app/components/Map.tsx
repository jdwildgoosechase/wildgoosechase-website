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
    if (mapRef.current) return
    if (!containerRef.current) return

    import('leaflet').then(L => {
      const map = L.default.map(containerRef.current!).setView([0, 20], 2)
      mapRef.current = map

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      const maxCount = Math.max(...points.map(p => p.sighting_count))

      points.forEach(point => {
        if (point.latitude && point.longitude) {

          // Scale opacity based on sighting count
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
    })

  }, [points])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl shadow-sm border border-stone-200 overflow-hidden"
      style={{ height: '500px' }}
    />
  )
} 
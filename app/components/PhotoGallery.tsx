'use client'

import { useEffect, useRef } from 'react'

interface Photo {
  photo_id: string
  file_path: string
  common_name: string
  sighting_date: string
  province_name: string
  country_name: string
}

interface PhotoGalleryProps {
  photos: Photo[]
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationId: number
    let position = 0
    const speed = 0.5

    const animate = () => {
      position += speed
      if (position >= container.scrollWidth / 2) {
        position = 0
      }
      container.scrollLeft = position
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Pause on hover
    container.addEventListener('mouseenter', () => cancelAnimationFrame(animationId))
    container.addEventListener('mouseleave', () => {
      animationId = requestAnimationFrame(animate)
    })

    return () => cancelAnimationFrame(animationId)
  }, [photos])

  if (!photos || photos.length === 0) return null

  const doubled = [...photos, ...photos]

  const getSupabaseUrl = (filePath: string) => {
    return filePath
  }

  return (
    <div className="w-full overflow-hidden bg-stone-900 py-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {doubled.map((photo, i) => (
          <div
            key={`${photo.photo_id}-${i}`}
            className="flex-shrink-0 relative group cursor-pointer"
            style={{ width: '280px', height: '200px' }}
          >
            <img
              src={getSupabaseUrl(photo.file_path)}
              alt={photo.common_name || 'Wildlife photo'}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                const card = (e.target as HTMLImageElement).closest('.flex-shrink-0') as HTMLElement
                if (card) card.style.display = 'none'
              }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-3">
              <div className="text-white font-semibold text-sm">{photo.common_name}</div>
              <div className="text-green-300 text-xs">{photo.sighting_date}</div>
              <div className="text-stone-300 text-xs">{photo.province_name}{photo.country_name ? `, ${photo.country_name}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 transition-colors"
      >
        <h2 className="text-green-900 text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          {title}
        </h2>
        <span className="text-green-600 text-xl">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="border-t border-stone-100">
          {children}
        </div>
      )}
    </div>
  )
}
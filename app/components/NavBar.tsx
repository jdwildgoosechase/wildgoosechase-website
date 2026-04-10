'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

interface NavBarProps {
  transparent?: boolean  // true = white text for use over hero images
}

export default function NavBar({ transparent = true }: NavBarProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  const textClass = transparent
    ? 'text-white hover:text-green-300'
    : 'text-green-900 hover:text-green-600'

  const buttonClass = transparent
    ? 'bg-green-600 hover:bg-green-500 text-white'
    : 'bg-green-700 hover:bg-green-600 text-white'

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Link
        href="/"
        style={{ fontFamily: 'Georgia, serif' }}
        className={`text-xl font-bold tracking-wide ${transparent ? 'text-white' : 'text-green-900'}`}
      >
        🦢 Wildgoosechase
      </Link>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="/" className={`transition-colors ${textClass}`}>Home</Link>
        <Link href="/about" className={`transition-colors ${textClass}`}>About</Link>
        <Link href="/gallery" className={`transition-colors ${textClass}`}>Gallery</Link>
        <Link href="/help" className={`transition-colors ${textClass}`}>Help</Link>

        {!loading && (
          <>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`transition-colors ${textClass}`}
                >
                  Dashboard
                </Link>
                <span className={`text-xs opacity-70 ${transparent ? 'text-green-300' : 'text-green-700'}`}>
                  {user.userName ?? user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${buttonClass}`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${buttonClass}`}
              >
                Sign In
              </Link>
            )}
          </>
        )}
      </nav>
    </div>
  )
}
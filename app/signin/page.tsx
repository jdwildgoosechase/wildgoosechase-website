'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import NavBar from '../components/NavBar'

export default function SignInPage() {
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('usr_user_profiles')
      .select('wcg_user_id')
      .eq('supabase_user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      setError('Account found but profile could not be loaded. Please contact support.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('wcg_user_id', profile.wcg_user_id)
    router.push('/dashboard')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://wildgoosechase-website.vercel.app/auth/confirm?type=recovery',
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#d4e8d4' }}>

      {/* ── Hero ── */}
        <div className="relative w-full h-64 flex-shrink-0 overflow-hidden">
            <img
                src="/hero.jpg"
                alt="Wildlife hero"
                className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50" style={{ pointerEvents: 'none' }} />
        <div className="absolute inset-0 flex flex-col">

          {/* ── Nav ── */}
        <div className="absolute top-0 left-0 right-0">
          <NavBar transparent={true} />
        </div>

          <div className="flex-1 flex items-center justify-center">
            <h1
              className="text-white text-4xl md:text-5xl drop-shadow-lg text-center px-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Sign In
            </h1>
          </div>

        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center px-4 py-12">

        {/* ── Card ── */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

          {mode === 'signin' && (
            <>
              <h2
                className="text-2xl text-green-900 mb-2 text-center"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Sign in to access your personal dashboard
              </p>

              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setMode('forgot'); setError(null) }}
                  className="text-sm text-green-800 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2
                className="text-2xl text-green-900 mb-2 text-center"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Enter your email and we will send you a reset link.
              </p>

              {resetSent ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">📬</div>
                  <p className="text-green-800 font-medium mb-1">Reset email sent</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Check your inbox for a link to reset your password.
                  </p>
                  <button
                    onClick={() => { setMode('signin'); setResetSent(false); setError(null) }}
                    className="text-sm text-green-800 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(null) }}
                      className="text-sm text-green-800 hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* ── New Here? ── */}
        <div className="w-full max-w-md mt-6 bg-white/60 rounded-2xl border border-green-200 p-6 text-center">
          <p
            className="text-green-900 text-lg mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            New here?
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Wildgoosechase accounts are created through the Android app.
            Download the app to get started — your account will work here automatically.
          </p>
          <a
            href="https://play.google.com/store/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-800 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Download on Google Play
          </a>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="bg-green-900 text-green-200 text-center text-xs py-4">
        © {new Date().getFullYear()} Wildgoosechase · All rights reserved
      </footer>

    </div>
  )
}
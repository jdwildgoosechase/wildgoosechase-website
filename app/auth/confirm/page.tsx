'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { supabase } from '../../../lib/supabase'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')

  const isSignup   = type === 'signup'
  const isRecovery = type === 'recovery'
  const isValid    = isSignup || isRecovery

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">
        {isSignup ? '✅' : isRecovery ? '🔑' : '🦢'}
      </div>

      <h1
        className="text-4xl font-bold mb-4"
        style={{ fontFamily: 'Pacifico, cursive', color: '#388E3C' }}
      >
        {isSignup
          ? 'Email Confirmed'
          : isRecovery
          ? 'Reset Your Password'
          : 'Nothing to see here'}
      </h1>

      {/* ── Signup confirmation ── */}
      {isSignup && (
        <p className="text-stone-600 text-lg max-w-md mx-auto leading-relaxed">
          Your Wildgoosechase account is ready. Go back to the app and sign in with your email and password.
        </p>
      )}

      {/* ── Recovery — password reset form ── */}
      {isRecovery && !done && (
        <div className="mt-4 text-left">
          <p className="text-stone-500 text-sm text-center mb-6">
            Enter your new password below.
          </p>
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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
              {loading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        </div>
      )}

      {/* ── Recovery — success message ── */}
      {isRecovery && done && (
        <div className="mt-4">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-green-800 font-medium mb-1">Password updated successfully</p>
          <p className="text-stone-500 text-sm">Redirecting you to your dashboard…</p>
        </div>
      )}

      {/* ── Invalid ── */}
      {!isValid && (
        <p className="text-stone-600 text-lg max-w-md mx-auto leading-relaxed">
          This page is for email confirmations only.
        </p>
      )}

      <div className="w-16 h-1 bg-green-600 rounded-full mx-auto my-8" />

      <a href="/" className="inline-block text-green-700 hover:text-green-600 underline text-sm">
        Back to Wildgoosechase
      </a>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      <div className="flex items-center gap-3 mb-12">
        <span className="text-3xl">🦢</span>
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: 'Pacifico, cursive', color: '#388E3C' }}
        >
          Wildgoosechase
        </span>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm px-10 py-12 max-w-lg w-full">
        <Suspense fallback={<div className="text-center text-stone-400">Loading...</div>}>
          <ConfirmContent />
        </Suspense>
      </div>

      <p className="mt-8 text-stone-400 text-xs">
        © Wildgoosechase — Personal Wildlife Tracker
      </p>

    </div>
  )
}
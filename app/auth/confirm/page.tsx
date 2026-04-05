'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const isSignup = type === 'signup'
  const isRecovery = type === 'recovery'
  const isValid = isSignup || isRecovery

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">
        {isSignup ? '✅' : isRecovery ? '🔑' : '🦢'}
      </div>

      <h1
        className="text-4xl font-bold mb-4"
        style={{ fontFamily: 'Pacifico, cursive', color: '#388E3C' }}
      >
        {isSignup ? 'Email Confirmed' : isRecovery ? 'Password Reset' : 'Nothing to see here'}
      </h1>

      <p className="text-stone-600 text-lg max-w-md mx-auto leading-relaxed">
        {isSignup
          ? 'Your Wildgoosechase account is ready. Go back to the app and sign in with your email and password.'
          : isRecovery
          ? 'Your password reset link was received. Go back to the Wildgoosechase app and follow the instructions to set your new password.'
          : 'This page is for email confirmations only.'}
      </p>

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
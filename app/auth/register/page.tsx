'use client'

import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join VoiceCare</h1>
            <p className="text-purple-100">Create your account</p>
          </div>

          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-2">🚧 Coming Soon</h3>
            <p className="text-purple-100 mb-4">
              User registration is being developed with the following features:
            </p>
            <ul className="text-purple-100 space-y-2">
              <li>• Role-based account creation (Patient, Nurse, Admin)</li>
              <li>• Language preference selection</li>
              <li>• Voice preference setup</li>
              <li>• Email verification</li>
              <li>• Security compliance</li>
            </ul>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              Already have an account? <span className="underline">Sign in here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
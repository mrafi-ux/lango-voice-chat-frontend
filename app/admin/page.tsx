'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
  preferred_lang: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem('voicecare_token')
    const userData = localStorage.getItem('voicecare_user')
    
    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        router.push('/chat')
        return
      }
      setUser(parsedUser)
    } catch (error) {
      localStorage.removeItem('voicecare_token')
      localStorage.removeItem('voicecare_user')
      router.push('/auth/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('voicecare_token')
    localStorage.removeItem('voicecare_user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-gray-800">
                Voice<span className="text-blue-600">Care</span>
              </Link>
              <div className="text-gray-600 text-sm">Admin Dashboard</div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm bg-gradient-to-r from-blue-500 to-blue-600">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">3</p>
              </div>
              <div className="text-3xl opacity-80">👥</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Conversations</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <div className="text-3xl opacity-80">💬</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Messages Today</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <div className="text-3xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-white border border-gray-200 text-gray-700 p-4 rounded-xl text-center hover:bg-gray-50 transition-all">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium">Manage Users</div>
            </button>
            <button className="bg-white border border-gray-200 text-gray-700 p-4 rounded-xl text-center hover:bg-gray-50 transition-all">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium">View Conversations</div>
            </button>
            <Link href="/settings/languages" className="bg-white border border-gray-200 text-gray-700 p-4 rounded-xl text-center hover:bg-gray-50 transition-all">
              <div className="text-2xl mb-2">🌍</div>
              <div className="font-medium">Language Settings</div>
            </Link>
            <button className="bg-white border border-gray-200 text-gray-700 p-4 rounded-xl text-center hover:bg-gray-50 transition-all">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium">Analytics</div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">System Status</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Whisper STT', status: 'online', color: 'green' },
              { name: 'ElevenLabs TTS', status: 'online', color: 'green' },
              { name: 'Translation API', status: 'online', color: 'green' },
              { name: 'WebSocket Server', status: 'online', color: 'green' }
            ].map((service) => (
              <div key={service.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{service.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{service.status}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full bg-${service.color}-400 animate-pulse`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
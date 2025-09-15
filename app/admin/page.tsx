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
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-white">
                Voice<span className="text-purple-300">Care</span>
              </Link>
              <div className="text-purple-100">Admin Dashboard</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-red-500">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-white">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-purple-200">Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary px-4 py-2 rounded-lg text-sm"
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
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Users</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Active Conversations</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="text-3xl">💬</div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Messages Today</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">👤</div>
              <div>Manage Users</div>
            </button>
            <button className="btn-primary p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">💬</div>
              <div>View Conversations</div>
            </button>
            <Link href="/settings/languages" className="btn-secondary p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">🌍</div>
              <div>Language Settings</div>
            </Link>
            <button className="btn-secondary p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">📈</div>
              <div>Analytics</div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">System Status</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Whisper STT', status: 'online', color: 'green' },
              { name: 'ElevenLabs TTS', status: 'online', color: 'green' },
              { name: 'Translation API', status: 'online', color: 'green' },
              { name: 'WebSocket Server', status: 'online', color: 'green' }
            ].map((service) => (
              <div key={service.name} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-purple-200 capitalize">{service.status}</div>
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